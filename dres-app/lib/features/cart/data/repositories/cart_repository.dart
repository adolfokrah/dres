import 'package:dres/core/services/api_service.dart';

class CartRepository {
  final ApiService _apiService;

  CartRepository({required ApiService apiService}) : _apiService = apiService;

  /// Add item to cart
  /// Creates a new cart if user doesn't have one, or adds to existing cart
  Future<AddToCartResponse> addToCart({
    required String variationId,
    required String skuId,
    int quantity = 1,
    bool buyerProtection = false,
  }) async {
    final response = await _apiService.post(
      '/carts/add-item',
      data: {
        'variationId': variationId,
        'skuId': skuId,
        'quantity': quantity,
        'buyerProtection': buyerProtection,
      },
    );

    return AddToCartResponse.fromJson(response.data);
  }

  /// Update cart item quantity
  Future<void> updateCartItemQuantity({
    required String variationId,
    required String skuId,
    required int quantity,
  }) async {
    await _apiService.patch(
      '/carts/update-item',
      data: {
        'variationId': variationId,
        'skuId': skuId,
        'quantity': quantity,
      },
    );
  }

  /// Remove item from cart
  Future<void> removeCartItem({
    required String variationId,
    required String skuId,
  }) async {
    await _apiService.delete(
      '/carts/remove-item',
      data: {
        'variationId': variationId,
        'skuId': skuId,
      },
    );
  }

