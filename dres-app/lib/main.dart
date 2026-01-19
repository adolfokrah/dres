import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:app_links/app_links.dart';
import 'package:provider/provider.dart';
import 'package:loader_overlay/loader_overlay.dart';
import 'package:dres/firebase_options.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/core/theme/theme.dart';
import 'package:dres/core/providers/locale_provider.dart';
import 'package:dres/core/widgets/restart_widget.dart';
import 'package:dres/l10n/app_localizations.dart';
import 'package:dres/routes.dart';
import 'package:dres/features/splash/logic/menu_bloc/menu_bloc.dart';
import 'package:dres/features/splash/logic/menu_bloc/menu_event.dart';
import 'package:dres/features/home/logic/bloc/home_bloc.dart';
import 'package:dres/features/home/logic/bloc/home_event.dart';
import 'package:dres/features/home/logic/bloc/home_state.dart';
import 'package:dres/features/shop/logic/products_bloc/products_bloc.dart';
import 'package:dres/features/shop/logic/brands_bloc/brands_bloc.dart';
import 'package:dres/features/product_details/logic/product_details_bloc/product_details_bloc.dart';
import 'package:dres/features/auth/logic/auth_bloc/auth_bloc.dart';
import 'package:dres/features/cart/logic/cart_bloc/cart_bloc.dart';
import 'package:dres/features/cart/logic/cart_bloc/cart_event.dart';
import 'package:dres/features/favorites/logic/favorites_bloc/favorites_bloc.dart';
import 'package:dres/features/notifications/logic/notifications_bloc/notifications_bloc.dart';
import 'package:dres/features/profile/logic/user_products_bloc/user_products_bloc.dart';
import 'package:dres/features/follows/logic/follows_bloc/follows_bloc.dart';
import 'package:dres/features/saved_searches/logic/saved_searches_bloc/saved_searches_bloc.dart';
import 'package:dres/core/services/storage_service.dart';
import 'package:dres/core/services/site_settings_service.dart';
import 'package:dres/core/services/push_notification_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Load environment variables
  await dotenv.load(fileName: ".env");
  
  // Initialize Firebase with platform-specific options
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  
  // Setup dependency injection
  await setupDependencies();
  
  // Initialize push notifications
  await getIt<PushNotificationService>().initialize();
  
  // Fetch site settings from CMS
  await getIt<SiteSettingsService>().fetchSettings();
  
  // Check for initial deep link (cold start)
  final appLinks = AppLinks();
  final initialLink = await appLinks.getInitialLink();
  if (initialLink != null) {
    debugPrint('🔗 Initial deep link: $initialLink');
    
    String fullPath;
    if (initialLink.scheme == 'dres') {
      // Custom scheme: dres://products/slug => host=products, path=/slug => /products/slug
      if (initialLink.host.isNotEmpty) {
        fullPath = '/${initialLink.host}${initialLink.path}';
      } else {
        fullPath = initialLink.path;
      }
    } else {
      // HTTP/HTTPS: https://dres.app/products/slug => just use path: /products/slug
      fullPath = initialLink.path;
    }
    
    AppRoutes.pendingDeepLink = fullPath;
    debugPrint('🔗 Pending deep link set to: $fullPath');
  } else {
    debugPrint('🔗 No initial deep link');
  }
  
  runApp(MainApp(appLinks: appLinks));
}

class MainApp extends StatefulWidget {
  const MainApp({super.key, required this.appLinks});
  
  final AppLinks appLinks;

  @override
  State<MainApp> createState() => _MainAppState();
}

