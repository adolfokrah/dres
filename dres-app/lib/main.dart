import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:app_links/app_links.dart';
import 'package:dres/firebase_options.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/core/theme/theme.dart';
import 'package:dres/l10n/app_localizations.dart';
import 'package:dres/routes.dart';
import 'package:dres/features/splash/logic/menu_bloc/menu_bloc.dart';
import 'package:dres/features/splash/logic/menu_bloc/menu_event.dart';
import 'package:dres/features/home/logic/bloc/home_bloc.dart';
import 'package:dres/features/home/logic/bloc/home_event.dart';
import 'package:dres/features/shop/logic/products_bloc/products_bloc.dart';
import 'package:dres/features/shop/logic/brands_bloc/brands_bloc.dart';
import 'package:dres/features/product_details/logic/product_details_bloc/product_details_bloc.dart';
import 'package:dres/features/auth/logic/auth_bloc/auth_bloc.dart';
import 'package:dres/features/cart/logic/cart_bloc/cart_bloc.dart';
import 'package:dres/features/cart/logic/cart_bloc/cart_event.dart';
import 'package:dres/features/favorites/logic/favorites_bloc/favorites_bloc.dart';
import 'package:dres/features/notifications/logic/notifications_bloc/notifications_bloc.dart';
import 'package:dres/features/profile/logic/user_products_bloc/user_products_bloc.dart';
import 'package:dres/features/profile/logic/seller_products_bloc/seller_products_bloc.dart';
import 'package:dres/core/services/storage_service.dart';
import 'package:dres/core/services/site_settings_service.dart';

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
  
  // Fetch site settings from CMS
  await getIt<SiteSettingsService>().fetchSettings();
  
  // Check for initial deep link (cold start)
  final appLinks = AppLinks();
  final initialLink = await appLinks.getInitialLink();
  if (initialLink != null) {
    
    // Construct the full path from host + path
    String fullPath;
    if (initialLink.host.isNotEmpty) {
      fullPath = '/${initialLink.host}${initialLink.path}';
    } else {
      fullPath = initialLink.path;
    }
    AppRoutes.pendingDeepLink = fullPath;
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
      // Construct the full path from host + path
      // dres://products/slug => host=products, path=/slug => /products/slug
      String fullPath;
      if (uri.host.isNotEmpty) {
        fullPath = '/${uri.host}${uri.path}';
      } else {
        fullPath = uri.path;
      }
      
      
      if (fullPath.isNotEmpty && fullPath != '/') {
        // Use push to add on top of current stack (avoid shell conflict)
        AppRoutes.router.push(fullPath);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        // Global MenuBloc - fetch menu once and share across app
        BlocProvider<MenuBloc>(
          create: (_) => getIt<MenuBloc>()..add(const FetchMenu()),
          lazy: false, // Load immediately
        ),
        // Global HomeBloc - fetch home page based on user department
        BlocProvider<HomeBloc>(
          create: (_) {
            final storageService = getIt<StorageService>();
            final department = storageService.getUserDepartment() ?? 'men';
            final pageSlug = department == 'women' ? 'home-women' : 'home';
            return getIt<HomeBloc>()..add(FetchHomePage(slug: pageSlug));
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
        // Note: SellerProductsBloc, CommunityBloc, SellerReviewsBloc are now created
        // locally in their respective widgets as factory instances
      ],
      // Listen for auth state changes to fetch favorites when user logs in
      child: BlocListener<AuthBloc, AuthState>(
        bloc: getIt<AuthBloc>(),
        listenWhen: (previous, current) => 
            previous.status != AuthStatus.authenticated && 
            current.status == AuthStatus.authenticated,
        listener: (context, state) {
          // User just logged in, fetch favorites, cart, and notifications
          getIt<FavoritesBloc>().add(const FavoritesFetchRequested());
          getIt<CartBloc>().add(const CartFetchRequested());
          getIt<NotificationsBloc>().add(const NotificationsUnreadCountRequested());
        },
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
          ],
          
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
      ),
    );
  }
}
