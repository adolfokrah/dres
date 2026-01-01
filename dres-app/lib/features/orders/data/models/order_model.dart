import 'package:dres/core/utilities/media_utils.dart';

/// Order status enum
enum OrderStatus {
  newOrder('new'),
  placed('placed'),
  inProgress('in_progress'),
  completed('completed'),
  cancelled('cancelled');

  const OrderStatus(this.value);
  final String value;

  static OrderStatus fromString(String? value) {
    return OrderStatus.values.firstWhere(
      (e) => e.value == value,
      orElse: () => OrderStatus.placed,
    );
  }

  String get displayName {
    switch (this) {
      case OrderStatus.newOrder:
        return 'New';
      case OrderStatus.placed:
        return 'Placed';
      case OrderStatus.inProgress:
        return 'In progress';
      case OrderStatus.completed:
        return 'Completed';
      case OrderStatus.cancelled:
        return 'Cancelled';
    }
  }
}

/// Item shipping status enum
enum ShippingStatus {
  placed('placed'),
  outForDelivery('out_for_delivery'),
  delivered('delivered'),
  returnInProgress('return_in_progress'),
  returned('returned'),
  notAvailable('not_available'),
  cancelled('cancelled');

  const ShippingStatus(this.value);
  final String value;

  static ShippingStatus fromString(String? value) {
    return ShippingStatus.values.firstWhere(
      (e) => e.value == value,
      orElse: () => ShippingStatus.placed,
    );
  }

  String get displayName {
    switch (this) {
      case ShippingStatus.placed:
        return 'Placed';
      case ShippingStatus.outForDelivery:
        return 'Out for delivery';
      case ShippingStatus.delivered:
        return 'Delivered';
      case ShippingStatus.returnInProgress:
        return 'Return in progress';
      case ShippingStatus.returned:
        return 'Returned';
      case ShippingStatus.notAvailable:
        return 'Not available';
      case ShippingStatus.cancelled:
        return 'Cancelled';
    }
  }

  /// Get progress value (0-4) for progress bar
  int get progressValue {
    switch (this) {
      case ShippingStatus.placed:
        return 1;
      case ShippingStatus.outForDelivery:
        return 2;
      case ShippingStatus.delivered:
        return 3;
      case ShippingStatus.returned:
      case ShippingStatus.returnInProgress:
      case ShippingStatus.notAvailable:
      case ShippingStatus.cancelled:
        return 0;
    }
  }
}

/// Order item model
class OrderItemModel {
  final String id;
  final OrderSellerModel seller;
  final String productTitle;
  final String? variationTitle;
  final String? variationImage;
  final String? skuTitle;
  final String? sellerName;
  final String? sellerImage;
  final OrderVariationModel? variation;
  final String? variationId;
  final int quantity;
  final double price;
  final double shippingFee;
  final double buyerProtectionFee;
  final ShippingStatus shippingStatus;
  final List<StatusLog> statusLogs;

  OrderItemModel({
    required this.id,
    required this.seller,
    required this.productTitle,
    this.variationTitle,
    this.variationImage,
    this.skuTitle,
    this.sellerName,
    this.sellerImage,
    this.variation,
    this.variationId,
    required this.quantity,
    required this.price,
    required this.shippingFee,
    required this.buyerProtectionFee,
    required this.shippingStatus,
    this.statusLogs = const [],
  });

  factory OrderItemModel.fromJson(Map<String, dynamic> json) {
    return OrderItemModel(
      id: json['id'] ?? '',
      seller: OrderSellerModel.fromJson(json['seller'] ?? {}),
      productTitle: json['productTitle'] ?? '',
      variationTitle: json['variationTitle'],
      variationImage: json['variationImage'],
      skuTitle: json['skuTitle'],
      sellerName: json['sellerName'],
      sellerImage: json['sellerImage'],
      variation: json['variation'] != null
          ? OrderVariationModel.fromJson(json['variation'])
          : null,
      variationId: json['variationId'],
      quantity: json['quantity'] ?? 1,
      price: (json['price'] ?? 0).toDouble(),
      shippingFee: (json['shippingFee'] ?? 0).toDouble(),
      buyerProtectionFee: (json['buyerProtectionFee'] ?? 0).toDouble(),
      shippingStatus: ShippingStatus.fromString(json['shippingStatus']),
      statusLogs: (json['statusLogs'] as List<dynamic>?)
              ?.map((e) => StatusLog.fromJson(e))
              .toList() ??
          [],
    );
  }

  /// Get display seller name (prefer stored sellerName, fallback to seller relation)
  String get displaySellerName {
    if (sellerName != null && sellerName!.isNotEmpty) {
      return sellerName!;
    }
    return seller.displayName;
  }

