import 'package:dres/core/models/site_settings_model.dart';
import 'package:dres/core/repositories/site_settings_repository.dart';

/// Service to manage site settings globally
class SiteSettingsService {
  final SiteSettingsRepository _repository;
  
  SiteSettingsModel? _settings;

  SiteSettingsService({required SiteSettingsRepository repository})
      : _repository = repository;

  /// Get current settings (cached)
  SiteSettingsModel get settings => _settings ?? SiteSettingsModel.defaults();

  /// Commission rate percentage (e.g., 10 for 10%)
  double get commissionRate => settings.commissionRate;

  /// Commission rate as decimal (e.g., 0.10 for 10%)
  double get commissionDecimal => settings.commissionDecimal;

  /// Buyer protection fee rate percentage (e.g., 8 for 8%)
  double get buyerProtectionFeeRate => settings.buyerProtectionFeeRate;

  /// Buyer protection fee rate as decimal (e.g., 0.08 for 8%)
  double get buyerProtectionFeeDecimal => settings.buyerProtectionFeeDecimal;

  /// Fetch settings from API and cache them
  Future<SiteSettingsModel> fetchSettings() async {
    _settings = await _repository.getSiteSettings();
    return _settings!;
  }

  /// Calculate seller earnings after commission
  double calculateSellerEarnings(double salePrice) {
    return salePrice * (1 - commissionDecimal);
  }

  /// Calculate commission amount
  double calculateCommission(double salePrice) {
    return salePrice * commissionDecimal;
  }

  /// Calculate buyer protection fee for a given item price
  double calculateBuyerProtectionFee(double itemPrice) {
    return itemPrice * buyerProtectionFeeDecimal;
  }
}
