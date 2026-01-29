import 'package:dres/core/utilities/media_utils.dart';

/// Incoming order item shipping status enum
enum IncomingItemStatus {
  placed('placed'),
  newItem('new'),
  outForDelivery('out_for_delivery'),
  delivered('delivered'),
  returnInProgress('return_in_progress'),
  returned('returned'),
  notAvailable('not_available'),
  cancelled('cancelled'),
  disputed('disputed');

  const IncomingItemStatus(this.value);
  final String value;

  static IncomingItemStatus fromString(String? value) {
    return IncomingItemStatus.values.firstWhere(
      (e) => e.value == value,
      orElse: () => IncomingItemStatus.placed,
    );
  }

  String get displayName {
    switch (this) {
      case IncomingItemStatus.placed:
        return 'Placed';
      case IncomingItemStatus.newItem:
        return 'New';
      case IncomingItemStatus.outForDelivery:
        return 'Out for delivery';
      case IncomingItemStatus.delivered:
        return 'Delivered';
      case IncomingItemStatus.returnInProgress:
        return 'Return in progress';
      case IncomingItemStatus.returned:
        return 'Returned';
      case IncomingItemStatus.notAvailable:
        return 'Not available';
      case IncomingItemStatus.cancelled:
        return 'Cancelled';
      case IncomingItemStatus.disputed:
        return 'Disputed';
    }
  }

  /// Get progress value (0-4) for progress bar
  int get progressValue {
    switch (this) {
      case IncomingItemStatus.placed:
      case IncomingItemStatus.newItem:
        return 1;
      case IncomingItemStatus.outForDelivery:
        return 2;
      case IncomingItemStatus.delivered:
        return 4; // All steps complete when delivered
      case IncomingItemStatus.returned:
        return 4;
      case IncomingItemStatus.returnInProgress:
      case IncomingItemStatus.notAvailable:
      case IncomingItemStatus.cancelled:
      case IncomingItemStatus.disputed:
        return 0;
    }
  }
}

/// Status log entry
class IncomingStatusLog {
  final String status;
  final DateTime timestamp;
  final String? note;

  IncomingStatusLog({
    required this.status,
    required this.timestamp,
    this.note,
  });

  factory IncomingStatusLog.fromJson(Map<String, dynamic> json) {
    return IncomingStatusLog(
      status: json['status'] ?? '',
      timestamp: DateTime.tryParse(json['timestamp'] ?? '') ?? DateTime.now(),
      note: json['note'],
    );
  }
}

/// Incoming order item model (seller's view)
class IncomingOrderItemModel {
  final String id;
  final String? variationId;
  final String? variationTitle;
  final String? brandName;
  final String? skuTitle;
  final String? imageUrl;
  final double price;
  final double originalPrice;
  final int quantity;
  final double shippingFee;
  final IncomingItemStatus shippingStatus;
  final String? returnReason;
  final String? returnImage;
  final List<IncomingStatusLog> statusLogs;

  IncomingOrderItemModel({
    required this.id,
    this.variationId,
    this.variationTitle,
    this.brandName,
    this.skuTitle,
    this.imageUrl,
    required this.price,
    required this.originalPrice,
    required this.quantity,
    required this.shippingFee,
    required this.shippingStatus,
    this.returnReason,
    this.returnImage,
    this.statusLogs = const [],
  });

  factory IncomingOrderItemModel.fromJson(Map<String, dynamic> json) {
    return IncomingOrderItemModel(
      id: json['id'] ?? '',
      variationId: json['variationId'],
      variationTitle: json['variationTitle'],
      brandName: json['brandName'],
      skuTitle: json['skuTitle'],
      imageUrl: json['imageUrl'],
      price: (json['price'] ?? 0).toDouble(),
      originalPrice: (json['originalPrice'] ?? 0).toDouble(),
      quantity: json['quantity'] ?? 1,
      shippingFee: (json['shippingFee'] ?? 0).toDouble(),
      shippingStatus: IncomingItemStatus.fromString(json['shippingStatus']),
      returnReason: json['returnReason'],
      returnImage: json['returnImage'],
      statusLogs: (json['statusLogs'] as List<dynamic>?)
              ?.map((e) => IncomingStatusLog.fromJson(e))
              .toList() ??
          [],
    );
  }

  /// Get resolved image URL
  String? get resolvedImageUrl => MediaUtils.resolveUrl(imageUrl);

  /// Get resolved return image URL
  String? get resolvedReturnImageUrl => MediaUtils.resolveUrl(returnImage);

  /// Total for this item (price * quantity)
  double get itemTotal => price * quantity;

  /// Get the SKU option value (middle part of "Pink / 44 / ₵ 233")
  String? get skuOptionValue {
    if (skuTitle == null || skuTitle!.isEmpty) return null;
    
    final parts = skuTitle!.split(' / ');
    if (parts.length >= 2) {
      // Return the middle part(s) - everything except first (color) and last (price)
      if (parts.length == 3) {
        return parts[1]; // e.g., "44" from "Pink / 44 / ₵ 233"
      } else if (parts.length > 3) {
        return parts.sublist(1, parts.length - 1).join(' / ');
      }
    }
    return null;
  }

  /// Get display text for SKU option and quantity (e.g., "L/2 x1")
  String get skuOptionDisplay {
    final option = skuOptionValue;
    if (option != null && option.isNotEmpty) {
      return '$option x$quantity';
    }
    return 'x$quantity';
  }

  /// Check if item is in placed/new status (can mark as not available)
  bool get canMarkNotAvailable =>
      shippingStatus == IncomingItemStatus.placed ||
      shippingStatus == IncomingItemStatus.newItem;

  /// Check if item has return in progress
  bool get hasReturnInProgress =>
      shippingStatus == IncomingItemStatus.returnInProgress;