  /// Get user's active cart using the dedicated endpoint
  Future<CartModel?> getMyCart() async {
    try {
      final response = await _apiService.get('/carts/my-cart');
      
      if (response.data['cart'] != null) {
        return CartModel.fromJson(response.data['cart']);
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  /// Get user's active cart (legacy method using query params)
  Future<CartModel?> getActiveCart() async {
    try {
      final response = await _apiService.get(
        '/carts',
        queryParameters: {
          'where[status][equals]': 'active',
          'limit': 1,
          'depth': 2,
        },
      );

      final docs = response.data['docs'] as List?;
      if (docs != null && docs.isNotEmpty) {
        return CartModel.fromJson(docs.first);
      }
      return null;
    } catch (_) {
      return null;
    }
  }
}

class AddToCartResponse {
  final String message;
  final CartModel cart;
  final String action; // 'created', 'added', 'updated'

  AddToCartResponse({
    required this.message,
    required this.cart,
    required this.action,
  });

  factory AddToCartResponse.fromJson(Map<String, dynamic> json) {
    return AddToCartResponse(
      message: json['message'] ?? '',
      cart: CartModel.fromJson(json['cart'] ?? {}),
      action: json['action'] ?? '',
    );
  }
}

class CartModel {
  final String id;
  final String status;
  final List<CartItemModel> items;
  final int itemCount;
  final double subtotal;
  final double grandTotal;
  final double discountAmount;
  final double pointsDiscount;

  CartModel({
    required this.id,
    required this.status,
    required this.items,
    required this.itemCount,
    required this.subtotal,
    required this.grandTotal,
    required this.discountAmount,
    required this.pointsDiscount,
  });

  factory CartModel.fromJson(Map<String, dynamic> json) {
    return CartModel(
      id: json['id']?.toString() ?? '',
      status: json['status'] ?? 'active',
      items: (json['items'] as List?)
              ?.map((item) => CartItemModel.fromJson(item))
              .toList() ??
          [],
      itemCount: json['itemCount'] ?? 0,
      subtotal: (json['subtotal'] ?? 0).toDouble(),
      grandTotal: (json['grandTotal'] ?? 0).toDouble(),
      discountAmount: (json['discountAmount'] ?? 0).toDouble(),
      pointsDiscount: (json['pointsDiscount'] ?? 0).toDouble(),
    );
  }
}

class CartItemModel {
  final String? variationId;
  final String? skuId;
  final int quantity;
  final double? price;
  final bool buyerProtection;
  final double buyerProtectionFee;
  final double shippingFee;
  final String? addedAt;
  // Populated fields
  final CartVariationInfo? variation;
  final CartSkuInfo? sku;
  // Availability flags
  final bool isSellerOnVacation;
  final bool isOutOfStock;
  final int? stockQuantity;
  final int? availableStock;

  CartItemModel({
    this.variationId,
    this.skuId,
    required this.quantity,
    this.price,
    required this.buyerProtection,
    required this.buyerProtectionFee,
    required this.shippingFee,
    this.addedAt,
    this.variation,
    this.sku,
    this.isSellerOnVacation = false,
    this.isOutOfStock = false,
    this.stockQuantity,
    this.availableStock,
  });

  /// Check if item is unavailable (seller on vacation or out of stock)
  bool get isUnavailable => isSellerOnVacation || isOutOfStock;

  /// Check if quantity exceeds available stock
  bool get exceedsAvailableStock => 
      availableStock != null && quantity > availableStock!;

  factory CartItemModel.fromJson(Map<String, dynamic> json) {
    // Handle variation - can be string ID or populated object
    String? variationId;
    CartVariationInfo? variation;
    if (json['variation'] is String) {
      variationId = json['variation'];
    } else if (json['variation'] is Map) {
      variationId = json['variation']['id'];
      variation = CartVariationInfo.fromJson(json['variation']);
    }

    // Handle sku - can be string ID or populated object
    String? skuId;
    CartSkuInfo? sku;
    if (json['sku'] is String) {
      skuId = json['sku'];
    } else if (json['sku'] is Map) {
      skuId = json['sku']['id'];
      sku = CartSkuInfo.fromJson(json['sku']);
    }

    return CartItemModel(
      variationId: variationId,
      skuId: skuId,
      quantity: json['quantity'] ?? 1,
      price: (json['price'] ?? 0).toDouble(),
      buyerProtection: json['buyerProtection'] ?? false,
      buyerProtectionFee: (json['buyerProtectionFee'] ?? 0).toDouble(),
      shippingFee: (json['shippingFee'] ?? 0).toDouble(),
      addedAt: json['addedAt'],
      variation: variation,
      sku: sku,
      // Availability flags
      isSellerOnVacation: json['isSellerOnVacation'] ?? false,
      isOutOfStock: json['isOutOfStock'] ?? false,
      stockQuantity: json['stockQuantity'],
      availableStock: json['availableStock'],
    );
  }
}

class CartVariationInfo {
  final String id;
  final String? title;
  final String? brand;
  final String? image;

  CartVariationInfo({
    required this.id,
    this.title,
    this.brand,
    this.image,
  });

  factory CartVariationInfo.fromJson(Map<String, dynamic> json) {
    // Get first image if available
    String? image;
    final images = json['images'] as List?;
    if (images != null && images.isNotEmpty) {
      final firstImage = images.first;
      if (firstImage is Map) {
        image = firstImage['image']?['url'] ?? firstImage['url'];
      }
    }

    return CartVariationInfo(
      id: json['id']?.toString() ?? '',
      title: json['title'],
      brand: json['brand'] is Map ? json['brand']['name'] : json['brand'],
      image: image,
    );
  }
}

class CartSkuInfo {
  final String id;
  final String? title;
  final double? price;
  final List<SkuOptionInfo> options;

  CartSkuInfo({
    required this.id,
    this.title,
    this.price,
    required this.options,
  });

  factory CartSkuInfo.fromJson(Map<String, dynamic> json) {
    return CartSkuInfo(
      id: json['id']?.toString() ?? '',
      title: json['title'],
      price: (json['price'] ?? 0).toDouble(),
      options: (json['options'] as List?)
              ?.map((opt) => SkuOptionInfo.fromJson(opt))
              .toList() ??
          [],
    );
  }
}

class SkuOptionInfo {
  final String option;
  final String value;

  SkuOptionInfo({
    required this.option,
    required this.value,
  });

  factory SkuOptionInfo.fromJson(Map<String, dynamic> json) {
    return SkuOptionInfo(
      option: json['option'] ?? '',
      value: json['value'] ?? '',
    );
  }
}
