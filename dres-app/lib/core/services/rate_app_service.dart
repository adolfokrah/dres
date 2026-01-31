import 'package:flutter/foundation.dart';
import 'package:in_app_review/in_app_review.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:dres/core/constants/storage_keys.dart';

/// Service for handling in-app review requests.
///
/// Uses the native in-app review APIs:
/// - iOS: SKStoreReviewController
/// - Android: Google Play In-App Review API
///
/// Safeguards:
/// - Won't show if already completed a review
/// - Won't show more than once per 30 days
/// - The system ultimately decides whether to show the dialog
class RateAppService {
  final InAppReview _inAppReview = InAppReview.instance;
  late SharedPreferences _prefs;

  /// Minimum days between showing rate app prompts
  static const int _minDaysBetweenPrompts = 30;

  /// Initialize the service
  Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }

  /// Check if we should show the rate app prompt
  bool _shouldShowRateApp() {
    // Don't show if user already completed rating
    final completed = _prefs.getBool(StorageKeys.rateAppCompleted) ?? false;
    if (completed) {
      debugPrint('[RateApp] Already completed, skipping');
      return false;
    }

    // Don't show if shown recently
    final lastShownStr = _prefs.getString(StorageKeys.rateAppLastShown);
    if (lastShownStr != null) {
      final lastShown = DateTime.tryParse(lastShownStr);
      if (lastShown != null) {
        final daysSinceLastShown = DateTime.now().difference(lastShown).inDays;
        if (daysSinceLastShown < _minDaysBetweenPrompts) {
          debugPrint('[RateApp] Shown $daysSinceLastShown days ago, need $_minDaysBetweenPrompts days');
          return false;
        }
      }
    }

    return true;
  }

  /// Request in-app review after a happy moment
  ///
  /// Call this after positive events like:
  /// - Successful withdrawal
  /// - Order delivered
  /// - First sale completed
  Future<void> requestReview() async {
    if (!_shouldShowRateApp()) return;

    try {
      final isAvailable = await _inAppReview.isAvailable();
      debugPrint('[RateApp] isAvailable: $isAvailable');

      if (isAvailable) {
        // Record that we're showing the prompt
        await _prefs.setString(
          StorageKeys.rateAppLastShown,
          DateTime.now().toIso8601String(),
        );

        // Request the review - system decides whether to actually show it
        await _inAppReview.requestReview();
        debugPrint('[RateApp] Review requested');

        // Mark as completed after requesting
        // Note: We can't know if user actually rated, but we don't want to spam them
        await _prefs.setBool(StorageKeys.rateAppCompleted, true);
      } else {
        debugPrint('[RateApp] In-app review not available');
      }
    } catch (e) {
      debugPrint('[RateApp] Error requesting review: $e');
    }
  }

  /// Open the app store page directly (fallback or manual trigger)
  Future<void> openStoreListing() async {
    try {
      await _inAppReview.openStoreListing(
        appStoreId: '6745258287', // Your iOS App Store ID
        microsoftStoreId: null, // Not on Windows
      );
    } catch (e) {
      debugPrint('[RateApp] Error opening store listing: $e');
    }
  }

  /// Reset rate app state (for testing)
  Future<void> reset() async {
    await _prefs.remove(StorageKeys.rateAppLastShown);
    await _prefs.remove(StorageKeys.rateAppCompleted);
    debugPrint('[RateApp] State reset');
  }
}