  /// Check if item has return info to show (return in progress, returned, or disputed)
  bool get hasReturnInfo =>
      shippingStatus == IncomingItemStatus.returnInProgress ||
      shippingStatus == IncomingItemStatus.returned ||
      shippingStatus == IncomingItemStatus.disputed;

  /// Get return reason display label (backend returns label directly)
  String? get returnReasonLabel => returnReason;
}

/// Incoming order shipping info
class IncomingOrderShipping {
  final String customerName;
  final String address;
  final String? city;
  final String? region;
  final String? phone;

  IncomingOrderShipping({
    required this.customerName,
    required this.address,
    this.city,
    this.region,
    this.phone,
  });

  factory IncomingOrderShipping.fromJson(Map<String, dynamic> json) {
    return IncomingOrderShipping(
      customerName: json['customerName'] ?? '',
      address: json['address'] ?? '',
      city: json['city'],
      region: json['region'],
      phone: json['phone'],
    );
  }

  /// Get formatted location (city only)
  String get location => city ?? '';
}

/// Incoming order details status enum (for details screen, based on seller's items)
enum IncomingOrderDetailsStatus {
  newOrder('new'),
  placed('placed'),
  inProgress('in_progress'),
  returnInProgress('return_in_progress'),
  completed('completed'),
  cancelled('cancelled');

  const IncomingOrderDetailsStatus(this.value);
  final String value;

  static IncomingOrderDetailsStatus fromString(String? value) {
    return IncomingOrderDetailsStatus.values.firstWhere(
      (e) => e.value == value,
      orElse: () => IncomingOrderDetailsStatus.placed,
    );
  }

  String get displayName {
    switch (this) {
      case IncomingOrderDetailsStatus.newOrder:
        return 'New';
      case IncomingOrderDetailsStatus.placed:
        return 'Placed';
      case IncomingOrderDetailsStatus.inProgress:
        return 'In progress';
      case IncomingOrderDetailsStatus.returnInProgress:
        return 'Return in progress';
      case IncomingOrderDetailsStatus.completed:
        return 'Completed';
      case IncomingOrderDetailsStatus.cancelled:
        return 'Cancelled';
    }
  }

  /// Get progress value (0-4) for progress bar
  int get progressValue {
    switch (this) {
      case IncomingOrderDetailsStatus.newOrder:
      case IncomingOrderDetailsStatus.placed:
        return 1;
      case IncomingOrderDetailsStatus.inProgress:
        return 2;
      case IncomingOrderDetailsStatus.returnInProgress:
        return 3;
      case IncomingOrderDetailsStatus.completed:
        return 4;
      case IncomingOrderDetailsStatus.cancelled:
        return 0;
    }
  }
}

/// Incoming order details model (seller's view)
class IncomingOrderDetailsModel {
  final String id;
  final String orderId;
  final IncomingOrderDetailsStatus status; // Overall order status
  final IncomingOrderDetailsStatus sellerStatus; // Status based on seller's items only
  final List<IncomingOrderItemModel> items;
  final IncomingOrderShipping? shipping;
  final int itemCount;
  final double itemsTotal;
  final double shippingFee;
  final double subtotal;
  final DateTime createdAt;
  final String currencySymbol;

  IncomingOrderDetailsModel({
    required this.id,
    required this.orderId,
    required this.status,
    required this.sellerStatus,
    required this.items,
    this.shipping,
    required this.itemCount,
    required this.itemsTotal,
    required this.shippingFee,
    required this.subtotal,
    required this.createdAt,
    required this.currencySymbol,
  });

  factory IncomingOrderDetailsModel.fromJson(Map<String, dynamic> json) {
    return IncomingOrderDetailsModel(
      id: json['id'] ?? '',
      orderId: json['orderId'] ?? '',
      status: IncomingOrderDetailsStatus.fromString(json['status']),
      sellerStatus: IncomingOrderDetailsStatus.fromString(json['sellerStatus'] ?? json['status']),
      items: (json['items'] as List<dynamic>?)
              ?.map((e) => IncomingOrderItemModel.fromJson(e))
              .toList() ??
          [],
      shipping: json['shipping'] != null
          ? IncomingOrderShipping.fromJson(json['shipping'])
          : null,
      itemCount: json['itemCount'] ?? 0,
      itemsTotal: (json['itemsTotal'] ?? 0).toDouble(),
      shippingFee: (json['shippingFee'] ?? 0).toDouble(),
      subtotal: (json['subtotal'] ?? 0).toDouble(),
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
      currencySymbol: json['currencySymbol'] ?? '₵',
    );
  }

  /// Check if all items are out for delivery or beyond
  bool get allItemsOutForDelivery {
    if (items.isEmpty) return true;
    return items.every((item) =>
        item.shippingStatus == IncomingItemStatus.outForDelivery ||
        item.shippingStatus == IncomingItemStatus.delivered ||
        item.shippingStatus == IncomingItemStatus.returned ||
        item.shippingStatus == IncomingItemStatus.notAvailable ||
        item.shippingStatus == IncomingItemStatus.cancelled ||
        item.shippingStatus == IncomingItemStatus.disputed);
  }

  /// Check if any items have return in progress
  bool get hasReturnInProgress {
    return items.any((item) => item.hasReturnInProgress);
  }

  /// Check if any items are in placed status (can be marked as out for delivery)
  bool get hasPlacedItems {
    return items.any((item) =>
        item.shippingStatus == IncomingItemStatus.placed ||
        item.shippingStatus == IncomingItemStatus.newItem);
  }

  /// Check if any items are out for delivery (awaiting delivery confirmation)
  bool get hasOutForDeliveryItems {
    return items.any(
        (item) => item.shippingStatus == IncomingItemStatus.outForDelivery);
  }
}
