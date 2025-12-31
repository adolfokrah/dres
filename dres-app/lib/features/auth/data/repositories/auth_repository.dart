import 'package:flutter/foundation.dart';
import 'package:dres/core/services/api_service.dart';
import 'package:dres/core/services/storage_service.dart';
import 'package:dres/core/services/social_auth_service.dart';
import 'package:dres/features/auth/data/models/auth_models.dart';

class AuthRepository {
  final ApiService _apiService;
  final StorageService _storageService;
  final SocialAuthService _socialAuthService;

  AuthRepository({
    required ApiService apiService,
    required StorageService storageService,
    SocialAuthService? socialAuthService,
  })  : _apiService = apiService,
        _storageService = storageService,
        _socialAuthService = socialAuthService ?? SocialAuthService();

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
      debugPrint('🔵 getCurrentUser response: $data');
      
      // Payload CMS returns the user object directly, or wrapped in 'user' key
      if (data is Map<String, dynamic>) {
        // Check if it's the user object directly (has 'id' and 'email')
        if (data.containsKey('id') && data.containsKey('email')) {
          final user = AuthUser.fromJson(data);
          debugPrint('🟢 getCurrentUser parsed user directly: id=${user.id}');
          return user;
        }
        // Check if wrapped in 'user' key
        if (data['user'] != null && data['user'] is Map<String, dynamic>) {
          final user = AuthUser.fromJson(data['user']);
          debugPrint('🟢 getCurrentUser parsed user from wrapper: id=${user.id}');
          return user;
        }
      }
      debugPrint('🔴 getCurrentUser: Could not parse user from response');
      return null;
    } catch (e) {
      debugPrint('❌ getCurrentUser error: $e');
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

  /// Sign in with Apple via Firebase
  Future<AuthResponse> signInWithApple() async {
    final credential = await _socialAuthService.signInWithApple();
    if (credential == null || credential.user == null) {
      throw Exception('Apple Sign In was cancelled');
    }

    final user = credential.user!;
    final idToken = await user.getIdToken();

    // Send Firebase token to backend for user creation/login
    final response = await _apiService.post(
      '/users/oauth/firebase',
      data: {
        'idToken': idToken,
        'provider': 'apple',
        'email': user.email,
        'firstName': user.displayName?.split(' ').first,
        'lastName': user.displayName?.split(' ').skip(1).join(' '),
        'photoUrl': user.photoURL,
        'firebaseUid': user.uid,
      },
    );

    final authResponse = AuthResponse.fromJson(response.data);
    await _storageService.saveToken(authResponse.token);
    return authResponse;
  }

  /// Sign in with Google via Firebase
  Future<AuthResponse> signInWithGoogle() async {
    final credential = await _socialAuthService.signInWithGoogle();
    if (credential == null || credential.user == null) {
      throw Exception('Google Sign In was cancelled');
    }

    final user = credential.user!;
    final idToken = await user.getIdToken();

    // Send Firebase token to backend for user creation/login
    final response = await _apiService.post(
      '/users/oauth/firebase',
      data: {
        'idToken': idToken,
        'provider': 'google',
        'email': user.email,
        'firstName': user.displayName?.split(' ').first,
        'lastName': user.displayName?.split(' ').skip(1).join(' '),
        'photoUrl': user.photoURL,
        'firebaseUid': user.uid,
      },
    );

    final authResponse = AuthResponse.fromJson(response.data);
    await _storageService.saveToken(authResponse.token);
    return authResponse;
  }

  /// Sign out from social providers
  Future<void> socialSignOut() async {
    await _socialAuthService.signOut();
  }
}
