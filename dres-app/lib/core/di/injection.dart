import 'package:get_it/get_it.dart';
import 'package:dres/core/services/api_service.dart';
import 'package:dres/core/services/storage_service.dart';

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
  
  // TODO: Register repositories here
  // getIt.registerLazySingleton<AuthRepository>(() => AuthRepository(getIt()));
  // getIt.registerLazySingleton<ProductRepository>(() => ProductRepository(getIt()));

  // ========================
  // BLoCs/Cubits (Factory - new instance each time)
  // ========================
  
  // TODO: Register BLoCs here
  // getIt.registerFactory<AuthBloc>(() => AuthBloc(getIt()));
  // getIt.registerFactory<ProductBloc>(() => ProductBloc(getIt()));
}