  /// Get display seller image (prefer stored sellerImage, fallback to seller relation)
  String? get displaySellerImage {
    if (sellerImage != null && sellerImage!.isNotEmpty) {
      return MediaUtils.resolveUrl(sellerImage);
    }
    return seller.resolvedProfilePhoto;
  }

  /// Get the display image URL for this item (prefer variationImage, fallback to variation.images)
  String? get imageUrl {
    // First try variationImage (stored at time of purchase)
    if (variationImage != null && variationImage!.isNotEmpty) {
      return MediaUtils.resolveUrl(variationImage);
    }
    // Fallback to variation.images
    final images = variation?.images;
    if (images != null && images.isNotEmpty) {
      return MediaUtils.resolveUrl(images.first.imageUrl);
    }
    return null;
  }

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
        // Multiple option values, join all except first and last
        return parts.sublist(1, parts.length - 1).join(' / ');
      }
    }
    return null;
  }

  /// Get the timestamp when item was delivered (if delivered)
  DateTime? get deliveredAt {
    if (shippingStatus != ShippingStatus.delivered) return null;
    
    // Find the delivered status log
    final deliveredLog = statusLogs.cast<StatusLog?>().firstWhere(
      (log) => log?.status == 'delivered',
      orElse: () => null,
    );
    return deliveredLog?.timestamp;
  }

  /// Check if return window is still open (within 6 hours of delivery)
  bool get isWithinReturnWindow {
    final delivered = deliveredAt;
    if (delivered == null) return false;
    
    final now = DateTime.now();
    final hoursSinceDelivery = now.difference(delivered).inHours;
    return hoursSinceDelivery < 6;
  }

  /// Can request return (only delivered items within 6 hour window)
  bool get canReturn => shippingStatus == ShippingStatus.delivered && isWithinReturnWindow;

  /// Can resell (only delivered items)
  bool get canResell => shippingStatus == ShippingStatus.delivered;
}

/// Seller model for order
class OrderSellerModel {
  final String id;
  final String? firstName;
  final String? lastName;
  final String? username;
  final String? shopName;
  final String? profilePhoto;
  final bool isTrustedSeller;

  OrderSellerModel({
    required this.id,
    this.firstName,
    this.lastName,
    this.username,
    this.shopName,
    this.profilePhoto,
    this.isTrustedSeller = false,
  });

  factory OrderSellerModel.fromJson(dynamic json) {
    // Handle string ID (non-populated)
    if (json is String) {
      return OrderSellerModel(id: json);
    }
    
    // Handle null or invalid
    if (json == null || json is! Map<String, dynamic>) {
      return OrderSellerModel(id: '');
    }
    
    if (json.isEmpty) {
      return OrderSellerModel(id: '');
    }

    String? profilePhotoUrl;
    // The field is named 'photo' in the Users collection, not 'profilePhoto'
    final photo = json['photo'];
    if (photo != null) {
      if (photo is Map) {
        // Could be {url: '...'} or nested structure
        profilePhotoUrl = photo['url'] ?? photo['image']?['url'];
      } else if (photo is String) {
        // If it's a string that looks like a URL path, use it
        if (photo.startsWith('/') || photo.startsWith('http')) {
          profilePhotoUrl = photo;
        }
      }
    }

    return OrderSellerModel(
      id: json['id'] ?? '',
      firstName: json['firstName'],
      lastName: json['lastName'],
      username: json['username'],
      shopName: json['shopName'],
      profilePhoto: profilePhotoUrl,
      isTrustedSeller: json['isTrustedSeller'] ?? false,
    );
  }

  /// Display name (prefer shopName, then full name, then username)
  String get displayName {
    if (shopName != null && shopName!.isNotEmpty) {
      return shopName!;
    }
    if (firstName != null && firstName!.isNotEmpty) {
      final name = lastName != null && lastName!.isNotEmpty
          ? '$firstName $lastName'
          : firstName!;
      return name;
    }
    if (username != null && username!.isNotEmpty) {
      return username!;
    }
    return 'Seller';
  }

  /// Resolved profile photo URL
  String? get resolvedProfilePhoto => MediaUtils.resolveUrl(profilePhoto);
}

/// Variation model for order item
class OrderVariationModel {
  final String id;
  final String? title;
  final List<VariationImage> images;
  final OrderStyleModel? style;

  OrderVariationModel({
    required this.id,
    this.title,
    this.images = const [],
    this.style,
  });

