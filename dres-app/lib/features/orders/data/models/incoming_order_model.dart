/// Incoming order item model (seller's view of order items)
class IncomingOrderItem {
  final String id;
  final String variationId;
  final String? variationTitle;
  final String? imageUrl;
  final String? styleName;
  final String? brandName;
  final String? size;
  final String? color;
  final double price;
  final double originalPrice;
  final int quantity;
  final String status;

  IncomingOrderItem({
    required this.id,
    required this.variationId,
    this.variationTitle,
    this.imageUrl,
    this.styleName,
    this.brandName,
    this.size,
    this.color,
    required this.price,
    required this.originalPrice,
    required this.quantity,
    required this.status,
  });

  factory IncomingOrderItem.fromJson(Map<String, dynamic> json) {
    return IncomingOrderItem(
      id: json['id'] ?? '',
      variationId: json['variationId'] ?? '',
      variationTitle: json['variationTitle'],
      imageUrl: json['imageUrl'],
      styleName: json['styleName'],
      brandName: json['brandName'],
      size: json['size'],
      color: json['color'],
      price: (json['price'] ?? 0).toDouble(),
      originalPrice: (json['originalPrice'] ?? 0).toDouble(),
      quantity: json['quantity'] ?? 1,
      status: json['status'] ?? 'placed',
    );
  }
}

/// Incoming order shipping address
class IncomingOrderShippingAddress {
  final String? city;
  final String? region;

  IncomingOrderShippingAddress({
    this.city,
    this.region,
  });

  factory IncomingOrderShippingAddress.fromJson(Map<String, dynamic> json) {
    return IncomingOrderShippingAddress(
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

/// Incoming order status (seller-specific)
enum IncomingOrderStatus {
  newOrder,
  placed,
  inProgress,
  returnInProgress,
  completed,
  cancelled;

  static IncomingOrderStatus fromString(String value) {
    switch (value) {
      case 'new':
        return IncomingOrderStatus.newOrder;
      case 'placed':
        return IncomingOrderStatus.placed;
      case 'in_progress':
        return IncomingOrderStatus.inProgress;
      case 'return_in_progress':
        return IncomingOrderStatus.returnInProgress;
      case 'completed':
        return IncomingOrderStatus.completed;
      case 'cancelled':
        return IncomingOrderStatus.cancelled;
      default:
        return IncomingOrderStatus.newOrder;
    }
  }

  String get displayName {
    switch (this) {
      case IncomingOrderStatus.newOrder:
        return 'New';
      case IncomingOrderStatus.placed:
        return 'Placed';
      case IncomingOrderStatus.inProgress:
        return 'In Progress';
      case IncomingOrderStatus.returnInProgress:
        return 'Return in Progress';
      case IncomingOrderStatus.completed:
        return 'Completed';
      case IncomingOrderStatus.cancelled:
        return 'Cancelled';
    }
  }

  /// Get API value string for the status
  String get apiValue {
    switch (this) {
      case IncomingOrderStatus.newOrder:
        return 'new';
      case IncomingOrderStatus.placed:
        return 'placed';
      case IncomingOrderStatus.inProgress:
        return 'in_progress';
      case IncomingOrderStatus.returnInProgress:
        return 'return_in_progress';
      case IncomingOrderStatus.completed:
        return 'completed';
      case IncomingOrderStatus.cancelled:
        return 'cancelled';
    }
  }
}

/// Incoming order model (seller's view)
class IncomingOrderModel {
  final String id;
  final String orderId;
  final IncomingOrderStatus status; // Overall order status
  final IncomingOrderStatus sellerStatus; // Status based on seller's items only
  final List<IncomingOrderItem> items;
  final IncomingOrderShippingAddress? shippingAddress;
  final double totalAmount;
  final DateTime createdAt;

  IncomingOrderModel({
    required this.id,
    required this.orderId,
    required this.status,
    required this.sellerStatus,
    required this.items,
    this.shippingAddress,
    required this.totalAmount,
    required this.createdAt,
  });

  factory IncomingOrderModel.fromJson(Map<String, dynamic> json) {
    return IncomingOrderModel(
      id: json['id'] ?? '',
      orderId: json['orderId'] ?? '',
      status: IncomingOrderStatus.fromString(json['status'] ?? 'new'),
      sellerStatus: IncomingOrderStatus.fromString(json['sellerStatus'] ?? json['status'] ?? 'new'),
      items: (json['items'] as List<dynamic>?)
              ?.map((e) => IncomingOrderItem.fromJson(e))
              .toList() ??
          [],
      shippingAddress: json['shippingAddress'] != null
          ? IncomingOrderShippingAddress.fromJson(json['shippingAddress'])
          : null,
      totalAmount: (json['totalAmount'] ?? 0).toDouble(),
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
    );
  }
}

/// Incoming orders response with pagination
class IncomingOrdersResponse {
  final List<IncomingOrderModel> docs;
  final int totalDocs;
  final int totalPages;
  final int page;
  final int limit;
  final bool hasNextPage;
  final bool hasPrevPage;

  IncomingOrdersResponse({
    required this.docs,
    required this.totalDocs,
    required this.totalPages,
    required this.page,
    required this.limit,
    required this.hasNextPage,
    required this.hasPrevPage,
  });

  factory IncomingOrdersResponse.fromJson(Map<String, dynamic> json) {
    return IncomingOrdersResponse(
      docs: (json['docs'] as List<dynamic>?)
              ?.map((e) => IncomingOrderModel.fromJson(e))
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
