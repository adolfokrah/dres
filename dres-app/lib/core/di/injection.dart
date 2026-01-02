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

  // Community Bloc - Singleton so filter state persists
  getIt.registerLazySingleton<CommunityBloc>(() => CommunityBloc(
    communityRepository: getIt<CommunityRepository>(),
  ));

  // Seller Reviews Repository
  getIt.registerLazySingleton<SellerReviewsRepository>(() => SellerReviewsRepository(
    apiService: getIt<ApiService>(),
  ));

  // Seller Reviews Bloc - Singleton
  getIt.registerLazySingleton<SellerReviewsBloc>(() => SellerReviewsBloc(
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

  // Follows Bloc - Singleton so follow state persists
  getIt.registerLazySingleton<FollowsBloc>(() => FollowsBloc(
    followsRepository: getIt<FollowsRepository>(),
  ));
}
