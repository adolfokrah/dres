/// Site settings model for app configuration from CMS
class SiteSettingsModel {
  final double commissionRate;
  final double minOrderValue;
  final double buyerProtectionFeeRate;
  final double refundTransactionFeeRate;
  final double defaultShippingRate;

  SiteSettingsModel({
    required this.commissionRate,
    required this.minOrderValue,
    required this.buyerProtectionFeeRate,
    required this.refundTransactionFeeRate,
    required this.defaultShippingRate,
  });

  /// Commission rate as a decimal (e.g., 0.10 for 10%)
  double get commissionDecimal => commissionRate / 100;

  /// Buyer protection fee rate as a decimal (e.g., 0.04 for 4%)
  double get buyerProtectionFeeDecimal => buyerProtectionFeeRate / 100;

  /// Refund transaction fee rate as a decimal (e.g., 0.05 for 5%)
  double get refundTransactionFeeDecimal => refundTransactionFeeRate / 100;

  /// Calculate buyer protection fee for a given item total (price × quantity)
  double calculateBuyerProtectionFee(double itemTotal) {
    return itemTotal * buyerProtectionFeeDecimal;
  }

  factory SiteSettingsModel.fromJson(Map<String, dynamic> json) {
    return SiteSettingsModel(
      commissionRate: (json['commissionRate'] ?? 10).toDouble(),
      minOrderValue: (json['minOrderValue'] ?? 30).toDouble(),
      buyerProtectionFeeRate: (json['buyerProtectionFeeRate'] ?? 4).toDouble(),
      refundTransactionFeeRate: (json['refundTransactionFeeRate'] ?? 5).toDouble(),
      defaultShippingRate: (json['defaultShippingRate'] ?? 30).toDouble(),
    );
  }

  /// Default settings (used when API fails)
  factory SiteSettingsModel.defaults() {
    return SiteSettingsModel(
      commissionRate: 10,
      minOrderValue: 30,
      buyerProtectionFeeRate: 4,
      refundTransactionFeeRate: 5,
      defaultShippingRate: 30,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'commissionRate': commissionRate,
      'minOrderValue': minOrderValue,
      'buyerProtectionFeeRate': buyerProtectionFeeRate,
      'refundTransactionFeeRate': refundTransactionFeeRate,
      'defaultShippingRate': defaultShippingRate,
    };
  }
}
