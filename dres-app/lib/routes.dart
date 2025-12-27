import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:dres/features/splash/splash.dart';
import 'package:dres/features/home/home.dart';
import 'package:dres/features/sell/sell.dart';
import 'package:dres/features/favourite/favourite.dart';
import 'package:dres/features/profile/profile.dart';
import 'package:dres/features/shop/presentation/view/shop_screen.dart';
import 'package:dres/features/shop/presentation/view/categories_screen.dart';
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
  static const String sell = '/sell';
  static const String favourite = '/favourite';
  static const String profile = '/profile';

  // Router configuration
  static final GoRouter router = GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: splash,
    routes: [
      // Splash (outside shell)
      GoRoute(
        path: splash,
        name: 'splash',
        builder: (context, state) => const SplashScreen(),
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
                    path: categories,
                    name: 'categories',
                    builder: (context, state) {
                      final extra = state.extra as Map<String, dynamic>?;
                      if (extra == null) {
                        // Fallback if extra is null
                        return const Scaffold(
                          body: Center(child: Text('No collection data')),
                        );
                      }
                      return CategoriesScreen(
                        collection: extra['collection'] as CollectionModel,
                        departmentName: extra['departmentName'] as String,
                      );
                    },
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
