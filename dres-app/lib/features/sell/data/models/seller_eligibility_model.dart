/// Model for individual requirement status
class RequirementStatus {
  final bool complete;
  final String? value;
  final String? url;
  final int? count;
  final WithdrawalDetails? details;
  final String message;

  RequirementStatus({
    required this.complete,
    this.value,
    this.url,
    this.count,
    this.details,
    required this.message,
  });

  factory RequirementStatus.fromJson(Map<String, dynamic> json) {
    return RequirementStatus(
      complete: json['complete'] as bool? ?? false,
      value: json['value'] as String?,
      url: json['url'] as String?,
      count: json['count'] as int?,
      details: json['details'] != null
          ? WithdrawalDetails.fromJson(json['details'] as Map<String, dynamic>)
          : null,
      message: json['message'] as String? ?? '',
    );
  }
}

/// Model for withdrawal account details (masked)
class WithdrawalDetails {
  final String? accountName;
  final String? accountNumber;
  final String? bank;

  WithdrawalDetails({
    this.accountName,
    this.accountNumber,
    this.bank,
  });

  factory WithdrawalDetails.fromJson(Map<String, dynamic> json) {
    return WithdrawalDetails(
      accountName: json['accountName'] as String?,
      accountNumber: json['accountNumber'] as String?,
      bank: json['bank'] as String?,
    );
  }
}

/// Model for all seller requirements
class SellerRequirements {
  final RequirementStatus shopName;
  final RequirementStatus phoneNumber;
  final RequirementStatus photo;
  final RequirementStatus withdrawalAccount;
  final RequirementStatus shippingRates;

  SellerRequirements({
    required this.shopName,
    required this.phoneNumber,
    required this.photo,
    required this.withdrawalAccount,
    required this.shippingRates,
  });

  factory SellerRequirements.fromJson(Map<String, dynamic> json) {
    return SellerRequirements(
      shopName: RequirementStatus.fromJson(json['shopName'] as Map<String, dynamic>),
      phoneNumber: RequirementStatus.fromJson(json['phoneNumber'] as Map<String, dynamic>),
      photo: RequirementStatus.fromJson(json['photo'] as Map<String, dynamic>),
      withdrawalAccount: RequirementStatus.fromJson(json['withdrawalAccount'] as Map<String, dynamic>),
      shippingRates: RequirementStatus.fromJson(json['shippingRates'] as Map<String, dynamic>),
    );
  }

  /// Get list of all requirements as a list for iteration
  List<MapEntry<String, RequirementStatus>> get asList => [
        MapEntry('Shop Name', shopName),
        MapEntry('Phone Number', phoneNumber),
        MapEntry('Profile Photo', photo),
        MapEntry('Withdrawal Account', withdrawalAccount),
        MapEntry('Shipping Rates', shippingRates),
      ];
}

/// Model for seller eligibility response
class SellerEligibilityModel {
  final bool canSell;
  final SellerRequirements requirements;
  final int completedCount;
  final int totalCount;
  final int progress;

  SellerEligibilityModel({
    required this.canSell,
    required this.requirements,
    required this.completedCount,
    required this.totalCount,
    required this.progress,
  });

  factory SellerEligibilityModel.fromJson(Map<String, dynamic> json) {
    return SellerEligibilityModel(
      canSell: json['canSell'] as bool? ?? false,
      requirements: SellerRequirements.fromJson(json['requirements'] as Map<String, dynamic>),
      completedCount: json['completedCount'] as int? ?? 0,
      totalCount: json['totalCount'] as int? ?? 5,
      progress: json['progress'] as int? ?? 0,
    );
  }
}
