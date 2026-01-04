import 'package:flutter/material.dart';

/// Provider to manage app locale/language
class LocaleProvider extends ChangeNotifier {
  Locale _locale = const Locale('en');

  Locale get locale => _locale;

  /// Set the locale and notify listeners
  void setLocale(String languageCode) {
    if (_locale.languageCode == languageCode) return;
    
    // Only support English and French for now
    if (languageCode == 'en' || languageCode == 'fr') {
      _locale = Locale(languageCode);
      notifyListeners();
    }
  }

  /// Initialize locale from user preference
  void initFromLanguageCode(String? languageCode) {
    if (languageCode != null && (languageCode == 'en' || languageCode == 'fr')) {
      _locale = Locale(languageCode);
    }
  }
}
