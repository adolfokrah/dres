import 'package:get_it/get_it.dart';
import 'package:dres/core/services/api_service.dart';
import 'package:dres/core/services/storage_service.dart';
import 'package:dres/core/services/site_settings_service.dart';
import 'package:dres/core/repositories/site_settings_repository.dart';
import 'package:dres/features/home/data/repositories/home_repository.dart';
import 'package:dres/features/home/logic/bloc/home_bloc.dart';
import 'package:dres/features/splash/data/repositories/menu_repository.dart';
import 'package:dres/features/splash/logic/menu_bloc/menu_bloc.dart';
import 'package:dres/features/shop/data/repositories/products_repository.dart';
import 'package:dres/features/shop/data/repositories/brands_repository.dart';
import 'package:dres/features/shop/logic/products_bloc/products_bloc.dart';
import 'package:dres/features/shop/logic/brands_bloc/brands_bloc.dart';
import 'package:dres/features/product_details/data/repositories/product_details_repository.dart';
import 'package:dres/features/product_details/data/repositories/reviews_repository.dart';
import 'package:dres/features/product_details/data/repositories/seller_repository.dart';
import 'package:dres/features/product_details/data/repositories/similar_variations_repository.dart';
import 'package:dres/features/product_details/logic/product_details_bloc/product_details_bloc.dart';
import 'package:dres/features/auth/data/repositories/auth_repository.dart';
import 'package:dres/features/auth/logic/auth_bloc/auth_bloc.dart';
import 'package:dres/features/cart/data/repositories/cart_repository.dart';
import 'package:dres/features/cart/data/repositories/address_repository.dart';
import 'package:dres/features/cart/data/repositories/promo_repository.dart';
import 'package:dres/features/cart/logic/cart_bloc/cart_bloc.dart';
import 'package:dres/features/cart/logic/address_bloc/address_bloc.dart';
import 'package:dres/features/orders/data/repositories/orders_repository.dart';
import 'package:dres/features/orders/logic/order_details_bloc/order_details_bloc.dart';
import 'package:dres/features/orders/data/repositories/purchases_repository.dart';
import 'package:dres/features/orders/data/repositories/incoming_orders_repository.dart';
import 'package:dres/features/orders/logic/purchases_bloc/purchases_bloc.dart';
import 'package:dres/features/orders/logic/incoming_orders_bloc/incoming_orders_bloc.dart';
import 'package:dres/features/orders/logic/incoming_order_details_bloc/incoming_order_details_bloc.dart';
import 'package:dres/features/profile/data/repositories/transactions_repository.dart';
import 'package:dres/features/profile/logic/transactions_bloc/transactions_bloc.dart';
import 'package:dres/features/profile/data/repositories/community_repository.dart';
import 'package:dres/features/profile/logic/community_bloc/community_bloc.dart';
import 'package:dres/features/profile/data/repositories/seller_reviews_repository.dart';
import 'package:dres/features/profile/logic/seller_reviews_bloc/seller_reviews_bloc.dart';
import 'package:dres/features/favorites/data/repositories/favorites_repository.dart';
import 'package:dres/features/favorites/logic/favorites_bloc/favorites_bloc.dart';
import 'package:dres/features/follows/data/repositories/follows_repository.dart';
import 'package:dres/features/follows/logic/follows_bloc/follows_bloc.dart';
import 'package:dres/features/sell/data/repositories/sell_repository.dart';
import 'package:dres/features/sell/data/repositories/boost_tiers_repository.dart';
import 'package:dres/features/sell/data/repositories/style_stats_repository.dart';
import 'package:dres/features/sell/data/repositories/seller_eligibility_repository.dart';
import 'package:dres/features/sell/logic/sell_bloc/sell_bloc.dart';
import 'package:dres/features/sell/logic/style_details_bloc/style_details_bloc.dart';
import 'package:dres/features/sell/logic/variations_bloc/variations_bloc.dart';
import 'package:dres/features/sell/logic/variation_detail_bloc/variation_detail_bloc.dart';
import 'package:dres/features/sell/logic/seller_eligibility_bloc/seller_eligibility_bloc.dart';
import 'package:dres/features/payment/data/repositories/payment_repository.dart';
import 'package:dres/features/notifications/data/repositories/notifications_repository.dart';
import 'package:dres/features/notifications/logic/notifications_bloc/notifications_bloc.dart';
import 'package:dres/features/profile/data/repositories/user_products_repository.dart';
import 'package:dres/features/saved_searches/data/repositories/saved_search_repository.dart';
import 'package:dres/features/saved_searches/logic/saved_searches_bloc/saved_searches_bloc.dart';
import 'package:dres/features/profile/logic/user_products_bloc/user_products_bloc.dart';
import 'package:dres/features/profile/data/repositories/seller_products_repository.dart';
import 'package:dres/features/profile/logic/seller_products_bloc/seller_products_bloc.dart';
import 'package:dres/features/profile/data/repositories/withdrawal_account_repository.dart';
import 'package:dres/features/profile/logic/withdrawal_account_bloc/withdrawal_account_bloc.dart';
import 'package:dres/features/profile/data/repositories/shipping_rates_repository.dart';
import 'package:dres/features/profile/logic/shipping_rates_bloc/shipping_rates_bloc.dart';
import 'package:dres/features/search/data/repositories/search_repository.dart';
import 'package:dres/core/services/push_notification_service.dart';

