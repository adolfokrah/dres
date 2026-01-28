/// Cart data models

class AddToCartResponse {
  final String message;
  final String cartId;
  final String action; // 'created', 'added', 'updated'
  final bool success;

  AddToCartResponse({
    required this.message,
    required this.cartId,
    required this.action,
    required this.success,
  });

  factory AddToCartResponse.fromJson(Map<String, dynamic> json) {
    return AddToCartResponse(
      message: json['message'] ?? '',
      cartId: json['cartId'] ?? '',
      action: json['action'] ?? '',
      success: json['success'] ?? false,
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
  final DiscountCodeInfo? discountCode;

  CartModel({
    required this.id,
    required this.status,
    required this.items,
    required this.itemCount,
    required this.subtotal,
    required this.grandTotal,
    required this.discountAmount,
    required this.pointsDiscount,
    this.discountCode,
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
      discountCode: json['discountCode'] != null && json['discountCode'] is Map
          ? DiscountCodeInfo.fromJson(json['discountCode'])
          : null,
    );
  }
}

/// Discount code info from cart
class DiscountCodeInfo {
  final String id;
  final String code;
  final String type;
  final double value;

  DiscountCodeInfo({
    required this.id,
    required this.code,
    required this.type,
    required this.value,
  });

  factory DiscountCodeInfo.fromJson(Map<String, dynamic> json) {
    return DiscountCodeInfo(
      id: json['id']?.toString() ?? '',
      code: json['code'] ?? '',
      type: json['type'] ?? 'fixed',
      value: (json['value'] ?? 0).toDouble(),
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
  final bool isNotInYourCountry;
  final bool isShippingUnavailable;
  final int? stockQuantity;
  final int? availableStock;
  // Per-item validation from backend
  final bool valid;
  final String? reason;

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
    this.isNotInYourCountry = false,
    this.isShippingUnavailable = false,
    this.stockQuantity,
    this.availableStock,
    this.valid = true,
    this.reason,
  });

  /// Check if item is unavailable (seller on vacation, out of stock, or not in your country)
  bool get isUnavailable => isSellerOnVacation || isOutOfStock || isNotInYourCountry;

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
      isNotInYourCountry: json['isNotInYourCountry'] ?? false,
      isShippingUnavailable: json['isShippingUnavailable'] ?? false,
      stockQuantity: json['stockQuantity'],
      availableStock: json['availableStock'],
      // Per-item validation
      valid: json['valid'] ?? true,
      reason: json['reason'],
    );
  }
}

class CartVariationInfo {
  final String id;
  final String? title;
  final String? brand;
  final String? image;
  final CartSellerInfo? seller;

  CartVariationInfo({
    required this.id,
    this.title,
    this.brand,
    this.image,
    this.seller,
  });

  factory CartVariationInfo.fromJson(Map<String, dynamic> json) {
    // Get image - prefer thumbnail, fallback to images array
    String? image = json['thumbnail'] as String?;
    
    // Fallback to images array if thumbnail not present
    if (image == null) {
      final images = json['images'] as List?;
      if (images != null && images.isNotEmpty) {
        final firstImage = images.first;
        if (firstImage is Map) {
          image = firstImage['image']?['url'] ?? firstImage['url'];
        }
      }
    }

    // Get seller and brand from style
    CartSellerInfo? seller;
    String? brand;
    final style = json['style'];
    if (style is Map) {
      final sellerData = style['seller'];
      if (sellerData is Map) {
        seller = CartSellerInfo.fromJson(Map<String, dynamic>.from(sellerData));
      }
      // Get brand from style
      final brandData = style['brand'];
      if (brandData is Map) {
        brand = brandData['name'];
      } else if (brandData is String) {
        brand = brandData;
      }
    }
    
    // Fallback to brand from variation if not in style
    if (brand == null) {
      final variationBrand = json['brand'];
      if (variationBrand is Map) {
        brand = variationBrand['name'];
      } else if (variationBrand is String) {
        brand = variationBrand;
      }
    }

    return CartVariationInfo(
      id: json['id']?.toString() ?? '',
      title: json['title'],
      brand: brand,
      image: image,
      seller: seller,
    );
  }
}

