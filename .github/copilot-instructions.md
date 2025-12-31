# Copilot Instructions for dres-app

This document outlines the architectural guidelines and coding standards for the DRES Flutter application. Follow these rules when generating or modifying code.

## Architecture Overview

The app follows a **feature-first** architecture with BLoC pattern for state management.

```
lib/
├── core/                    # Shared utilities, services, widgets
│   ├── di/                  # Dependency injection (get_it)
│   ├── services/            # API, storage, etc.
│   ├── models/              # Shared models
│   └── widgets/             # Reusable widgets
├── features/
│   └── [feature_name]/
│       ├── data/
│       │   ├── models/      # Data models only
│       │   └── repositories/ # API calls only
│       ├── logic/
│       │   └── [bloc_name]_bloc/
│       │       ├── [bloc_name]_bloc.dart
│       │       ├── [bloc_name]_event.dart
│       │       └── [bloc_name]_state.dart
│       └── presentation/
│           ├── view/        # Screens
│           └── widgets/     # Feature-specific widgets
```

## BLoC Guidelines

### 1. Register BLoCs in GetIt (`lib/core/di/injection.dart`)

All BLoCs must be registered in the dependency injection container:

```dart
// Singleton BLoCs (state persists across screens)
getIt.registerLazySingleton<CartBloc>(() => CartBloc(
  cartRepository: getIt<CartRepository>(),
));

// Factory BLoCs (new instance each time)
getIt.registerFactory<ProductDetailsBloc>(() => ProductDetailsBloc(
  getIt<ProductDetailsRepository>(),
));
```

### 2. Access BLoCs via GetIt

```dart
// In widgets
getIt<CartBloc>().add(CartFetchRequested());

// With BlocProvider.value for providing to widget tree
BlocProvider.value(
  value: getIt<CartBloc>(),
  child: MyWidget(),
)
```

### 3. BLoC Initialization in `main.dart`

BLoCs that need early initialization should be triggered in `main.dart` after dependency setup:

```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await setupDependencies();
  
  // Initialize critical BLoCs
  getIt<AuthBloc>().add(AuthCheckRequested());
  
  runApp(const MyApp());
}
```

## Repository Guidelines

### Repositories ONLY call API endpoints and return data

❌ **DO NOT** include models/classes inside repository files:

```dart
// BAD - Don't do this
class CartRepository {
  // ... methods
}

// Models should NOT be here
class GetCartResponse { ... }
class CartValidation { ... }
```

✅ **DO** keep repositories simple - only API calls:

```dart
// GOOD - cart_repository.dart
import 'package:dres/core/services/api_service.dart';
import 'package:dres/features/cart/data/models/cart_model.dart';
import 'package:dres/features/cart/data/models/cart_response.dart';

export 'package:dres/features/cart/data/models/cart_model.dart';
export 'package:dres/features/cart/data/models/cart_response.dart';

class CartRepository {
  final ApiService _apiService;

  CartRepository({required ApiService apiService}) : _apiService = apiService;

  Future<GetCartResponse> getMyCart() async {
    final response = await _apiService.get('/carts/my-cart');
    return GetCartResponse.fromJson(response.data);
  }

  Future<UpdateShippingResponse> updateShipping({required String cityId}) async {
    final response = await _apiService.post(
      '/carts/update-shipping',
      data: {'cityId': cityId},
    );
    return UpdateShippingResponse.fromJson(response.data);
  }
}
```

### Model files go in `data/models/`

```dart
// GOOD - cart_response.dart (separate file)
import 'package:dres/features/cart/data/models/cart_model.dart';

class GetCartResponse {
  final CartModel? cart;
  final CartValidationResponse? validation;

  GetCartResponse({this.cart, this.validation});

  factory GetCartResponse.fromJson(Map<String, dynamic> json) {
    return GetCartResponse(
      cart: json['cart'] != null ? CartModel.fromJson(json['cart']) : null,
      validation: json['validation'] != null 
          ? CartValidationResponse.fromJson(json['validation']) 
          : null,
    );
  }
}
```

## File Organization

### When creating a new feature:

1. **Models** → `features/[feature]/data/models/`
2. **Repository** → `features/[feature]/data/repositories/`
3. **BLoC** → `features/[feature]/logic/[bloc_name]_bloc/`
4. **Screens** → `features/[feature]/presentation/view/`
5. **Widgets** → `features/[feature]/presentation/widgets/`

### Naming Conventions:

- Models: `[name]_model.dart`, `[name]_response.dart`
- Repositories: `[name]_repository.dart`
- BLoCs: `[name]_bloc.dart`, `[name]_event.dart`, `[name]_state.dart`
- Screens: `[name]_screen.dart`
- Widgets: `[name]_widget.dart` or descriptive name

## Dependency Injection Pattern

```dart
// In injection.dart

// 1. Register Services (Singletons)
getIt.registerSingleton<StorageService>(storageService);
getIt.registerLazySingleton<ApiService>(() => ApiService(getIt<StorageService>()));

// 2. Register Repositories (Singletons)
getIt.registerLazySingleton<CartRepository>(() => CartRepository(
  apiService: getIt<ApiService>(),
));

// 3. Register BLoCs
// - Use registerLazySingleton for state that persists (Cart, Auth)
// - Use registerFactory for disposable state (ProductDetails)
getIt.registerLazySingleton<CartBloc>(() => CartBloc(
  cartRepository: getIt<CartRepository>(),
));
```

## Summary Checklist

When writing code for this project:

- [ ] Models are in separate files under `data/models/`
- [ ] Repositories only contain API calls, no model definitions
- [ ] Repositories export their model dependencies
- [ ] BLoCs are registered in `lib/core/di/injection.dart`
- [ ] BLoCs are accessed via `getIt<BlocName>()`
- [ ] Critical BLoCs are initialized in `main.dart`
- [ ] Follow feature-first folder structure
