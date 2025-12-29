import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:dres/core/constants/storage_keys.dart';

/// Service for handling local storage operations
/// Uses FlutterSecureStorage for sensitive data (tokens)
/// Uses SharedPreferences for non-sensitive data (settings, etc.)
class StorageService {
  final FlutterSecureStorage _secureStorage;
  late SharedPreferences _prefs;
  
  /// Notifier for department changes - listen to this to react to updates
  final ValueNotifier<String> departmentNotifier = ValueNotifier<String>('women');

  StorageService() : _secureStorage = const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  /// Initialize SharedPreferences (call in main.dart)
  Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
    // Initialize department notifier with stored value
    departmentNotifier.value = getUserDepartment() ?? 'women';
  }

  // ========================
  // Token Management (Secure)
  // ========================

  /// Save auth token securely
  Future<void> saveToken(String token) async {
    await _secureStorage.write(key: StorageKeys.authToken, value: token);
  }

  /// Get auth token
  Future<String?> getToken() async {
    return await _secureStorage.read(key: StorageKeys.authToken);
  }

  /// Save refresh token securely
  Future<void> saveRefreshToken(String token) async {
    await _secureStorage.write(key: StorageKeys.refreshToken, value: token);
  }

  /// Get refresh token
  Future<String?> getRefreshToken() async {
    return await _secureStorage.read(key: StorageKeys.refreshToken);
  }

  /// Delete all tokens (logout)
  Future<void> deleteTokens() async {
    await _secureStorage.delete(key: StorageKeys.authToken);
    await _secureStorage.delete(key: StorageKeys.refreshToken);
  }

  /// Check if user is logged in
  Future<bool> isLoggedIn() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }

  // ========================
  // User Data (Secure)
  // ========================

  /// Save user ID
  Future<void> saveUserId(String userId) async {
    await _secureStorage.write(key: StorageKeys.userId, value: userId);
  }

  /// Get user ID
  Future<String?> getUserId() async {
    return await _secureStorage.read(key: StorageKeys.userId);
  }

  /// Save user email
  Future<void> saveUserEmail(String email) async {
    await _secureStorage.write(key: StorageKeys.userEmail, value: email);
  }

  /// Get user email
  Future<String?> getUserEmail() async {
    return await _secureStorage.read(key: StorageKeys.userEmail);
  }

  /// Save user department preference
  Future<void> setUserDepartment(String department) async {
    await _prefs.setString(StorageKeys.userDepartment, department);
    // Notify listeners of the change
    departmentNotifier.value = department;
  }

  /// Get user department preference (men | women | kids)
  String? getUserDepartment() {
    return _prefs.getString(StorageKeys.userDepartment);
  }

  // ========================
  // General Preferences
  // ========================

  /// Save string preference
  Future<void> setString(String key, String value) async {
    await _prefs.setString(key, value);
  }

  /// Get string preference
  String? getString(String key) {
    return _prefs.getString(key);
  }

  /// Save bool preference
  Future<void> setBool(String key, bool value) async {
    await _prefs.setBool(key, value);
  }

  /// Get bool preference
  bool? getBool(String key) {
    return _prefs.getBool(key);
  }

  // ========================
  // Clear All Data
  // ========================

  /// Clear all stored data (full logout)
  Future<void> clearAll() async {
    await _secureStorage.deleteAll();
    await _prefs.clear();
  }
}
