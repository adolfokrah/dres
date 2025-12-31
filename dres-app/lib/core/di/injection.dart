import 'package:get_it/get_it.dart';
import 'package:dres/core/services/api_service.dart';
import 'package:dres/core/services/storage_service.dart';
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

  // Auth Bloc
  getIt.registerFactory<AuthBloc>(() => AuthBloc(authRepository: getIt<AuthRepository>()));

  // Cart Bloc - Singleton so cart state persists across screens
  getIt.registerLazySingleton<CartBloc>(() => CartBloc(
    cartRepository: getIt<CartRepository>(),
    promoRepository: getIt<PromoRepository>(),
  ));

  // Address Bloc - Singleton so address selection persists
  getIt.registerLazySingleton<AddressBloc>(() => AddressBloc(addressRepository: getIt<AddressRepository>()));
}