final getIt = GetIt.instance;

Future<void> setupDependencies() async {
  // ========================
  // Services (Singletons)
  // ========================
  
  // Storage Service - must be initialized first
  final storageService = StorageService();
  await storageService.init();
  getIt.registerSingleton<StorageService>(storageService);

  // API Service - Dio wrapper with auth
  getIt.registerLazySingleton<ApiService>(() => ApiService(getIt<StorageService>()));

  // Push Notification Service
  getIt.registerLazySingleton<PushNotificationService>(() => PushNotificationService(
    apiService: getIt<ApiService>(),
  ));

  // Site Settings Repository & Service
  getIt.registerLazySingleton<SiteSettingsRepository>(() => SiteSettingsRepository(
    apiService: getIt<ApiService>(),
  ));
  getIt.registerLazySingleton<SiteSettingsService>(() => SiteSettingsService(
    repository: getIt<SiteSettingsRepository>(),
  ));

  // ========================
  // Repositories (Singletons)
  // ========================
  
  // Home Repository
  getIt.registerLazySingleton<HomeRepository>(() => HomeRepository(getIt<ApiService>()));

  // Menu Repository
  getIt.registerLazySingleton<MenuRepository>(() => MenuRepository(getIt<ApiService>()));

  // Products Repository
  getIt.registerLazySingleton<ProductsRepository>(() => ProductsRepository(getIt<ApiService>().dio));

  // Brands Repository
  getIt.registerLazySingleton<BrandsRepository>(() => BrandsRepository(getIt<ApiService>().dio));

  // Product Details Repository
  getIt.registerLazySingleton<ProductDetailsRepository>(() => ProductDetailsRepository(getIt<ApiService>()));

  // Reviews Repository
  getIt.registerLazySingleton<ReviewsRepository>(() => ReviewsRepository(getIt<ApiService>()));

  // Seller Repository
  getIt.registerLazySingleton<SellerRepository>(() => SellerRepository(getIt<ApiService>()));

  // Similar Variations Repository
  getIt.registerLazySingleton<SimilarVariationsRepository>(() => SimilarVariationsRepository(getIt<ApiService>()));

  // Auth Repository
  getIt.registerLazySingleton<AuthRepository>(() => AuthRepository(
    apiService: getIt<ApiService>(),
    storageService: getIt<StorageService>(),
  ));

  // Cart Repository
  getIt.registerLazySingleton<CartRepository>(() => CartRepository(
    apiService: getIt<ApiService>(),
  ));

  // Address Repository
  getIt.registerLazySingleton<AddressRepository>(() => AddressRepository(
    apiService: getIt<ApiService>(),
  ));

  // Promo Repository
  getIt.registerLazySingleton<PromoRepository>(() => PromoRepository(
    apiService: getIt<ApiService>(),
  ));

  // Orders Repository
  getIt.registerLazySingleton<OrdersRepository>(() => OrdersRepository(
    apiService: getIt<ApiService>(),
  ));

  // Payment Repository
  getIt.registerLazySingleton<PaymentRepository>(() => PaymentRepository(
    apiService: getIt<ApiService>(),
  ));

  // Saved Search Repository
  getIt.registerLazySingleton<SavedSearchRepository>(() => SavedSearchRepository(
    apiService: getIt<ApiService>(),
  ));

  // ========================
  // BLoCs (Factory - new instance each time)
  // ========================
  
  // Home Bloc
  getIt.registerFactory<HomeBloc>(() => HomeBloc(getIt<HomeRepository>()));

  // Menu Bloc
  getIt.registerFactory<MenuBloc>(() => MenuBloc(getIt<MenuRepository>()));

  // Products Bloc
  getIt.registerFactory<ProductsBloc>(() => ProductsBloc(getIt<ProductsRepository>()));

  // Brands Bloc
  getIt.registerFactory<BrandsBloc>(() => BrandsBloc(getIt<BrandsRepository>()));

  // Product Details Bloc
  getIt.registerFactory<ProductDetailsBloc>(() => ProductDetailsBloc(getIt<ProductDetailsRepository>()));

  // Auth Bloc - Singleton so auth state persists across screens
  getIt.registerLazySingleton<AuthBloc>(() => AuthBloc(authRepository: getIt<AuthRepository>()));

  // Cart Bloc - Singleton so cart state persists across screens
  getIt.registerLazySingleton<CartBloc>(() => CartBloc(
    cartRepository: getIt<CartRepository>(),
    promoRepository: getIt<PromoRepository>(),
  ));

  // Address Bloc - Singleton so address selection persists
  getIt.registerLazySingleton<AddressBloc>(() => AddressBloc(addressRepository: getIt<AddressRepository>()));

  // Order Details Bloc - Factory for each order view
  getIt.registerFactory<OrderDetailsBloc>(() => OrderDetailsBloc(
    ordersRepository: getIt<OrdersRepository>(),
  ));

  // Purchases Repository
  getIt.registerLazySingleton<PurchasesRepository>(() => PurchasesRepository(
    apiService: getIt<ApiService>(),
  ));

  // Incoming Orders Repository
  getIt.registerLazySingleton<IncomingOrdersRepository>(() => IncomingOrdersRepository(
    apiService: getIt<ApiService>(),
  ));

  // Purchases Bloc - Singleton so filter state persists across tab switches
  getIt.registerLazySingleton<PurchasesBloc>(() => PurchasesBloc(
    purchasesRepository: getIt<PurchasesRepository>(),
  ));

  // Incoming Orders Bloc - Singleton so filter state persists across tab switches
  getIt.registerLazySingleton<IncomingOrdersBloc>(() => IncomingOrdersBloc(
    incomingOrdersRepository: getIt<IncomingOrdersRepository>(),
  ));

  // Incoming Order Details Bloc - Factory for each order view
  getIt.registerFactory<IncomingOrderDetailsBloc>(() => IncomingOrderDetailsBloc(
    incomingOrdersRepository: getIt<IncomingOrdersRepository>(),
  ));

  // Transactions Repository
  getIt.registerLazySingleton<TransactionsRepository>(() => TransactionsRepository(
    apiService: getIt<ApiService>(),
  ));

  // Transactions Bloc - Singleton so filter state persists
  getIt.registerLazySingleton<TransactionsBloc>(() => TransactionsBloc(
    transactionsRepository: getIt<TransactionsRepository>(),
  ));

  // Community Repository
  getIt.registerLazySingleton<CommunityRepository>(() => CommunityRepository(
    apiService: getIt<ApiService>(),
  ));

  // Community Bloc - Factory so each screen gets its own instance
  getIt.registerFactory<CommunityBloc>(() => CommunityBloc(
    communityRepository: getIt<CommunityRepository>(),
  ));

  // Seller Reviews Repository
  getIt.registerLazySingleton<SellerReviewsRepository>(() => SellerReviewsRepository(
    apiService: getIt<ApiService>(),
  ));

  // Seller Reviews Bloc - Factory so each screen gets its own instance
  getIt.registerFactory<SellerReviewsBloc>(() => SellerReviewsBloc(
    sellerReviewsRepository: getIt<SellerReviewsRepository>(),
  ));

  // Favorites Repository
  getIt.registerLazySingleton<FavoritesRepository>(() => FavoritesRepository(
    apiService: getIt<ApiService>(),
  ));

  // Favorites Bloc - Singleton so favorites state persists
  getIt.registerLazySingleton<FavoritesBloc>(() => FavoritesBloc(
    favoritesRepository: getIt<FavoritesRepository>(),
  ));

  // Follows Repository
  getIt.registerLazySingleton<FollowsRepository>(() => FollowsRepository(
    apiService: getIt<ApiService>(),
  ));

  // Follows Bloc - Singleton so follow state persists (includes Community functionality)
  getIt.registerLazySingleton<FollowsBloc>(() => FollowsBloc(
    followsRepository: getIt<FollowsRepository>(),
    communityRepository: getIt<CommunityRepository>(),
  ));

  // Saved Searches Bloc - Singleton so saved searches state persists
  getIt.registerLazySingleton<SavedSearchesBloc>(() => SavedSearchesBloc(
    getIt<SavedSearchRepository>(),
  ));

  // Sell Repository
  getIt.registerLazySingleton<SellRepository>(() => SellRepository(
    apiService: getIt<ApiService>(),
  ));

  // Boost Tiers Repository
  getIt.registerLazySingleton<BoostTiersRepository>(() => BoostTiersRepository(
    apiService: getIt<ApiService>(),
  ));

  // Style Stats Repository
  getIt.registerLazySingleton<StyleStatsRepository>(() => StyleStatsRepository(
    apiService: getIt<ApiService>(),
  ));

  // Seller Eligibility Repository
  getIt.registerLazySingleton<SellerEligibilityRepository>(() => SellerEligibilityRepository(
    apiService: getIt<ApiService>(),
  ));

  // Seller Eligibility Bloc - Singleton to persist eligibility state
  getIt.registerLazySingleton<SellerEligibilityBloc>(() => SellerEligibilityBloc(
    repository: getIt<SellerEligibilityRepository>(),
  ));

  // Sell Bloc - Singleton so draft state persists
  getIt.registerLazySingleton<SellBloc>(() => SellBloc(
    sellRepository: getIt<SellRepository>(),
  ));

  // Style Details Bloc - Singleton for style editing
  getIt.registerLazySingleton<StyleDetailsBloc>(() => StyleDetailsBloc(
    sellRepository: getIt<SellRepository>(),
  ));

  // Variations Bloc - Singleton for variations management
  getIt.registerLazySingleton<VariationsBloc>(() => VariationsBloc(
    sellRepository: getIt<SellRepository>(),
  ));

  // Variation Detail Bloc - Singleton for variation detail editing
  getIt.registerLazySingleton<VariationDetailBloc>(() => VariationDetailBloc(
    sellRepository: getIt<SellRepository>(),
  ));

  // Notifications Repository
  getIt.registerLazySingleton<NotificationsRepository>(() => NotificationsRepository(
    apiService: getIt<ApiService>(),
  ));

  // Notifications Bloc - Singleton so unread count persists across screens
  getIt.registerLazySingleton<NotificationsBloc>(() => NotificationsBloc(
    notificationsRepository: getIt<NotificationsRepository>(),
  ));

  // User Products Repository
  getIt.registerLazySingleton<UserProductsRepository>(() => UserProductsRepository(
    apiService: getIt<ApiService>(),
  ));

  // User Products Bloc - Singleton so products list persists
  getIt.registerLazySingleton<UserProductsBloc>(() => UserProductsBloc(
    userProductsRepository: getIt<UserProductsRepository>(),
  ));

  // Seller Products Repository (for viewing other seller's products)
  getIt.registerLazySingleton<SellerProductsRepository>(() => SellerProductsRepository(
    apiService: getIt<ApiService>(),
  ));

  // Seller Products Bloc - Factory so each screen gets its own instance
  getIt.registerFactory<SellerProductsBloc>(() => SellerProductsBloc(
    sellerProductsRepository: getIt<SellerProductsRepository>(),
  ));

  // Search Repository
  getIt.registerLazySingleton<SearchRepository>(() => SearchRepository(
    getIt<ApiService>(),
  ));

  // Withdrawal Account Repository
  getIt.registerLazySingleton<WithdrawalAccountRepository>(() => WithdrawalAccountRepository(
    apiService: getIt<ApiService>(),
  ));

  // Withdrawal Account Bloc - Factory so each screen gets its own instance
  getIt.registerFactory<WithdrawalAccountBloc>(() => WithdrawalAccountBloc(
    repository: getIt<WithdrawalAccountRepository>(),
  ));

  // Shipping Rates Repository
  getIt.registerLazySingleton<ShippingRatesRepository>(() => ShippingRatesRepository(
    apiService: getIt<ApiService>(),
  ));

  // Shipping Rates Bloc - Factory so each screen gets its own instance
  getIt.registerFactory<ShippingRatesBloc>(() => ShippingRatesBloc(
    repository: getIt<ShippingRatesRepository>(),
  ));
}

