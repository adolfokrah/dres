import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:dres/features/splash/splash.dart';
import 'package:dres/features/home/home.dart';
import 'package:dres/features/sell/sell.dart';
import 'package:dres/features/favourite/favourite.dart';
import 'package:dres/features/profile/profile.dart';
import 'package:dres/features/shop/presentation/view/shop_screen.dart';
import 'package:dres/features/shop/presentation/view/categories_screen.dart';
import 'package:dres/features/shop/presentation/view/brands_screen.dart';
import 'package:dres/features/shop/presentation/view/products_screen.dart';
import 'package:dres/features/product_details/presentation/view/product_details_screen.dart';
import 'package:dres/features/auth/presentation/view/auth_home_screen.dart';
import 'package:dres/features/auth/presentation/view/auth_callback_screen.dart';
import 'package:dres/features/auth/presentation/view/login_screen.dart';
import 'package:dres/features/auth/presentation/view/register_screen.dart';
import 'package:dres/features/auth/presentation/view/forgot_password_screen.dart';
import 'package:dres/features/cart/presentation/view/cart_screen.dart';
import 'package:dres/core/widgets/main_shell.dart';
import 'package:dres/core/models/menu_model.dart';

// Navigator keys for each tab
final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorHomeKey = GlobalKey<NavigatorState>(debugLabel: 'home');
final _shellNavigatorDiscoverKey = GlobalKey<NavigatorState>(debugLabel: 'discover');
final _shellNavigatorSellKey = GlobalKey<NavigatorState>(debugLabel: 'sell');
final _shellNavigatorFavouriteKey = GlobalKey<NavigatorState>(debugLabel: 'favourite');
final _shellNavigatorProfileKey = GlobalKey<NavigatorState>(debugLabel: 'profile');

class AppRoutes {
  AppRoutes._();

  // Route paths
  static const String splash = '/splash';
  static const String home = '/home';
  static const String shop = '/shop';
  static const String discover = '/discover';
  static const String categories = 'categories';
  static const String products = 'products';
  static const String sell = '/sell';
  static const String favourite = '/favourite';
  static const String profile = '/profile';

  // Router configuration
  static final GoRouter router = GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: splash,
    // Handle unknown routes (like Firebase auth callbacks)
    errorBuilder: (context, state) {
      // If it's a Firebase auth callback URL, show the callback handler
      final uri = state.uri.toString();
      if (uri.contains('firebaseauth') || uri.startsWith('app-1-')) {
        return const AuthCallbackScreen();
      }
      // For other unknown routes, redirect to home
      return const SplashScreen();
    },
    routes: [
      // Splash (outside shell)
      GoRoute(
        path: splash,
        name: 'splash',
        builder: (context, state) => const SplashScreen(),
      ),
      
      // Auth (outside shell, full screen)
      GoRoute(
        path: '/auth',
        name: 'auth',
        builder: (context, state) => const AuthHomeScreen(),
      ),
      
      // Login (outside shell, full screen)
      GoRoute(
        path: '/login',
        name: 'login',
        builder: (context, state) => const LoginScreen(),
      ),
      
      // Register (outside shell, full screen)
      GoRoute(
        path: '/register',
        name: 'register',
        builder: (context, state) => const RegisterScreen(),
      ),
      
      // Forgot Password (outside shell, full screen)
      GoRoute(
        path: '/forgot-password',
        name: 'forgot-password',
        builder: (context, state) => const ForgotPasswordScreen(),
      ),
      
      // Product Details (outside shell, full screen)
      GoRoute(
        path: '/product/:id',
        name: 'product-details',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          final skuId = state.uri.queryParameters['skuId'];
          return ProductDetailsScreen(
            id: id,
            skuId: skuId,
          );
        },
      ),
      
      // Cart (outside shell, full screen)
      GoRoute(
        path: '/cart',
        name: 'cart',
        builder: (context, state) => const CartScreen(),
      ),
      
      // Main shell with bottom navigation
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return MainShell(navigationShell: navigationShell);
        },
        branches: [
          // Home tab
          StatefulShellBranch(
            navigatorKey: _shellNavigatorHomeKey,
            routes: [
              GoRoute(
                path: home,
                name: 'home',
                builder: (context, state) => const HomeScreen(),
                // Add nested routes here:
                // routes: [
                //   GoRoute(
                //     path: 'product/:id',
                //     builder: (context, state) => ProductScreen(id: state.pathParameters['id']!),
                //   ),
                // ],
              ),
            ],
          ),
          
          // Discover tab (Shop)
          StatefulShellBranch(
            navigatorKey: _shellNavigatorDiscoverKey,
            routes: [
              GoRoute(
                path: discover,
                name: 'discover',
                builder: (context, state) => const ShopScreen(),
                routes: [
                  GoRoute(
                    path: 'brands',
                    name: 'brands',
                    builder: (context, state) {
                      final extra = state.extra as Map<String, dynamic>?;
                      if (extra == null) {
                        return const Scaffold(
                          body: Center(child: Text('No department data')),
                        );
                      }
                      return BrandsScreen(
                        departmentId: extra['departmentId'] as String,
                        departmentName: extra['departmentName'] as String,
                      );
                    },
                  ),
                  GoRoute(
                    path: categories,
                    name: 'categories',
                    builder: (context, state) {
                      final extra = state.extra as Map<String, dynamic>?;
                      if (extra == null) {
                        return const Scaffold(
                          body: Center(child: Text('No collection data')),
                        );
                      }
                      return CategoriesScreen(
                        collection: extra['collection'] as CollectionModel,
                        departmentName: extra['departmentName'] as String,
                        departmentId: extra['departmentId'] as String,
                      );
                    },
                    routes: [
                      GoRoute(
                        path: products,
                        name: 'products',
                        builder: (context, state) {
                          final extra = state.extra as Map<String, dynamic>?;
                          if (extra == null) {
                            return const Scaffold(
                              body: Center(child: Text('No product data')),
                            );
                          }
                          return ProductsScreen(
                            departmentId: extra['departmentId'] as String?,
                            categoryId: extra['categoryId'] as String?,
                            collectionId: extra['collectionId'] as String?,
                            brandId: extra['brandId'] as String?,
                            filterType: extra['filterType'] as String?,
                            title: extra['title'] as String,
                          );
                        },
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
          
          // Sell tab
          StatefulShellBranch(
            navigatorKey: _shellNavigatorSellKey,
            routes: [
              GoRoute(
                path: sell,
                name: 'sell',
                builder: (context, state) => const SellScreen(),
              ),
            ],
          ),
          
          // Favourite tab
          StatefulShellBranch(
            navigatorKey: _shellNavigatorFavouriteKey,
            routes: [
              GoRoute(
                path: favourite,
                name: 'favourite',
                builder: (context, state) => const FavouriteScreen(),
              ),
            ],
          ),
          
          // Profile tab
          StatefulShellBranch(
            navigatorKey: _shellNavigatorProfileKey,
            routes: [
              GoRoute(
                path: profile,
                name: 'profile',
                builder: (context, state) => const ProfileScreen(),
              ),
            ],
          ),
        ],
      ),
    ],
  );
}
