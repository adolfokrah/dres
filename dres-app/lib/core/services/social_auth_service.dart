import 'package:flutter/foundation.dart';
import 'package:firebase_auth/firebase_auth.dart';

/// Service for handling social authentication via Firebase
class SocialAuthService {
  static final SocialAuthService _instance = SocialAuthService._internal();
  factory SocialAuthService() => _instance;
  SocialAuthService._internal();

  final FirebaseAuth _auth = FirebaseAuth.instance;

  /// Sign in with Apple via Firebase
  Future<UserCredential?> signInWithApple() async {
    try {
      // Create Apple auth provider
      final appleProvider = AppleAuthProvider()
        ..addScope('email')
        ..addScope('name');

      // For web, we need to handle differently
      if (kIsWeb) {
        return await _auth.signInWithPopup(appleProvider);
      }

      // For iOS/macOS/Android
      final credential = await _auth.signInWithProvider(appleProvider);
      
      debugPrint('🍎 Apple Sign In successful: ${credential.user?.email}');
      return credential;
    } on FirebaseAuthException catch (e) {
      debugPrint('❌ Apple Sign In FirebaseAuth error: ${e.code} - ${e.message}');
      if (e.code == 'canceled' || e.code == 'user-cancelled') {
        return null;
      }
      rethrow;
    } catch (e) {
      debugPrint('❌ Apple Sign In error: $e');
      if (e.toString().contains('canceled') || e.toString().contains('cancelled')) {
        return null;
      }
      rethrow;
    }
  }

  /// Sign in with Google via Firebase
  Future<UserCredential?> signInWithGoogle() async {
    try {
      // Use Firebase's built-in Google sign-in via provider
      final googleProvider = GoogleAuthProvider()
        ..addScope('email')
        ..addScope('profile');

      // For web, use popup
      if (kIsWeb) {
        return await _auth.signInWithPopup(googleProvider);
      }
      
      // For mobile, use signInWithProvider
      final userCredential = await _auth.signInWithProvider(googleProvider);
      
      debugPrint('🔵 Google Sign In successful: ${userCredential.user?.email}');
      return userCredential;
    } on FirebaseAuthException catch (e) {
      debugPrint('❌ Google Sign In FirebaseAuth error: ${e.code} - ${e.message}');
      if (e.code == 'canceled' || e.code == 'user-cancelled') {
        return null;
      }
      rethrow;
    } catch (e) {
      debugPrint('❌ Google Sign In error: $e');
      if (e.toString().contains('canceled') || e.toString().contains('cancelled')) {
        return null;
      }
      rethrow;
    }
  }

  /// Get the current Firebase user
  User? get currentUser => _auth.currentUser;

  /// Get the Firebase ID token for the current user
  Future<String?> getIdToken() async {
    return await _auth.currentUser?.getIdToken();
  }

  /// Sign out from Firebase
  Future<void> signOut() async {
    try {
      await _auth.signOut();
    } catch (e) {
      debugPrint('Sign out error: $e');
    }
  }

  /// Stream of auth state changes
  Stream<User?> get authStateChanges => _auth.authStateChanges();
}
