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
      // Use depth=2 to get nested fields like country.currency
      final response = await _apiService.get('/users/me?depth=2');
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

  /// Update user profile
  Future<AuthUser> updateProfile(Map<String, dynamic> updates) async {
    debugPrint('🔵 updateProfile: $updates');
    
    // Get current user ID
    final currentUser = await getCurrentUser();
    if (currentUser == null) {
      throw Exception('User not logged in');
    }

    // Update user via PATCH request
    final response = await _apiService.patch(
      '/users/${currentUser.id}',
      data: updates,
    );

    debugPrint('🟢 updateProfile response: ${response.data}');
    
    // Parse the updated user
    final data = response.data;
    if (data is Map<String, dynamic>) {
      // Response might have 'doc' wrapper from Payload
      final userData = data['doc'] ?? data;
      return AuthUser.fromJson(userData);
    }
    
    throw Exception('Invalid response from server');
  }

  /// Update user photo
  Future<AuthUser> updatePhoto(String filePath) async {
    debugPrint('🔵 updatePhoto: $filePath');
    
    // Get current user ID
    final currentUser = await getCurrentUser();
    if (currentUser == null) {
      throw Exception('User not logged in');
    }

    // First upload the media file
    final mediaResponse = await _apiService.uploadFile(
      '/media',
      filePath: filePath,
      fieldName: 'file',
    );

    debugPrint('🟢 Media upload response: ${mediaResponse.data}');
    
    final mediaId = mediaResponse.data['doc']?['id'] ?? mediaResponse.data['id'];
    if (mediaId == null) {
      throw Exception('Failed to upload photo');
    }

    // Then update user profile with the media ID
    return updateProfile({'photo': mediaId});
  }

  /// Request account deletion - sets status to 'to-be-archived'
  /// Actual deletion will be handled by a cron job
  Future<void> deleteAccount() async {
    final currentUser = await getCurrentUser();
    if (currentUser == null) {
      throw Exception('User not logged in');
    }

    // Set user accountStatus to 'to-be-archived' instead of deleting
    await _apiService.patch(
      '/users/${currentUser.id}',
      data: {'accountStatus': 'to-be-archived'},
    );
    
    // Log the user out
    await _storageService.deleteTokens();
  }

  /// Update user email with verification
  /// Returns updated user data
  Future<Map<String, dynamic>> updateEmail(String newEmail) async {
    debugPrint('🔵 updateEmail: $newEmail');
    
    final response = await _apiService.post(
      '/users/update-email',
      data: {'email': newEmail},
    );

    debugPrint('🟢 Email update response: ${response.data}');
    
    if (response.data is Map<String, dynamic>) {
      return response.data;
    }
    
    throw Exception('Invalid response from server');
  }

  /// Resend verification email
  Future<Map<String, dynamic>> resendVerification() async {
    debugPrint('🔵 resendVerification');
    
    final response = await _apiService.post('/users/resend-verification');

    debugPrint('🟢 Resend verification response: ${response.data}');
    
    if (response.data is Map<String, dynamic>) {
      return response.data;
    }
    
    throw Exception('Invalid response from server');
  }
}
