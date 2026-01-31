/// Storage keys used for secure storage and shared preferences
class StorageKeys {
  StorageKeys._();

  // Auth tokens
  static const String authToken = 'auth_token';
  static const String refreshToken = 'refresh_token';

  // User data
  static const String userId = 'user_id';
  static const String userEmail = 'user_email';
  static const String userDepartment = 'user_department'; // men | women | kids

  // App preferences
  static const String onboardingCompleted = 'onboarding_completed';
  static const String selectedLanguage = 'selected_language';
  static const String selectedCurrency = 'selected_currency';
  static const String themeMode = 'theme_mode';

  // Hints and tips (don't show again)
  static const String hidePublishInfoTip = 'hide_publish_info_tip';

  // Rate app
  static const String rateAppLastShown = 'rate_app_last_shown';
  static const String rateAppCompleted = 'rate_app_completed';

  // Seller milestones (for rate app triggers)
  static const String hasShownFirstSaleDialog = 'has_shown_first_sale_dialog';
}
