/// Site settings model for app configuration from CMS
class SiteSettingsModel {
  final double commissionRate;
  final double buyerProtectionFeeRate;

  SiteSettingsModel({
    required this.commissionRate,
    required this.buyerProtectionFeeRate,
  });

  /// Commission rate as a decimal (e.g., 0.10 for 10%)
  double get commissionDecimal => commissionRate / 100;

  /// Buyer protection fee rate as a decimal (e.g., 0.08 for 8%)
  double get buyerProtectionFeeDecimal => buyerProtectionFeeRate / 100;

  /// Calculate buyer protection fee for a given item price
  double calculateBuyerProtectionFee(double itemPrice) {
    return itemPrice * buyerProtectionFeeDecimal;
  }

  factory SiteSettingsModel.fromJson(Map<String, dynamic> json) {
    return SiteSettingsModel(
      commissionRate: (json['commissionRate'] ?? 10).toDouble(),
      buyerProtectionFeeRate: (json['buyerProtectionFeeRate'] ?? 8).toDouble(),
    );
  }

  /// Default settings (used when API fails)
  factory SiteSettingsModel.defaults() {
    return SiteSettingsModel(
      commissionRate: 10,
      buyerProtectionFeeRate: 8,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'commissionRate': commissionRate,
      'buyerProtectionFeeRate': buyerProtectionFeeRate,
    };
  }
}
