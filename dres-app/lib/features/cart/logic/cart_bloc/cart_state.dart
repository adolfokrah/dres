import 'package:equatable/equatable.dart';
import 'package:dres/features/cart/data/repositories/cart_repository.dart';

enum CartStatus { initial, loading, loaded, error }

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

  const CartState({
    this.status = CartStatus.initial,
    this.cart,
    this.errorMessage,
    this.validation = const CartValidation(),
  });

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

  CartState copyWith({
    CartStatus? status,
    CartModel? cart,
    String? errorMessage,
    CartValidation? validation,
    bool clearCart = false,
  }) {
    return CartState(
      status: status ?? this.status,
      cart: clearCart ? null : (cart ?? this.cart),
      errorMessage: errorMessage,
      validation: validation ?? this.validation,
    );
  }

  @override
  List<Object?> get props => [status, cart, errorMessage, validation];
}
