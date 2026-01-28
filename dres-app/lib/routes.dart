import 'dart:io';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:dres/features/splash/splash.dart';
import 'package:dres/features/home/home.dart';
import 'package:dres/features/sell/sell.dart';
import 'package:dres/features/sell/presentation/view/style_details_screen.dart';
import 'package:dres/features/sell/presentation/view/style_overview_screen.dart';
import 'package:dres/features/sell/presentation/view/variation_detail_screen.dart';
import 'package:dres/features/sell/presentation/view/sku_detail_screen.dart';
import 'package:dres/features/sell/presentation/view/select_department_screen.dart';
import 'package:dres/features/sell/presentation/view/select_collection_screen.dart';
import 'package:dres/features/sell/presentation/view/select_category_screen.dart';
import 'package:dres/features/sell/presentation/view/select_brand_screen.dart';
import 'package:dres/features/sell/presentation/view/boost_style_screen.dart';
import 'package:dres/features/sell/presentation/view/style_stats_screen.dart';
import 'package:dres/features/sell/presentation/view/seller_onboarding_screen.dart';
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
import 'package:dres/features/profile/presentation/view/seller_profile_screen.dart';
import 'package:dres/features/profile/presentation/view/personal_info_screen.dart';
import 'package:dres/features/profile/presentation/view/vacation_mode_screen.dart';
import 'package:dres/features/profile/presentation/view/withdrawal_account_screen.dart';
import 'package:dres/features/profile/presentation/view/shipping_rates_screen.dart';
import 'package:dres/features/orders/presentation/view/incoming_order_details_screen.dart';
import 'package:dres/features/notifications/presentation/view/notifications_screen.dart';
import 'package:dres/features/search/presentation/view/search_screen.dart';
import 'package:dres/features/saved_searches/presentation/view/saved_searches_screen.dart';
import 'package:dres/features/variations/presentation/view/photo_tips_screen.dart';
import 'package:dres/features/sell/presentation/view/image_management_screen.dart';
import 'package:dres/features/reviews/presentation/view/create_review_screen.dart';
import 'package:dres/core/widgets/main_shell.dart';
import 'package:dres/core/models/menu_model.dart';

