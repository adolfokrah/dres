/// Purchase item model
class PurchaseItem {
  final String id;
  final String variationId;
  final String? variationTitle;
  final String? imageUrl;
  final String? styleName;
  final String? brandName;
  final String? size;
  final String? color;
  final double price;
  final int quantity;
  final String status;

  PurchaseItem({
    required this.id,
    required this.variationId,
    this.variationTitle,
    this.imageUrl,
    this.styleName,
    this.brandName,
    this.size,
    this.color,
    required this.price,
    required this.quantity,
    required this.status,
  });

  factory PurchaseItem.fromJson(Map<String, dynamic> json) {
    return PurchaseItem(
      id: json['id'] ?? '',
      variationId: json['variationId'] ?? '',
      variationTitle: json['variationTitle'],
      imageUrl: json['imageUrl'],
      styleName: json['styleName'],
      brandName: json['brandName'],
      size: json['size'],
      color: json['color'],
      price: (json['price'] ?? 0).toDouble(),
      quantity: json['quantity'] ?? 1,
      status: json['status'] ?? 'pending',
    );
  }
}

/// Purchase shipping address
class PurchaseShippingAddress {
  final String? city;
  final String? region;

  PurchaseShippingAddress({
    this.city,
    this.region,
  });

  factory PurchaseShippingAddress.fromJson(Map<String, dynamic> json) {
    return PurchaseShippingAddress(
      city: json['city'],
      region: json['region'],
    );
  }

  /// Get city and region formatted as "City - Region"
  String get cityRegion {
    if (city != null && region != null) {
      return '$city - $region';
    }
    return city ?? region ?? '';
  }
}

/// Purchase order status
enum PurchaseStatus {
  newOrder,
  placed,
  inProgress,
  completed,
  cancelled;

  static PurchaseStatus fromString(String value) {
    switch (value) {
      case 'new':
        return PurchaseStatus.newOrder;
      case 'placed':
        return PurchaseStatus.placed;
      case 'in_progress':
        return PurchaseStatus.inProgress;
      case 'completed':
        return PurchaseStatus.completed;
      case 'cancelled':
        return PurchaseStatus.cancelled;
      default:
        return PurchaseStatus.newOrder;
    }
  }

  String get displayName {
    switch (this) {
      case PurchaseStatus.newOrder:
        return 'New';
      case PurchaseStatus.placed:
        return 'Placed';
      case PurchaseStatus.inProgress:
        return 'In Progress';
      case PurchaseStatus.completed:
        return 'Completed';
      case PurchaseStatus.cancelled:
        return 'Cancelled';
    }
  }

  /// Get API value string for the status
  String get apiValue {
    switch (this) {
      case PurchaseStatus.newOrder:
        return 'new';
      case PurchaseStatus.placed:
        return 'placed';
      case PurchaseStatus.inProgress:
        return 'in_progress';
      case PurchaseStatus.completed:
        return 'completed';
      case PurchaseStatus.cancelled:
        return 'cancelled';
    }
  }
}

/// Purchase order model
class PurchaseModel {
  final String id;
  final String orderId;
  final PurchaseStatus status;
  final List<PurchaseItem> items;
  final PurchaseShippingAddress? shippingAddress;
  final double totalAmount;
  final DateTime createdAt;

  PurchaseModel({
    required this.id,
    required this.orderId,
    required this.status,
    required this.items,
    this.shippingAddress,
    required this.totalAmount,
    required this.createdAt,
  });

  factory PurchaseModel.fromJson(Map<String, dynamic> json) {
    return PurchaseModel(
      id: json['id'] ?? '',
      orderId: json['orderId'] ?? '',
      status: PurchaseStatus.fromString(json['status'] ?? 'new'),
      items: (json['items'] as List<dynamic>?)
              ?.map((e) => PurchaseItem.fromJson(e))
              .toList() ??
          [],
      shippingAddress: json['shippingAddress'] != null
          ? PurchaseShippingAddress.fromJson(json['shippingAddress'])
          : null,
      totalAmount: (json['totalAmount'] ?? 0).toDouble(),
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
    );
  }
}

/// Purchases response with pagination
class PurchasesResponse {
  final List<PurchaseModel> docs;
  final int totalDocs;
  final int totalPages;
  final int page;
  final int limit;
  final bool hasNextPage;
  final bool hasPrevPage;

  PurchasesResponse({
    required this.docs,
    required this.totalDocs,
    required this.totalPages,
    required this.page,
    required this.limit,
    required this.hasNextPage,
    required this.hasPrevPage,
  });

  factory PurchasesResponse.fromJson(Map<String, dynamic> json) {
    return PurchasesResponse(
      docs: (json['docs'] as List<dynamic>?)
              ?.map((e) => PurchaseModel.fromJson(e))
              .toList() ??
          [],
      totalDocs: json['totalDocs'] ?? 0,
      totalPages: json['totalPages'] ?? 0,
      page: json['page'] ?? 1,
      limit: json['limit'] ?? 10,
      hasNextPage: json['hasNextPage'] ?? false,
      hasPrevPage: json['hasPrevPage'] ?? false,
    );
  }
}
