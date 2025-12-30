import 'package:flutter/foundation.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dres/features/cart/data/repositories/cart_repository.dart';
import 'cart_event.dart';
import 'cart_state.dart';

class CartBloc extends Bloc<CartEvent, CartState> {
  final CartRepository _cartRepository;

  CartBloc({required CartRepository cartRepository})
      : _cartRepository = cartRepository,
        super(const CartState()) {
    on<CartFetchRequested>(_onFetchRequested);
    on<CartAddItemRequested>(_onAddItemRequested);
    on<CartCleared>(_onCleared);
    on<CartUpdateShippingRequested>(_onUpdateShippingRequested);
  }

  /// Helper to convert CartValidationResponse to CartValidation
  CartValidation _toCartValidation(CartValidationResponse? response) {
    if (response == null) {
      return const CartValidation();
    }
    return CartValidation(
      valid: response.valid,
      reasons: response.reasons,
    );
  }

  Future<void> _onFetchRequested(
    CartFetchRequested event,
    Emitter<CartState> emit,
  ) async {
    emit(state.copyWith(status: CartStatus.loading));

    try {
      final response = await _cartRepository.getMyCart();
      
      debugPrint('🛒 CartBloc: Fetched cart with ${response.cart?.itemCount ?? 0} items');
      debugPrint('🛒 CartBloc: Validation valid=${response.validation?.valid}, reasons=${response.validation?.reasons}');
      
      // Explicitly clear cart if null
      if (response.cart == null) {
        emit(state.copyWith(
          status: CartStatus.loaded,
          clearCart: true,
          validation: const CartValidation(),
        ));
      } else {
        emit(state.copyWith(
          status: CartStatus.loaded,
          cart: response.cart,
          validation: _toCartValidation(response.validation),
        ));
      }
    } catch (e) {
      debugPrint('🛒 CartBloc: Error fetching cart: $e');
      emit(state.copyWith(
        status: CartStatus.error,
        errorMessage: e.toString(),
      ));
    }
  }

  Future<void> _onAddItemRequested(
    CartAddItemRequested event,
    Emitter<CartState> emit,
  ) async {
    emit(state.copyWith(status: CartStatus.loading));

    try {
      final response = await _cartRepository.addToCart(
        variationId: event.variationId,
        skuId: event.skuId,
        quantity: event.quantity,
        buyerProtection: event.buyerProtection,
      );

      debugPrint('🛒 CartBloc: Item added to cart, action: ${response.action}');

      emit(state.copyWith(
        status: CartStatus.loaded,
        cart: response.cart,
      ));
    } catch (e) {
      debugPrint('🛒 CartBloc: Error adding to cart: $e');
      emit(state.copyWith(
        status: CartStatus.error,
        errorMessage: e.toString(),
      ));
    }
  }

  void _onCleared(
    CartCleared event,
    Emitter<CartState> emit,
  ) {
    debugPrint('🛒 CartBloc: Cart cleared');
    emit(const CartState());
  }

  Future<void> _onUpdateShippingRequested(
    CartUpdateShippingRequested event,
    Emitter<CartState> emit,
  ) async {
    emit(state.copyWith(status: CartStatus.loading));

    try {
      debugPrint('🛒 CartBloc: Updating shipping for city ${event.cityId}...');
      final response = await _cartRepository.updateShipping(cityId: event.cityId);

      if (response.success && response.cart != null) {
        debugPrint('🛒 CartBloc: Shipping updated - Total: ${response.shippingSummary?.totalShipping}');
        debugPrint('🛒 CartBloc: Validation valid=${response.validation?.valid}');
        emit(state.copyWith(
          status: CartStatus.loaded,
          cart: response.cart,
          validation: _toCartValidation(response.validation),
        ));
      } else {
        debugPrint('🛒 CartBloc: Failed to update shipping: ${response.message}');
        emit(state.copyWith(
          status: CartStatus.error,
          errorMessage: response.message,
        ));
      }
    } catch (e) {
      debugPrint('🛒 CartBloc: Error updating shipping: $e');
      emit(state.copyWith(
        status: CartStatus.error,
        errorMessage: e.toString(),
      ));
    }
  }
}
