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
      // Use depth=1 to get join fields like followers, following
      final response = await _apiService.get('/users/me?depth=1');
      final data = response.data;
      debugPrint('🔵 getCurrentUser response keys: ${data is Map ? data.keys.toList() : 'not a map'}');
      
      // Payload CMS returns the user object directly, or wrapped in 'user' key
      if (data is Map<String, dynamic>) {
        Map<String, dynamic>? userData;
        
        // Check if it's the user object directly (has 'id' and 'email')
        if (data.containsKey('id') && data.containsKey('email')) {
          userData = data;
        }
        // Check if wrapped in 'user' key
        else if (data['user'] != null && data['user'] is Map<String, dynamic>) {
          userData = data['user'];
        }
        
        if (userData != null) {
          // Count followers and following from join fields
          final followers = userData['followers'];
          final following = userData['following'];
          
          int followersCount = 0;
          int followingCount = 0;
          
          // Handle followers - can be array or object with docs
          if (followers is List) {
            followersCount = followers.length;
          } else if (followers is Map && followers['docs'] is List) {
            followersCount = (followers['docs'] as List).length;
          }
          
          // Handle following - can be array or object with docs
          if (following is List) {
            followingCount = following.length;
          } else if (following is Map && following['docs'] is List) {
            followingCount = (following['docs'] as List).length;
          }
          
          userData['followersCount'] = followersCount;
          userData['followingCount'] = followingCount;
          userData['reviewsCount'] = 0; // TODO: Add reviews join if needed
          
          debugPrint('🟢 Followers: $followersCount, Following: $followingCount');
          
          final user = AuthUser.fromJson(userData);
          debugPrint('🟢 getCurrentUser parsed user: id=${user.id}, followers=${user.followersCount}, following=${user.followingCount}');
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
