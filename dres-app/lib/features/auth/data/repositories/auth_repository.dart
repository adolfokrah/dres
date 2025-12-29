import 'package:dres/core/services/api_service.dart';
import 'package:dres/core/services/storage_service.dart';
import 'package:dres/features/auth/data/models/auth_models.dart';

class AuthRepository {
  final ApiService _apiService;
  final StorageService _storageService;

  AuthRepository({
    required ApiService apiService,
    required StorageService storageService,
  })  : _apiService = apiService,
        _storageService = storageService;

  /// Register a new user
  Future<AuthResponse> register(RegisterRequest request) async {
    final response = await _apiService.post(
      '/users',
      data: request.toJson(),
    );

    final authResponse = AuthResponse.fromJson(response.data);
    
    // Save token after successful registration
    await _storageService.saveToken(authResponse.token);
    
    return authResponse;
  }

  /// Login with email and password
  Future<AuthResponse> login(LoginRequest request) async {
    final response = await _apiService.post(
      '/users/login',
      data: request.toJson(),
    );

    final authResponse = AuthResponse.fromJson(response.data);
    
    // Save token after successful login
    await _storageService.saveToken(authResponse.token);
    
    return authResponse;
  }

  /// Logout current user
  Future<void> logout() async {
    try {
      await _apiService.post('/users/logout');
    } catch (_) {
      // Ignore errors on logout
    } finally {
      await _storageService.deleteTokens();
    }
  }

  /// Get current user info
  Future<AuthUser?> getCurrentUser() async {
    try {
      final response = await _apiService.get('/users/me');
      final data = response.data;
      return AuthUser.fromJson(data['user'] ?? data);
    } catch (_) {
      return null;
    }
  }

  /// Request password reset
  Future<void> forgotPassword(String email) async {
    await _apiService.post(
      '/users/forgot-password',
      data: {'email': email},
    );
  }

  /// Check if user is logged in
  Future<bool> isLoggedIn() async {
    final token = await _storageService.getToken();
    return token != null && token.isNotEmpty;
  }
}