class CartSellerInfo {
  final String id;
  final String? displayName;
  final String? photoUrl;
  final bool isTrusted;
  final bool isOnVacation;

  CartSellerInfo({
    required this.id,
    this.displayName,
    this.photoUrl,
    this.isTrusted = false,
    this.isOnVacation = false,
  });

  factory CartSellerInfo.fromJson(Map<String, dynamic> json) {
    // Get photo URL - handle both string and object
    String? photoUrl;
    final photo = json['photo'];
    if (photo is String) {
      photoUrl = photo;
    } else if (photo is Map) {
      photoUrl = photo['url'];
    }

    // Get display name - try multiple fields
    String? displayName = json['displayName'] ?? 
        json['shopName'] ?? 
        json['name'];
    
    // If still null, try to build from firstName/lastName
    if (displayName == null || displayName.isEmpty) {
      final firstName = json['firstName'] ?? '';
      final lastName = json['lastName'] ?? '';
      final fullName = '$firstName $lastName'.trim();
      if (fullName.isNotEmpty) {
        displayName = fullName;
      }
    }

    return CartSellerInfo(
      id: json['id']?.toString() ?? '',
      displayName: displayName,
      photoUrl: photoUrl,
      isTrusted: json['isTrusted'] ?? false,
      isOnVacation: json['vacationMode'] ?? false,
    );
  }
}

class CartSkuInfo {
  final String id;
  final String? title;
  final double? price;
  final double? sellingPrice;
  final double? compareAtPrice;
  final List<SkuOptionInfo> options;

  CartSkuInfo({
    required this.id,
    this.title,
    this.price,
    this.sellingPrice,
    this.compareAtPrice,
    required this.options,
  });

  /// Get the first option value (e.g., "Size M" -> "M")
  String? get optionValue {
    if (options.isEmpty) return null;
    return options.first.value;
  }
  
  /// Get all option values combined (e.g., "S" or "W40 L31")
  String? get optionValuesDisplay {
    if (options.isEmpty) return null;
    return options.map((o) => o.value).join(' ');
  }
  
  /// The actual price to display (selling price if available, else price)
  double get displayPrice => sellingPrice ?? price ?? 0;
  
  /// Whether there's a discount (compareAtPrice > displayPrice)
  bool get hasDiscount => 
      compareAtPrice != null && compareAtPrice! > displayPrice;

  factory CartSkuInfo.fromJson(Map<String, dynamic> json) {
    // Parse options - can be 'options' or 'skuOptions'
    List<SkuOptionInfo> options = [];
    final optionsData = json['options'] ?? json['skuOptions'];
    if (optionsData is List) {
      options = optionsData
          .map((opt) => SkuOptionInfo.fromJson(opt is Map ? Map<String, dynamic>.from(opt) : {}))
          .toList();
    }
    
    return CartSkuInfo(
      id: json['id']?.toString() ?? '',
      title: json['title'],
      price: json['price'] != null ? (json['price'] as num).toDouble() : null,
      sellingPrice: json['sellingPrice'] != null
          ? (json['sellingPrice'] as num).toDouble()
          : null,
      compareAtPrice: json['compareAtPrice'] != null
          ? (json['compareAtPrice'] as num).toDouble()
          : null,
      options: options,
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
    // Option can be a string ID or populated object
    String optionName = '';
    final optionData = json['option'];
    if (optionData is Map) {
      optionName = optionData['name'] ?? optionData['label'] ?? '';
    } else if (optionData is String) {
      optionName = optionData;
    }
    
    // Value can be a string ID or populated object (attributeOption)
    String valueStr = '';
    final valueData = json['value'];
    if (valueData is Map) {
      valueStr = valueData['value'] ?? valueData['name'] ?? valueData['label'] ?? '';
    } else if (valueData is String) {
      valueStr = valueData;
    }
    
    return SkuOptionInfo(
      option: optionName,
      value: valueStr,
    );
  }
}
