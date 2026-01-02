import 'package:dres/core/utilities/media_utils.dart';
import 'package:dres/features/orders/data/models/order_model.dart';

/// Purchase details response from API
class PurchaseDetailsModel {
  final PurchaseOrderInfo order;
  final OrderShippingAddress? shippingAddress;
  final List<SellerGroupModel> sellerGroups;
  final PurchaseSummary summary;

  PurchaseDetailsModel({
    required this.order,
    this.shippingAddress,
    required this.sellerGroups,
    required this.summary,
  });

  factory PurchaseDetailsModel.fromJson(Map<String, dynamic> json) {
    return PurchaseDetailsModel(
      order: PurchaseOrderInfo.fromJson(json['order'] ?? {}),
      shippingAddress: json['shippingAddress'] != null
          ? OrderShippingAddress.fromJson(json['shippingAddress'])
          : null,
      sellerGroups: (json['sellerGroups'] as List<dynamic>?)
              ?.map((e) => SellerGroupModel.fromJson(e))
              .toList() ??
          [],
      summary: PurchaseSummary.fromJson(json['summary'] ?? {}),
    );
  }
}

/// Basic order info
class PurchaseOrderInfo {
  final String id;
  final String orderId;
  final OrderStatus status;
  final DateTime createdAt;
  final DateTime updatedAt;

  PurchaseOrderInfo({
    required this.id,
    required this.orderId,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
  });

  factory PurchaseOrderInfo.fromJson(Map<String, dynamic> json) {
    return PurchaseOrderInfo(
      id: json['id'] ?? '',
      orderId: json['orderId'] ?? '',
      status: OrderStatus.fromString(json['status']),
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
      updatedAt: DateTime.tryParse(json['updatedAt'] ?? '') ?? DateTime.now(),
    );
  }
}

/// Seller group with items and delivery code
class SellerGroupModel {
  final String sellerId;
  final String sellerName;
  final String? sellerImage;
  final bool isTrustedSeller;
  final List<PurchaseItemModel> items;
  final double shippingFee;
  final double buyerProtectionFee;
  final double itemsTotal;
  final double total;
  final String? deliveryCode;

  SellerGroupModel({
    required this.sellerId,
    required this.sellerName,
    this.sellerImage,
    required this.isTrustedSeller,
    required this.items,
    required this.shippingFee,
    required this.buyerProtectionFee,
    required this.itemsTotal,
    required this.total,
    this.deliveryCode,
  });

  factory SellerGroupModel.fromJson(Map<String, dynamic> json) {
    return SellerGroupModel(
      sellerId: json['sellerId'] ?? '',
      sellerName: json['sellerName'] ?? 'Unknown Seller',
      sellerImage: json['sellerImage'] != null
          ? MediaUtils.resolveUrl(json['sellerImage'])
          : null,
      isTrustedSeller: json['isTrustedSeller'] ?? false,
      items: (json['items'] as List<dynamic>?)
              ?.map((e) => PurchaseItemModel.fromJson(e))
              .toList() ??
          [],
      shippingFee: (json['shippingFee'] ?? 0).toDouble(),
      buyerProtectionFee: (json['buyerProtectionFee'] ?? 0).toDouble(),
      itemsTotal: (json['itemsTotal'] ?? 0).toDouble(),
      total: (json['total'] ?? 0).toDouble(),
      deliveryCode: json['deliveryCode'],
    );
  }

  /// Check if any item is out for delivery (show delivery code)
  bool get hasItemsOutForDelivery {
    return items.any((item) => item.shippingStatus == ShippingStatus.outForDelivery);
  }
}

/// Purchase item model
class PurchaseItemModel {
  final String id;
  final String productTitle;
  final String? variationTitle;
  final String? variationImage;
  final String? skuTitle;
  final int quantity;
  final double price;
  final double buyerProtectionFee;
  final ShippingStatus shippingStatus;
  final List<StatusLog> statusLogs;

  PurchaseItemModel({
    required this.id,
    required this.productTitle,
    this.variationTitle,
    this.variationImage,
    this.skuTitle,
    required this.quantity,
    required this.price,
    required this.buyerProtectionFee,
    required this.shippingStatus,
    this.statusLogs = const [],
  });

  factory PurchaseItemModel.fromJson(Map<String, dynamic> json) {
    return PurchaseItemModel(
      id: json['id'] ?? '',
      productTitle: json['productTitle'] ?? '',
      variationTitle: json['variationTitle'],
      variationImage: json['variationImage'] != null
          ? MediaUtils.resolveUrl(json['variationImage'])
          : null,
      skuTitle: json['skuTitle'],
      quantity: json['quantity'] ?? 1,
      price: (json['price'] ?? 0).toDouble(),
      buyerProtectionFee: (json['buyerProtectionFee'] ?? 0).toDouble(),
      shippingStatus: ShippingStatus.fromString(json['shippingStatus']),
      statusLogs: (json['statusLogs'] as List<dynamic>?)
              ?.map((e) => StatusLog.fromJson(e))
              .toList() ??
          [],
    );
  }

  /// Total for this item (price * quantity)
  double get itemTotal => price * quantity;

  /// Get display image URL
  String? get imageUrl => variationImage;

  /// Get the SKU option value
  String? get skuOptionValue {
    if (skuTitle == null || skuTitle!.isEmpty) return null;
    final parts = skuTitle!.split(' / ');
    if (parts.length >= 2) {
      if (parts.length == 3) {
        return parts[1];
      } else if (parts.length > 3) {
        return parts.sublist(1, parts.length - 1).join(' / ');
      }
    }
    return null;
  }
}

/// Purchase summary
class PurchaseSummary {
  final int totalItems;
  final double subtotal;
  final double totalShipping;
  final double totalBuyerProtection;
  final double totalDiscount;
  final double grandTotal;

  PurchaseSummary({
    required this.totalItems,
    required this.subtotal,
    required this.totalShipping,
    required this.totalBuyerProtection,
    required this.totalDiscount,
    required this.grandTotal,
  });

  factory PurchaseSummary.fromJson(Map<String, dynamic> json) {
    return PurchaseSummary(
      totalItems: json['totalItems'] ?? 0,
      subtotal: (json['subtotal'] ?? 0).toDouble(),
      totalShipping: (json['totalShipping'] ?? 0).toDouble(),
      totalBuyerProtection: (json['totalBuyerProtection'] ?? 0).toDouble(),
      totalDiscount: (json['totalDiscount'] ?? 0).toDouble(),
      grandTotal: (json['grandTotal'] ?? 0).toDouble(),
    );
  }
}
