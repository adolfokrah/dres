import 'package:flutter/foundation.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';

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
  /// Uses native Google Sign-In SDK to show account picker
  Future<UserCredential?> signInWithGoogle() async {
    try {
      // For web, use Firebase popup
      if (kIsWeb) {
        final googleProvider = GoogleAuthProvider()
          ..addScope('email')
          ..addScope('profile');
        return await _auth.signInWithPopup(googleProvider);
      }

      // For mobile, use native Google Sign-In SDK
      // This shows the native account picker with accounts on the device
      final googleSignIn = GoogleSignIn.instance;

      // Initialize Google Sign-In
      await googleSignIn.initialize();

      // Trigger the authentication flow - shows native account picker
      final googleUser = await googleSignIn.authenticate();

      debugPrint('🔵 Google Sign In - user: ${googleUser.email}');

      // Get authorization with required scopes to obtain access token
      final authorization = await googleUser.authorizationClient
          .authorizationForScopes(['email', 'profile']);

      if (authorization == null) {
        debugPrint('🔵 Google Sign In - authorization failed');
        return null;
      }

      // Create a Firebase credential with the Google access token
      final credential = GoogleAuthProvider.credential(
        accessToken: authorization.accessToken,
      );

      // Sign in to Firebase with the Google credential
      final userCredential = await _auth.signInWithCredential(credential);

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

  /// Sign out from Firebase and Google
  Future<void> signOut() async {
    try {
      // Sign out from Google to clear cached account selection
      try {
        await GoogleSignIn.instance.signOut();
        debugPrint('🔵 Google Sign Out successful');
      } catch (e) {
        debugPrint('🔵 Google Sign Out error (non-fatal): $e');
      }

      // Sign out from Firebase
      await _auth.signOut();
      debugPrint('🔥 Firebase Sign Out successful');
    } catch (e) {
      debugPrint('Sign out error: $e');
    }
  }

  /// Stream of auth state changes
  Stream<User?> get authStateChanges => _auth.authStateChanges();
}