  factory OrderVariationModel.fromJson(dynamic json) {
    // Handle String type (non-populated reference)
    if (json is String) {
      return OrderVariationModel(id: json);
    }
    
    if (json == null || json is! Map<String, dynamic>) {
      return OrderVariationModel(id: '');
    }
    
    return OrderVariationModel(
      id: json['id'] ?? '',
      title: json['title'],
      images: (json['images'] as List<dynamic>?)
              ?.map((e) => VariationImage.fromJson(e))
              .toList() ??
          [],
      style: json['style'] != null
          ? OrderStyleModel.fromJson(json['style'])
          : null,
    );
  }
}

/// Style model for variation
class OrderStyleModel {
  final String id;
  final String? name;
  final OrderBrandModel? brand;

  OrderStyleModel({
    required this.id,
    this.name,
    this.brand,
  });

  factory OrderStyleModel.fromJson(dynamic json) {
    // Handle String type (non-populated reference)
    if (json is String) {
      return OrderStyleModel(id: json);
    }
    
    if (json == null || json is! Map<String, dynamic>) {
      return OrderStyleModel(id: '');
    }
    
    return OrderStyleModel(
      id: json['id'] ?? '',
      name: json['name'],
      brand: json['brand'] != null
          ? OrderBrandModel.fromJson(json['brand'])
          : null,
    );
  }
}

/// Brand model for style
class OrderBrandModel {
  final String id;
  final String? name;

  OrderBrandModel({
    required this.id,
    this.name,
  });

  factory OrderBrandModel.fromJson(dynamic json) {
    // Handle String type (non-populated reference)
    if (json is String) {
      return OrderBrandModel(id: json);
    }
    
    if (json == null || json is! Map<String, dynamic>) {
      return OrderBrandModel(id: '');
    }
    
    return OrderBrandModel(
      id: json['id'] ?? '',
      name: json['name'],
    );
  }
}

/// Variation image model
class VariationImage {
  final String? imageUrl;

  VariationImage({this.imageUrl});

  factory VariationImage.fromJson(dynamic json) {
    String? url;
    
    // Handle direct media object (hasMany upload relationship)
    if (json is Map<String, dynamic>) {
      // Direct media object with url field
      if (json['url'] != null) {
        url = json['url'];
      }
      // Or nested {image: {url: ...}} structure
      else if (json['image'] != null) {
        if (json['image'] is Map) {
          url = json['image']['url'];
        } else if (json['image'] is String) {
          // Could be a path or ID
          final imageStr = json['image'] as String;
          if (imageStr.startsWith('/') || imageStr.startsWith('http')) {
            url = imageStr;
          }
        }
      }
    }
    // Handle string (could be URL or media ID)
    else if (json is String) {
      if (json.startsWith('/') || json.startsWith('http')) {
        url = json;
      }
    }
    
    return VariationImage(imageUrl: url);
  }
}

/// Status log entry
class StatusLog {
  final String status;
  final DateTime timestamp;
  final String? note;

  StatusLog({
    required this.status,
    required this.timestamp,
    this.note,
  });

  factory StatusLog.fromJson(Map<String, dynamic> json) {
    return StatusLog(
      status: json['status'] ?? '',
      timestamp: DateTime.tryParse(json['timestamp'] ?? '') ?? DateTime.now(),
      note: json['note'],
    );
  }
}

/// Shipping address model for order
class OrderShippingAddress {
  final String id;
  final String fullName;
  final String phone;
  final String? city;
  final String? region;
  final String? address;

  OrderShippingAddress({
    required this.id,
    required this.fullName,
    required this.phone,
    this.city,
    this.region,
    this.address,
  });

  factory OrderShippingAddress.fromJson(Map<String, dynamic> json) {
    String? cityName;
    String? regionName;
    
    if (json['city'] != null) {
      if (json['city'] is Map) {
        cityName = json['city']['name'];
        // Get region from city object
        final region = json['city']['region'];
        if (region is Map) {
          regionName = region['name'];
        } else if (region is String) {
          regionName = region;
        }
      } else if (json['city'] is String) {
        cityName = json['city'];
      }
    }

    return OrderShippingAddress(
      id: json['id'] ?? '',
      fullName: json['fullName'] ?? '',
      phone: json['phone'] ?? '',
      city: cityName,
      region: regionName,
      address: json['address'],
    );
  }

  /// Get city and region formatted as "City - Region"
  String get cityRegion {
    if (city != null && region != null) {
      return '$city - $region';
    }
    return city ?? region ?? '';
  }

  /// Format address for display
  String get displayAddress {
    final parts = <String>[];
    parts.add(fullName);
    parts.add(phone);
    if (city != null) parts.add(city!);
    if (address != null) parts.add(address!);
    return parts.join('\n');
  }
}