class _MainAppState extends State<MainApp> {
  @override
  void initState() {
    super.initState();
    // Listen for deep links while app is running (warm start)
    widget.appLinks.uriLinkStream.listen((uri) {
      debugPrint('🔗 Runtime deep link received: $uri');
      
      String fullPath;
      if (uri.scheme == 'dres') {
        // Custom scheme: dres://products/slug => host=products, path=/slug => /products/slug
        if (uri.host.isNotEmpty) {
          fullPath = '/${uri.host}${uri.path}';
        } else {
          fullPath = uri.path;
        }
      } else {
        // HTTP/HTTPS: https://dres.app/products/slug => just use path: /products/slug
        fullPath = uri.path;
      }
      
      debugPrint('🔗 Navigating to: $fullPath');
      if (fullPath.isNotEmpty && fullPath != '/') {
        // Use push to add on top of current stack (avoid shell conflict)
        AppRoutes.router.push(fullPath);
        debugPrint('🔗 Navigation pushed');
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return RestartWidget(
      child: MultiBlocProvider(
      providers: [
        // Global MenuBloc - fetch menu once and share across app
        BlocProvider<MenuBloc>(
          create: (_) => getIt<MenuBloc>()..add(const FetchMenu()),
          lazy: false, // Load immediately
        ),
        // Global HomeBloc - fetch home page based on user department
        BlocProvider<HomeBloc>(
          create: (_) {
            final bloc = getIt<HomeBloc>();
            final storageService = getIt<StorageService>();
            final department = storageService.getUserDepartment() ?? 'men';
            final pageSlug = department == 'women' ? 'home-women' : 'home';
            // Always fetch on app start - use RefreshHomePage to force reload
            bloc.add(RefreshHomePage(slug: pageSlug));
            return bloc;
          },
          lazy: false, // Load immediately
        ),
        // ProductsBloc - for products listing
        BlocProvider<ProductsBloc>(
          create: (_) => getIt<ProductsBloc>(),
          lazy: true,
        ),
        // BrandsBloc - for brands listing
        BlocProvider<BrandsBloc>(
          create: (_) => getIt<BrandsBloc>(),
          lazy: true,
        ),
        // ProductDetailsBloc - for product details page
        BlocProvider<ProductDetailsBloc>(
          create: (_) => getIt<ProductDetailsBloc>(),
          lazy: true,
        ),
        // AuthBloc - for authentication (check status on startup)
        BlocProvider<AuthBloc>(
          create: (_) {
            final authBloc = getIt<AuthBloc>();
            // Check auth status on startup
            authBloc.add(const AuthCheckStatusRequested());
            return authBloc;
          },
          lazy: false, // Load immediately to check auth status
        ),
        // CartBloc - for shopping cart (singleton, fetches on startup if logged in)
        BlocProvider<CartBloc>(
          create: (_) {
            final cartBloc = getIt<CartBloc>();
            // Fetch cart on startup if user is logged in
            final storageService = getIt<StorageService>();
            storageService.getToken().then((token) {
              if (token != null && token.isNotEmpty) {
                cartBloc.add(const CartFetchRequested());
              }
            });
            return cartBloc;
          },
          lazy: false, // Load immediately
        ),
        // FavoritesBloc - for favorites (singleton, fetches on startup if logged in)
        BlocProvider<FavoritesBloc>(
          create: (_) {
            final favoritesBloc = getIt<FavoritesBloc>();
            // Fetch favorites on startup if user is logged in
            final storageService = getIt<StorageService>();
            storageService.getToken().then((token) {
              if (token != null && token.isNotEmpty) {
                favoritesBloc.add(const FavoritesFetchRequested());
              }
            });
            return favoritesBloc;
          },
          lazy: false, // Load immediately
        ),
        // NotificationsBloc - for notifications (singleton, fetches unread count on startup if logged in)
        BlocProvider<NotificationsBloc>(
          create: (_) {
            final notificationsBloc = getIt<NotificationsBloc>();
            // Fetch unread count on startup if user is logged in
            final storageService = getIt<StorageService>();
            storageService.getToken().then((token) {
              if (token != null && token.isNotEmpty) {
                notificationsBloc.add(const NotificationsUnreadCountRequested());
              }
            });
            return notificationsBloc;
          },
          lazy: false, // Load immediately
        ),
        // UserProductsBloc - for user's published products (singleton)
        BlocProvider<UserProductsBloc>(
          create: (_) => getIt<UserProductsBloc>(),
        ),
        // FollowsBloc - for follow state + community (followers/following list)
        BlocProvider<FollowsBloc>(
          create: (_) => getIt<FollowsBloc>(),
        ),
        // SavedSearchesBloc - for user's saved searches (singleton)
        BlocProvider<SavedSearchesBloc>(
          create: (_) => getIt<SavedSearchesBloc>(),
        ),
        // Note: SellerProductsBloc, SellerReviewsBloc are now created
        // locally in their respective widgets as factory instances
      ],
      // Listen for auth state changes to fetch favorites when user logs in
      child: ChangeNotifierProvider(
        create: (_) => LocaleProvider(),
        child: BlocListener<AuthBloc, AuthState>(
          bloc: getIt<AuthBloc>(),
          listenWhen: (previous, current) {
            // Listen when user authenticates OR when language changes
            final authChanged = previous.status != AuthStatus.authenticated && 
                current.status == AuthStatus.authenticated;
            final languageChanged = previous.user?.language != current.user?.language;
            return authChanged || languageChanged;
          },
          listener: (context, state) {
            // User just logged in, fetch favorites, cart, and notifications
            if (state.status == AuthStatus.authenticated) {
              getIt<FavoritesBloc>().add(const FavoritesFetchRequested());
              getIt<CartBloc>().add(const CartFetchRequested());
              getIt<NotificationsBloc>().add(const NotificationsUnreadCountRequested());
              getIt<SavedSearchesBloc>().add(const SavedSearchesFetchRequested());
              
              // Initialize FollowsBloc with user's follower/following counts
              if (state.user != null) {
                getIt<FollowsBloc>().add(MyFollowCountsInitRequested(
                  followersCount: state.user!.followersCount ?? 0,
                  followingCount: state.user!.followingCount ?? 0,
                ));
              }
            }
            
            // Update locale based on user's language preference
            if (state.user?.language != null) {
              context.read<LocaleProvider>().setLocale(state.user!.language!);
            }
          },
          child: Consumer<LocaleProvider>(
            builder: (context, localeProvider, child) {
              return GlobalLoaderOverlay(
                overlayColor: Colors.black.withValues(alpha: 0.5),
                child: MaterialApp.router(
                  debugShowCheckedModeBanner: false,
                  title: 'DRES',
                  theme: AppTheme.theme,
                  
                  // Localization
                  localizationsDelegates: const [
                    AppLocalizations.delegate,
                    GlobalMaterialLocalizations.delegate,
                    GlobalWidgetsLocalizations.delegate,
                    GlobalCupertinoLocalizations.delegate,
                  ],
                  supportedLocales: const [
                    Locale('en'),
                    Locale('fr'),
                  ],
                  locale: localeProvider.locale,
                  
                  // GoRouter
                  routerConfig: AppRoutes.router,
                  
                  // Wrap with SafeArea on Android
                  builder: (context, child) {
                    if (Platform.isAndroid) {
                      return SafeArea(
                        top: false,
                        bottom: true,
                        child: child ?? const SizedBox.shrink(),
                      );
                    }
                    return child ?? const SizedBox.shrink();
                  },
                ),
              );
            },
          ),
        ),
      ),
    ),
    );
  }
}