// Navigator keys for each tab
final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorHomeKey = GlobalKey<NavigatorState>(debugLabel: 'home');
final _shellNavigatorDiscoverKey = GlobalKey<NavigatorState>(
  debugLabel: 'discover',
);
final _shellNavigatorSellKey = GlobalKey<NavigatorState>(debugLabel: 'sell');
final _shellNavigatorFavouriteKey = GlobalKey<NavigatorState>(
  debugLabel: 'favourite',
);
final _shellNavigatorProfileKey = GlobalKey<NavigatorState>(
  debugLabel: 'profile',
);

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
  static const String savedSearches = '/saved-searches';

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
          return ProductDetailsScreen(id: id, skuId: skuId);
        },
      ),

      // Products listing (outside shell, full screen - used by search)
      GoRoute(
        path: '/products',
        name: 'products-listing',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) {
          final queryParams = state.uri.queryParameters;

          final query = queryParams['query'];
          final departmentId =
              queryParams['departmentId'] ?? queryParams['department'];
          final categoryId =
              queryParams['categoryId'] ?? queryParams['category'];
          final collectionId =
              queryParams['collectionId'] ?? queryParams['collection'];
          final styleId = queryParams['styleId'] ?? queryParams['style'];
          final brandId = queryParams['brandId'] ?? queryParams['brand'];
          final filterType = queryParams['filterType'];
          final title = queryParams['title'] ?? 'Products';

          return ProductsScreen(
            query: query,
            departmentId: departmentId,
            categoryId: categoryId,
            collectionId: collectionId,
            styleId: styleId,
            brandId: brandId,
            filterType: filterType,
            title: title,
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

      // Notifications (outside shell, full screen)
      GoRoute(
        path: '/notifications',
        name: 'notifications',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const NotificationsScreen(),
      ),

      // Photo Tips (outside shell, full screen)
      GoRoute(
        path: '/photo-tips',
        name: 'photo-tips',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const PhotoTipsScreen(),
      ),

      // Image Management (outside shell, full screen)
      GoRoute(
        path: '/image-management',
        name: 'image-management',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          return ImageManagementScreen(
            existingImages: (extra?['existingImages'] as List?)?.cast<Map<String, dynamic>>() ?? [],
            selectedImages: (extra?['selectedImages'] as List<File>?) ?? [],
            onImagesChanged: extra?['onImagesChanged'] ?? (_, __) {},
            maxImages: extra?['maxImages'] ?? 10,
            authenticity: extra?['authenticity'] as String?,
          );
        },
      ),

      // SKU Detail (outside shell for both internal navigation and deep linking)
      GoRoute(
        path: '/sku-detail/:styleId/:variationId/:skuId',
        name: 'sku-detail',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) {
          final styleId = state.pathParameters['styleId']!;
          final variationId = state.pathParameters['variationId']!;
          final skuId = state.pathParameters['skuId']!;
          final extra = state.extra as Map<String, dynamic>?;
          final variationName = extra?['variationName'] as String?;
          final categoryId = extra?['categoryId'] as String?;
          final isNewSku = extra?['isNewSku'] as bool? ?? false;
          final usedOptionIds = (extra?['usedOptionIds'] as List?)?.cast<String>() ?? [];
          final editingLocalSku = extra?['editingLocalSku'] as Map<String, dynamic>?;
          return SkuDetailScreen(
            styleId: styleId,
            variationId: variationId,
            skuId: skuId,
            variationName: variationName,
            categoryId: categoryId,
            isNewSku: isNewSku,
            usedOptionIds: usedOptionIds,
            editingLocalSku: editingLocalSku,
          );
        },
      ),

      // Search (outside shell, full screen)
      GoRoute(
        path: '/search',
        name: 'search',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const SearchScreen(),
      ),

      // Saved Searches (outside shell, full screen)
      GoRoute(
        path: savedSearches,
        name: 'saved-searches',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const SavedSearchesScreen(),
      ),

      // Create Review (outside shell, full screen)
      GoRoute(
        path: '/products/:id/review',
        name: 'create-review',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          final extra = state.extra as Map<String, dynamic>?;
          return CreateReviewScreen(
            styleId: id,
            styleName: extra?['styleName'] as String?,
            thumbnailUrl: extra?['thumbnailUrl'] as String?,
            brandName: extra?['brandName'] as String?,
          );
        },
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

      // Seller Profile (visitor view, outside shell)
      GoRoute(
        path: '/sellers/:id',
        name: 'seller-profile',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          final tabParam = state.uri.queryParameters['tab'];
          int initialTab = 0;
          if (tabParam == 'reviews') {
            initialTab = 2; // Reviews is the 3rd tab (index 2)
          } else if (tabParam == 'community') {
            initialTab = 1;
          }
          return SellerProfileScreen(sellerId: id, initialTab: initialTab);
        },
      ),

      // User Profile (outside shell, for navigating from other screens)
      GoRoute(
        path: '/users/:id/profile',
        name: 'user-profile-standalone',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return UserProfileScreen(userId: id);
        },
      ),

      // User Profile Details (outside shell, for deep links with tab support)
      GoRoute(
        path: '/users/:id/details',
        name: 'user-profile-details',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          final tabParam = state.uri.queryParameters['tab'];
          int initialTab = 2; // Default to Purchases
          if (tabParam == 'reviews') {
            initialTab = 5; // Reviews tab
          } else if (tabParam == 'products') {
            initialTab = 0;
          } else if (tabParam == 'incoming') {
            initialTab = 1;
          } else if (tabParam == 'purchases') {
            initialTab = 2;
          } else if (tabParam == 'transactions') {
            initialTab = 3;
          } else if (tabParam == 'community') {
            initialTab = 4;
          }
          return UserProfileScreen(userId: id, initialTab: initialTab);
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

      // Withdrawal Account Setup (outside shell, full screen - for use from return flow)
      GoRoute(
        path: '/withdrawal-account-setup',
        name: 'withdrawal-account-setup',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const WithdrawalAccountScreen(),
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
                  // Products listing with query params (inside shell with bottom nav)
                  GoRoute(
                    path: 'products',
                    name: 'discover-products',
                    builder: (context, state) {
                      final queryParams = state.uri.queryParameters;

                      final query = queryParams['query'];
                      final departmentId =
                          queryParams['departmentId'] ??
                          queryParams['department'];
                      final categoryId =
                          queryParams['categoryId'] ?? queryParams['category'];
                      final collectionId =
                          queryParams['collectionId'] ??
                          queryParams['collection'];
                      final styleId =
                          queryParams['styleId'] ?? queryParams['style'];
                      final brandId =
                          queryParams['brandId'] ?? queryParams['brand'];
                      final filterType = queryParams['filterType'];
                      final title = queryParams['title'] ?? 'Products';

                      return ProductsScreen(
                        query: query,
                        departmentId: departmentId,
                        categoryId: categoryId,
                        collectionId: collectionId,
                        styleId: styleId,
                        brandId: brandId,
                        filterType: filterType,
                        title: title,
                      );
                    },
                  ),
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
                          final query =
                              queryParams['query'] ??
                              extra?['query'] as String?;
                          final departmentId =
                              queryParams['departmentId'] ??
                              queryParams['department'] ??
                              extra?['departmentId'] as String?;
                          final categoryId =
                              queryParams['categoryId'] ??
                              queryParams['category'] ??
                              extra?['categoryId'] as String?;
                          final collectionId =
                              queryParams['collectionId'] ??
                              queryParams['collection'] ??
                              extra?['collectionId'] as String?;
                          final styleId =
                              queryParams['styleId'] ??
                              queryParams['style'] ??
                              extra?['styleId'] as String?;
                          final brandId =
                              queryParams['brandId'] ??
                              queryParams['brand'] ??
                              extra?['brandId'] as String?;
                          final filterType =
                              queryParams['filterType'] ??
                              extra?['filterType'] as String?;
                          final title =
                              queryParams['title'] ??
                              extra?['title'] as String? ??
                              'Products';

                          return ProductsScreen(
                            query: query,
                            departmentId: departmentId,
                            categoryId: categoryId,
                            collectionId: collectionId,
                            styleId: styleId,
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
                routes: [
                  // Seller Onboarding (when requirements not met)
                  GoRoute(
                    path: 'onboarding',
                    name: 'seller-onboarding',
                    builder: (context, state) => const SellerOnboardingScreen(),
                  ),
                  // Style Overview (hub for managing a listing)
                  GoRoute(
                    path: 'style/:styleId',
                    name: 'style-overview',
                    builder: (context, state) {
                      final styleId = state.pathParameters['styleId']!;
                      return StyleOverviewScreen(styleId: styleId);
                    },
                    routes: [
                      // Edit Product Details
                      GoRoute(
                        path: 'edit',
                        name: 'style-details',
                        builder: (context, state) {
                          final styleId = state.pathParameters['styleId']!;
                          return StyleDetailsScreen(styleId: styleId);
                        },
                      ),
                      // Boost Style
                      GoRoute(
                        path: 'boost',
                        name: 'boost-style',
                        builder: (context, state) {
                          final styleId = state.pathParameters['styleId']!;
                          final extra = state.extra as Map<String, dynamic>?;
                          final styleTitle = extra?['styleTitle'] as String?;
                          return BoostStyleScreen(
                            styleId: styleId,
                            styleTitle: styleTitle,
                          );
                        },
                      ),
                      // Style Stats/Analytics
                      GoRoute(
                        path: 'stats',
                        name: 'style-stats',
                        builder: (context, state) {
                          final styleId = state.pathParameters['styleId']!;
                          final extra = state.extra as Map<String, dynamic>?;
                          final styleTitle = extra?['styleTitle'] as String?;
                          return StyleStatsScreen(
                            styleId: styleId,
                            styleTitle: styleTitle,
                          );
                        },
                      ),
                      // Variation Detail
                      GoRoute(
                        path: 'variation/:variationId',
                        name: 'variation-detail',
                        builder: (context, state) {
                          final styleId = state.pathParameters['styleId']!;
                          final variationId =
                              state.pathParameters['variationId']!;
                          final extra = state.extra as Map<String, dynamic>?;
                          final variationName =
                              extra?['variationName'] as String?;
                          final categoryId = extra?['categoryId'] as String?;
                          final authenticity = extra?['authenticity'] as String?;
                          return VariationDetailScreen(
                            styleId: styleId,
                            variationId: variationId,
                            variationName: variationName,
                            categoryId: categoryId,
                            authenticity: authenticity,
                          );
                        },
                        routes: [
                          // SKU Detail (inside shell for internal navigation)
                          GoRoute(
                            path: 'sku/:skuId',
                            name: 'sku-detail-shell',
                            builder: (context, state) {
                              final styleId = state.pathParameters['styleId']!;
                              final variationId =
                                  state.pathParameters['variationId']!;
                              final skuId = state.pathParameters['skuId']!;
                              final extra =
                                  state.extra as Map<String, dynamic>?;
                              final variationName =
                                  extra?['variationName'] as String?;
                              final categoryId =
                                  extra?['categoryId'] as String?;
                              return SkuDetailScreen(
                                styleId: styleId,
                                variationId: variationId,
                                skuId: skuId,
                                variationName: variationName,
                                categoryId: categoryId,
                              );
                            },
                          ),
                        ],
                      ),
                    ],
                  ),
                  // Select Department (first step of category selection)
                  GoRoute(
                    path: 'select-department',
                    name: 'select-department',
                    builder: (context, state) => const SelectDepartmentScreen(),
                  ),
                  // Select Collection (second step of category selection)
                  GoRoute(
                    path: 'select-collection',
                    name: 'select-collection',
                    builder: (context, state) {
                      final extra = state.extra as Map<String, dynamic>?;
                      if (extra == null || extra['department'] == null) {
                        return const Scaffold(
                          body: Center(child: Text('No department selected')),
                        );
                      }
                      return SelectCollectionScreen(
                        department: extra['department'] as DepartmentModel,
                      );
                    },
                  ),
                  // Select Category (final step of category selection)
                  GoRoute(
                    path: 'select-category',
                    name: 'select-category',
                    builder: (context, state) {
                      final extra = state.extra as Map<String, dynamic>?;
                      if (extra == null ||
                          extra['department'] == null ||
                          extra['collection'] == null) {
                        return const Scaffold(
                          body: Center(child: Text('Missing selection data')),
                        );
                      }
                      return SelectCategoryScreen(
                        department: extra['department'] as DepartmentModel,
                        collection: extra['collection'] as CollectionModel,
                      );
                    },
                  ),
                  // Select Brand
                  GoRoute(
                    path: 'select-brand',
                    name: 'select-brand',
                    builder: (context, state) => const SelectBrandScreen(),
                  ),
                ],
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
                  // Personal Info (nested under profile tab)
                  GoRoute(
                    path: 'personal-info',
                    name: 'personal-info',
                    builder: (context, state) => const PersonalInfoScreen(),
                  ),
                  // Vacation Mode (nested under profile tab)
                  GoRoute(
                    path: 'vacation-mode',
                    name: 'vacation-mode',
                    builder: (context, state) => const VacationModeScreen(),
                  ),
                  // Withdrawal Account (nested under profile tab)
                  GoRoute(
                    path: 'withdrawal-account',
                    name: 'withdrawal-account',
                    builder: (context, state) => const WithdrawalAccountScreen(),
                  ),
                  // Shipping Rates (nested under profile tab)
                  GoRoute(
                    path: 'shipping-rates',
                    name: 'shipping-rates',
                    builder: (context, state) => const ShippingRatesScreen(),
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
