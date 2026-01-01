import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:firebase_core/firebase_core.dart';
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
import 'package:dres/core/services/storage_service.dart';

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
  
  runApp(const MainApp());
}

class MainApp extends StatelessWidget {
  const MainApp({super.key});

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
        // AuthBloc - for authentication
        BlocProvider<AuthBloc>(
          create: (_) => getIt<AuthBloc>(),
          lazy: true,
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
      ],
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
    );
  }
}