/// Reset all dependencies except StorageService (to preserve auth token)
/// Call this when country changes to refresh all data
Future<void> resetDependencies() async {
  // Get StorageService before reset (we want to keep auth token)
  final storageService = getIt<StorageService>();
  
  // Reset GetIt - this unregisters everything
  await getIt.reset();
  
  // Re-register StorageService (already initialized)
  getIt.registerSingleton<StorageService>(storageService);
  
  // Re-setup all other dependencies
  await _setupDependenciesWithExistingStorage(storageService);
}

Future<void> _setupDependenciesWithExistingStorage(StorageService storageService) async {
  // API Service - Dio wrapper with auth
  getIt.registerLazySingleton<ApiService>(() => ApiService(storageService));

  // Site Settings Repository & Service
  getIt.registerLazySingleton<SiteSettingsRepository>(() => SiteSettingsRepository(
    apiService: getIt<ApiService>(),
  ));
  getIt.registerLazySingleton<SiteSettingsService>(() => SiteSettingsService(
    repository: getIt<SiteSettingsRepository>(),
  ));

  // ========================
  // Repositories (Singletons)
  // ========================
  
  // Home Repository
  getIt.registerLazySingleton<HomeRepository>(() => HomeRepository(getIt<ApiService>()));

  // Menu Repository
  getIt.registerLazySingleton<MenuRepository>(() => MenuRepository(getIt<ApiService>()));

  // Products Repository
  getIt.registerLazySingleton<ProductsRepository>(() => ProductsRepository(getIt<ApiService>().dio));

  // Brands Repository
  getIt.registerLazySingleton<BrandsRepository>(() => BrandsRepository(getIt<ApiService>().dio));

  // Product Details Repository
  getIt.registerLazySingleton<ProductDetailsRepository>(() => ProductDetailsRepository(getIt<ApiService>()));

  // Reviews Repository
  getIt.registerLazySingleton<ReviewsRepository>(() => ReviewsRepository(getIt<ApiService>()));

  // Seller Repository
  getIt.registerLazySingleton<SellerRepository>(() => SellerRepository(getIt<ApiService>()));

  // Similar Variations Repository
  getIt.registerLazySingleton<SimilarVariationsRepository>(() => SimilarVariationsRepository(getIt<ApiService>()));

  // Auth Repository
  getIt.registerLazySingleton<AuthRepository>(() => AuthRepository(
    apiService: getIt<ApiService>(),
    storageService: storageService,
  ));

  // Cart Repository
  getIt.registerLazySingleton<CartRepository>(() => CartRepository(
    apiService: getIt<ApiService>(),
  ));

  // Address Repository
  getIt.registerLazySingleton<AddressRepository>(() => AddressRepository(
    apiService: getIt<ApiService>(),
  ));

  // Promo Repository
  getIt.registerLazySingleton<PromoRepository>(() => PromoRepository(
    apiService: getIt<ApiService>(),
  ));

  // Orders Repository
  getIt.registerLazySingleton<OrdersRepository>(() => OrdersRepository(
    apiService: getIt<ApiService>(),
  ));

  // Payment Repository
  getIt.registerLazySingleton<PaymentRepository>(() => PaymentRepository(
    apiService: getIt<ApiService>(),
  ));

  // Purchases Repository
  getIt.registerLazySingleton<PurchasesRepository>(() => PurchasesRepository(
    apiService: getIt<ApiService>(),
  ));

  // Incoming Orders Repository
  getIt.registerLazySingleton<IncomingOrdersRepository>(() => IncomingOrdersRepository(
    apiService: getIt<ApiService>(),
  ));

  // Transactions Repository
  getIt.registerLazySingleton<TransactionsRepository>(() => TransactionsRepository(
    apiService: getIt<ApiService>(),
  ));

  // Community Repository
  getIt.registerLazySingleton<CommunityRepository>(() => CommunityRepository(
    apiService: getIt<ApiService>(),
  ));

  // Seller Reviews Repository
  getIt.registerLazySingleton<SellerReviewsRepository>(() => SellerReviewsRepository(
    apiService: getIt<ApiService>(),
  ));

  // Favorites Repository
  getIt.registerLazySingleton<FavoritesRepository>(() => FavoritesRepository(
    apiService: getIt<ApiService>(),
  ));

  // Follows Repository
  getIt.registerLazySingleton<FollowsRepository>(() => FollowsRepository(
    apiService: getIt<ApiService>(),
  ));

  // Follows Bloc - Singleton so follow state persists
  getIt.registerLazySingleton<FollowsBloc>(() => FollowsBloc(
    followsRepository: getIt<FollowsRepository>(),
    communityRepository: getIt<CommunityRepository>(),
  ));

  // Sell Repository
  getIt.registerLazySingleton<SellRepository>(() => SellRepository(
    apiService: getIt<ApiService>(),
  ));

  // Boost Tiers Repository
  getIt.registerLazySingleton<BoostTiersRepository>(() => BoostTiersRepository(
    apiService: getIt<ApiService>(),
  ));

  // Style Stats Repository
  getIt.registerLazySingleton<StyleStatsRepository>(() => StyleStatsRepository(
    apiService: getIt<ApiService>(),
  ));

  // Notifications Repository
  getIt.registerLazySingleton<NotificationsRepository>(() => NotificationsRepository(
    apiService: getIt<ApiService>(),
  ));

  // User Products Repository
  getIt.registerLazySingleton<UserProductsRepository>(() => UserProductsRepository(
    apiService: getIt<ApiService>(),
  ));

  // Seller Products Repository
  getIt.registerLazySingleton<SellerProductsRepository>(() => SellerProductsRepository(
    apiService: getIt<ApiService>(),
  ));

  // Search Repository
  getIt.registerLazySingleton<SearchRepository>(() => SearchRepository(
    getIt<ApiService>(),
  ));

  // ========================
  // BLoCs
  // ========================

  // Menu Bloc - Singleton
  getIt.registerLazySingleton<MenuBloc>(() => MenuBloc(getIt<MenuRepository>()));

  // Home Bloc - Singleton
  getIt.registerLazySingleton<HomeBloc>(() => HomeBloc(getIt<HomeRepository>()));

  // Products Bloc - Singleton
  getIt.registerLazySingleton<ProductsBloc>(() => ProductsBloc(getIt<ProductsRepository>()));

  // Brands Bloc - Singleton
  getIt.registerLazySingleton<BrandsBloc>(() => BrandsBloc(getIt<BrandsRepository>()));

  // Product Details Bloc - Factory
  getIt.registerFactory<ProductDetailsBloc>(() => ProductDetailsBloc(getIt<ProductDetailsRepository>()));

  // Auth Bloc - Singleton
  getIt.registerLazySingleton<AuthBloc>(() => AuthBloc(authRepository: getIt<AuthRepository>()));

  // Cart Bloc - Singleton
  getIt.registerLazySingleton<CartBloc>(() => CartBloc(
    cartRepository: getIt<CartRepository>(),
    promoRepository: getIt<PromoRepository>(),
  ));

  // Address Bloc - Singleton
  getIt.registerLazySingleton<AddressBloc>(() => AddressBloc(
    addressRepository: getIt<AddressRepository>(),
  ));

  // Order Details Bloc - Factory
  getIt.registerFactory<OrderDetailsBloc>(() => OrderDetailsBloc(
    ordersRepository: getIt<OrdersRepository>(),
  ));

  // Purchases Bloc - Singleton
  getIt.registerLazySingleton<PurchasesBloc>(() => PurchasesBloc(
    purchasesRepository: getIt<PurchasesRepository>(),
  ));

  // Incoming Orders Bloc - Singleton
  getIt.registerLazySingleton<IncomingOrdersBloc>(() => IncomingOrdersBloc(
    incomingOrdersRepository: getIt<IncomingOrdersRepository>(),
  ));

  // Incoming Order Details Bloc - Factory
  getIt.registerFactory<IncomingOrderDetailsBloc>(() => IncomingOrderDetailsBloc(
    incomingOrdersRepository: getIt<IncomingOrdersRepository>(),
  ));

  // Transactions Bloc - Singleton
  getIt.registerLazySingleton<TransactionsBloc>(() => TransactionsBloc(
    transactionsRepository: getIt<TransactionsRepository>(),
  ));

  // Community Bloc - Factory
  getIt.registerFactory<CommunityBloc>(() => CommunityBloc(
    communityRepository: getIt<CommunityRepository>(),
  ));

  // Seller Reviews Bloc - Factory
  getIt.registerFactory<SellerReviewsBloc>(() => SellerReviewsBloc(
    sellerReviewsRepository: getIt<SellerReviewsRepository>(),
  ));

  // Favorites Bloc - Singleton
  getIt.registerLazySingleton<FavoritesBloc>(() => FavoritesBloc(
    favoritesRepository: getIt<FavoritesRepository>(),
  ));

  // Sell Bloc - Factory
  getIt.registerFactory<SellBloc>(() => SellBloc(
    sellRepository: getIt<SellRepository>(),
  ));

  // Style Details Bloc - Factory
  getIt.registerFactory<StyleDetailsBloc>(() => StyleDetailsBloc(
    sellRepository: getIt<SellRepository>(),
  ));

  // Variations Bloc - Factory
  getIt.registerFactory<VariationsBloc>(() => VariationsBloc(
    sellRepository: getIt<SellRepository>(),
  ));

  // Variation Detail Bloc - Factory
  getIt.registerFactory<VariationDetailBloc>(() => VariationDetailBloc(
    sellRepository: getIt<SellRepository>(),
  ));

  // Notifications Bloc - Singleton
  getIt.registerLazySingleton<NotificationsBloc>(() => NotificationsBloc(
    notificationsRepository: getIt<NotificationsRepository>(),
  ));

  // User Products Bloc - Singleton
  getIt.registerLazySingleton<UserProductsBloc>(() => UserProductsBloc(
    userProductsRepository: getIt<UserProductsRepository>(),
  ));

  // Seller Products Bloc - Factory
  getIt.registerFactory<SellerProductsBloc>(() => SellerProductsBloc(
    sellerProductsRepository: getIt<SellerProductsRepository>(),
  ));

  // Withdrawal Account Repository
  getIt.registerLazySingleton<WithdrawalAccountRepository>(() => WithdrawalAccountRepository(
    apiService: getIt<ApiService>(),
  ));

  // Withdrawal Account Bloc - Factory
  getIt.registerFactory<WithdrawalAccountBloc>(() => WithdrawalAccountBloc(
    repository: getIt<WithdrawalAccountRepository>(),
  ));

  // Shipping Rates Repository
  getIt.registerLazySingleton<ShippingRatesRepository>(() => ShippingRatesRepository(
    apiService: getIt<ApiService>(),
  ));

  // Shipping Rates Bloc - Factory
  getIt.registerFactory<ShippingRatesBloc>(() => ShippingRatesBloc(
    repository: getIt<ShippingRatesRepository>(),
  ));
}
