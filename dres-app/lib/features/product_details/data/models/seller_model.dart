class SellerModel {
  final String id;
  final String name;
  final String username;
  final String? profileImage;
  final bool verified;
  final bool vacationMode;
  final String usuallyShipsIn;
  final SalesHistoryModel salesHistory;
  final String memberSince;

  SellerModel({
    required this.id,
    required this.name,
    required this.username,
    this.profileImage,
    required this.verified,
    required this.vacationMode,
    required this.usuallyShipsIn,
    required this.salesHistory,
    required this.memberSince,
  });

  factory SellerModel.fromJson(Map<String, dynamic> json) {
    return SellerModel(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      username: json['username'] ?? '',
      profileImage: json['profileImage'],
      verified: json['verified'] ?? false,
      vacationMode: json['vacationMode'] ?? false,
      usuallyShipsIn: json['usuallyShipsIn'] ?? '',
      salesHistory: SalesHistoryModel.fromJson(json['salesHistory'] ?? {}),
      memberSince: json['memberSince'] ?? '',
    );
  }
}

class SalesHistoryModel {
  final int itemsSold;
  final int shipped;
  final int cancelled;

  SalesHistoryModel({
    required this.itemsSold,
    required this.shipped,
    required this.cancelled,
  });

  factory SalesHistoryModel.fromJson(Map<String, dynamic> json) {
    return SalesHistoryModel(
      itemsSold: json['itemsSold'] ?? 0,
      shipped: json['shipped'] ?? 0,
      cancelled: json['cancelled'] ?? 0,
    );
  }
}
