/// Bank model from Paystack API
class BankModel {
  final int id;
  final String name;
  final String slug;
  final String code;
  final String? longcode;
  final bool supportsTransfer;
  final bool active;
  final String country;
  final String currency;
  final String type;

  const BankModel({
    required this.id,
    required this.name,
    required this.slug,
    required this.code,
    this.longcode,
    required this.supportsTransfer,
    required this.active,
    required this.country,
    required this.currency,
    required this.type,
  });

  factory BankModel.fromJson(Map<String, dynamic> json) {
    return BankModel(
      id: json['id'] as int,
      name: json['name'] as String,
      slug: json['slug'] as String? ?? '',
      code: json['code'] as String,
      longcode: json['longcode'] as String?,
      supportsTransfer: json['supportsTransfer'] as bool? ?? json['supports_transfer'] as bool? ?? false,
      active: json['active'] as bool? ?? true,
      country: json['country'] as String? ?? '',
      currency: json['currency'] as String? ?? '',
      type: json['type'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'slug': slug,
      'code': code,
      'longcode': longcode,
      'supports_transfer': supportsTransfer,
      'active': active,
      'country': country,
      'currency': currency,
      'type': type,
    };
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is BankModel && other.code == code;
  }

  @override
  int get hashCode => code.hashCode;

  @override
  String toString() => name;
}
