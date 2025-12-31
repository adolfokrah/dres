import 'package:equatable/equatable.dart';
import 'package:dres/features/cart/data/repositories/cart_repository.dart';

enum CartStatus { initial, loading, loaded, error }

enum PlaceOrderStatus { initial, loading, success, error }

enum PromoStatus { initial, loading, success, error }

/// Validation result from backend
class CartValidation extends Equatable {
  final bool valid;
  final List<String> reasons;

  const CartValidation({
    this.valid = true,
    this.reasons = const [],
  });

  factory CartValidation.fromJson(Map<String, dynamic>? json) {
    if (json == null) {
      return const CartValidation();
    }
    return CartValidation(
      valid: json['valid'] ?? true,
      reasons: (json['reasons'] as List?)?.map((e) => e.toString()).toList() ?? [],
    );
  }

  /// Get first reason or null
  String? get firstReason => reasons.isNotEmpty ? reasons.first : null;

  @override
  List<Object?> get props => [valid, reasons];
}

class CartState extends Equatable {
  final CartStatus status;
  final CartModel? cart;
  final String? errorMessage;
  final CartValidation validation;
  final PromoStatus promoStatus; // Separate status for promo operations
  final String? promoMessage; // Success message when promo is applied
  final String? promoError; // Error message when promo fails
  final String? _manualPromoCode; // Promo code set manually (from apply response)
  
  // Place order state
  final PlaceOrderStatus placeOrderStatus;
  final PlaceOrderResponse? placeOrderResponse;
  final String? placeOrderError;

  const CartState({
    this.status = CartStatus.initial,
    this.cart,
    this.errorMessage,
    this.validation = const CartValidation(),
    this.promoStatus = PromoStatus.initial,
    this.promoMessage,
    this.promoError,
    String? appliedPromoCode,
    this.placeOrderStatus = PlaceOrderStatus.initial,
    this.placeOrderResponse,
    this.placeOrderError,
  }) : _manualPromoCode = appliedPromoCode;

  /// Get total item count in cart
  int get itemCount => cart?.itemCount ?? 0;

  /// Get cart items
  List<CartItemModel> get items => cart?.items ?? [];

  /// Check if cart has items
  bool get hasItems => itemCount > 0;

  /// Check if cart is valid for checkout (from backend)
  bool get isValid => validation.valid;

  /// Get validation reason (first one)
  String? get validationReason => validation.firstReason;

  /// Check if cart has unavailable items (legacy - kept for backward compat)
  bool get hasUnavailableItems => !validation.valid;

  /// Get unavailable items count
  int get unavailableItemsCount => items.where((item) => item.isUnavailable).length;

  /// Get subtotal
  double get subtotal => cart?.subtotal ?? 0;

  /// Get grand total
  double get grandTotal => cart?.grandTotal ?? 0;

  /// Get discount amount
  double get discountAmount => cart?.discountAmount ?? 0;

  /// Get applied promo code (from manual set or from cart's discountCode)
  String? get appliedPromoCode => _manualPromoCode ?? cart?.discountCode?.code;

  /// Check if promo is applied
  bool get hasPromoApplied => discountAmount > 0 && appliedPromoCode != null;

  /// Get payment URL for checkout
  String? get paymentUrl => placeOrderResponse?.payment?.authorizationUrl;

  CartState copyWith({
    CartStatus? status,
    CartModel? cart,
    String? errorMessage,
    CartValidation? validation,
    PromoStatus? promoStatus,
    String? promoMessage,
    String? promoError,
    String? appliedPromoCode,
    bool clearCart = false,
    bool clearPromoMessage = false,
    bool clearPromoError = false,
    PlaceOrderStatus? placeOrderStatus,
    PlaceOrderResponse? placeOrderResponse,
    String? placeOrderError,
    bool clearPlaceOrder = false,
  }) {
    return CartState(
      status: status ?? this.status,
      cart: clearCart ? null : (cart ?? this.cart),
      errorMessage: errorMessage,
      validation: validation ?? this.validation,
      promoStatus: promoStatus ?? this.promoStatus,
      promoMessage: clearPromoMessage ? null : (promoMessage ?? this.promoMessage),
      promoError: clearPromoError ? null : (promoError ?? this.promoError),
      appliedPromoCode: appliedPromoCode ?? _manualPromoCode,
      placeOrderStatus: clearPlaceOrder ? PlaceOrderStatus.initial : (placeOrderStatus ?? this.placeOrderStatus),
      placeOrderResponse: clearPlaceOrder ? null : (placeOrderResponse ?? this.placeOrderResponse),
      placeOrderError: clearPlaceOrder ? null : (placeOrderError ?? this.placeOrderError),
    );
  }

  @override
  List<Object?> get props => [status, cart, errorMessage, validation, promoStatus, promoMessage, promoError, _manualPromoCode, placeOrderStatus, placeOrderResponse, placeOrderError];
}