/// Main order model
class OrderModel {
  final String id;
  final String orderId;
  final OrderStatus status;
  final String? customerId;
  final OrderShippingAddress? shippingAddress;
  final List<OrderItemModel> items;
  final int totalItems;
  final double subtotal;
  final double grandTotal;
  final double? discountAmount;
  final double? pointsDiscount;
  final String? promoCode;
  final DateTime createdAt;
  final DateTime updatedAt;

  OrderModel({
    required this.id,
    required this.orderId,
    required this.status,
    this.customerId,
    this.shippingAddress,
    required this.items,
    required this.totalItems,
    required this.subtotal,
    required this.grandTotal,
    this.discountAmount,
    this.pointsDiscount,
    this.promoCode,
    required this.createdAt,
    required this.updatedAt,
  });

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    return OrderModel(
      id: json['id'] ?? '',
      orderId: json['orderId'] ?? '',
      status: OrderStatus.fromString(json['status']),
      customerId: json['customer'] is Map
          ? json['customer']['id']
          : json['customer'],
      shippingAddress: json['shippingAddress'] != null
          ? OrderShippingAddress.fromJson(json['shippingAddress'])
          : null,
      items: (json['items'] as List<dynamic>?)
              ?.map((e) => OrderItemModel.fromJson(e))
              .toList() ??
          [],
      totalItems: json['totalItems'] ?? 0,
      subtotal: (json['subtotal'] ?? 0).toDouble(),
      grandTotal: (json['grandTotal'] ?? 0).toDouble(),
      discountAmount: json['discountAmount']?.toDouble(),
      pointsDiscount: json['pointsDiscount']?.toDouble(),
      promoCode: json['promoCode'],
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
      updatedAt: DateTime.tryParse(json['updatedAt'] ?? '') ?? DateTime.now(),
    );
  }

  /// Group items by seller
  Map<String, List<OrderItemModel>> get itemsBySeller {
    final grouped = <String, List<OrderItemModel>>{};
    for (final item in items) {
      final sellerId = item.seller.id;
      if (!grouped.containsKey(sellerId)) {
        grouped[sellerId] = [];
      }
      grouped[sellerId]!.add(item);
    }
    return grouped;
  }

  /// Get unique sellers from items
  List<OrderSellerModel> get sellers {
    final seen = <String>{};
    final result = <OrderSellerModel>[];
    for (final item in items) {
      if (!seen.contains(item.seller.id)) {
        seen.add(item.seller.id);
        result.add(item.seller);
      }
    }
    return result;
  }

  /// Calculate total shipping (one per seller)
  double get totalShipping {
    final sellerShipping = <String, double>{};
    for (final item in items) {
      if (item.shippingStatus != ShippingStatus.returned &&
          item.shippingStatus != ShippingStatus.notAvailable &&
          item.shippingStatus != ShippingStatus.cancelled) {
        final sellerId = item.seller.id;
        if (!sellerShipping.containsKey(sellerId)) {
          sellerShipping[sellerId] = item.shippingFee;
        }
      }
    }
    return sellerShipping.values.fold(0.0, (sum, fee) => sum + fee);
  }

  /// Calculate total buyer protection fee
  double get totalBuyerProtection {
    return items
        .where((item) =>
            item.shippingStatus != ShippingStatus.returned &&
            item.shippingStatus != ShippingStatus.notAvailable &&
            item.shippingStatus != ShippingStatus.cancelled)
        .fold(0.0, (sum, item) => sum + item.buyerProtectionFee);
  }

  /// Calculate total discount
  double get totalDiscount => (discountAmount ?? 0) + (pointsDiscount ?? 0);

  /// Overall progress value (0-4) based on item statuses
  int get overallProgress {
    if (status == OrderStatus.cancelled) return 0;
    if (status == OrderStatus.completed) return 4;
    
    // Check item statuses
    final activeItems = items.where((item) =>
        item.shippingStatus != ShippingStatus.cancelled &&
        item.shippingStatus != ShippingStatus.notAvailable);
    
    if (activeItems.isEmpty) return 0;
    
    final allDelivered = activeItems.every(
        (item) => item.shippingStatus == ShippingStatus.delivered);
    if (allDelivered) return 4;
    
    final hasOutForDelivery = activeItems.any(
        (item) => item.shippingStatus == ShippingStatus.outForDelivery);
    if (hasOutForDelivery) return 3;
    
    final allPlaced = activeItems.every(
        (item) => item.shippingStatus == ShippingStatus.placed);
    if (allPlaced) return 1;
    
    // Mixed status = in progress
    return 2;
  }
}
