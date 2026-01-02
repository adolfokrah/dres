import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:dres/features/splash/splash.dart';
import 'package:dres/features/home/home.dart';
import 'package:dres/features/sell/sell.dart';
import 'package:dres/features/favorites/presentation/view/favorites_screen.dart';
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
import 'package:dres/features/cart/presentation/view/checkout_screen.dart';
import 'package:dres/features/cart/presentation/view/addresses_screen.dart';
import 'package:dres/features/cart/presentation/view/add_address_screen.dart';
import 'package:dres/features/cart/presentation/view/direct_shipping_info_screen.dart';
import 'package:dres/features/cart/data/models/shipping_address.dart';
import 'package:dres/features/orders/presentation/view/purchase_details_screen.dart';
import 'package:dres/features/orders/presentation/view/return_item_screen.dart';
import 'package:dres/features/profile/presentation/view/user_profile_screen.dart';
import 'package:dres/features/orders/presentation/view/incoming_order_details_screen.dart';
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
  
  // Store pending deep link to navigate after splash
  static String? pendingDeepLink;

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
      // Uses /products/:id to match web URL format for deep linking
      GoRoute(
        path: '/products/:id',
        name: 'product-details',
        parentNavigatorKey: _rootNavigatorKey,
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
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const CartScreen(),
      ),
      
      // Checkout (outside shell, full screen)
      GoRoute(
        path: '/checkout',
        name: 'checkout',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const CheckoutScreen(),
      ),
      
      // Order Details (outside shell, full screen)
      GoRoute(
        path: '/orders/:id',
        name: 'order-details',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return PurchaseDetailsScreen(orderId: id);
        },
      ),
      
      // Incoming Order Details (seller's view, outside shell)
      GoRoute(
        path: '/incoming-orders/:id',
        name: 'incoming-order-details',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return IncomingOrderDetailsScreen(orderId: id);
        },
      ),
      
      // Return Item (outside shell, full screen)
      GoRoute(
        path: '/orders/:orderId/return/:itemId',
        name: 'return-item',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) {
          final orderId = state.pathParameters['orderId']!;
          final itemId = state.pathParameters['itemId']!;
          return ReturnItemScreen(orderId: orderId, itemId: itemId);
        },
      ),
      
      // Addresses (outside shell, full screen)
      GoRoute(
        path: '/addresses',
        name: 'addresses',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) {
          final isSelecting = state.uri.queryParameters['selecting'] == 'true';
          return AddressesScreen(isSelecting: isSelecting);
        },
      ),
      
      // Add Address (outside shell, full screen)
      GoRoute(
        path: '/add-address',
        name: 'add-address',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const AddAddressScreen(),
      ),
      
      // Edit Address (outside shell, full screen)
      GoRoute(
        path: '/edit-address',
        name: 'edit-address',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) {
          final address = state.extra as ShippingAddress?;
          return AddAddressScreen(addressToEdit: address);
        },
      ),
      
      // Direct Shipping Info (outside shell, full screen)
      GoRoute(
        path: '/direct-shipping-info',
        name: 'direct-shipping-info',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const DirectShippingInfoScreen(),
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
                          // Support both extra data and query parameters
                          final extra = state.extra as Map<String, dynamic>?;
                          final queryParams = state.uri.queryParameters;
                          
                          // Query params take priority, then extra data
                          final departmentId = queryParams['departmentId'] ?? 
                              queryParams['department'] ?? 
                              extra?['departmentId'] as String?;
                          final categoryId = queryParams['categoryId'] ?? 
                              queryParams['category'] ?? 
                              extra?['categoryId'] as String?;
                          final collectionId = queryParams['collectionId'] ?? 
                              queryParams['collection'] ?? 
                              extra?['collectionId'] as String?;
                          final brandId = queryParams['brandId'] ?? 
                              queryParams['brand'] ?? 
                              extra?['brandId'] as String?;
                          final filterType = queryParams['filterType'] ?? 
                              extra?['filterType'] as String?;
                          final title = queryParams['title'] ?? 
                              extra?['title'] as String? ?? 
                              'Products';
                          
                          return ProductsScreen(
                            departmentId: departmentId,
                            categoryId: categoryId,
                            collectionId: collectionId,
                            brandId: brandId,
                            filterType: filterType,
                            title: title,
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
                builder: (context, state) => const FavoritesScreen(),
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
                routes: [
                  // User Profile (nested under profile tab)
                  GoRoute(
                    path: 'user',
                    name: 'user-profile',
                    builder: (context, state) {
                      final userId = state.uri.queryParameters['userId'];
                      return UserProfileScreen(userId: userId);
                    },
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    ],
  );
}
