import 'package:flutter/foundation.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dres/core/services/api_exception.dart';
import 'package:dres/features/cart/data/repositories/cart_repository.dart';
import 'package:dres/features/cart/data/repositories/promo_repository.dart';
import 'cart_event.dart';
import 'cart_state.dart';

class CartBloc extends Bloc<CartEvent, CartState> {
  final CartRepository _cartRepository;
  final PromoRepository _promoRepository;

  CartBloc({
    required CartRepository cartRepository,
    required PromoRepository promoRepository,
  })  : _cartRepository = cartRepository,
        _promoRepository = promoRepository,
        super(const CartState()) {
    on<CartFetchRequested>(_onFetchRequested);
    on<CartAddItemRequested>(_onAddItemRequested);
    on<CartCleared>(_onCleared);
    on<CartUpdateShippingRequested>(_onUpdateShippingRequested);
    on<CartApplyPromoRequested>(_onApplyPromoRequested);
    on<CartRemovePromoRequested>(_onRemovePromoRequested);
    on<CartPlaceOrderRequested>(_onPlaceOrderRequested);
    on<CartPlaceOrderReset>(_onPlaceOrderReset);
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
        
        // If there's a pending shipping city, process it now
        if (state.pendingShippingCityId != null) {
          final pendingCityId = state.pendingShippingCityId!;
          debugPrint('🛒 CartBloc: Processing pending shipping update for city $pendingCityId');
          // Clear pending and trigger shipping update
          add(CartUpdateShippingRequested(cityId: pendingCityId));
        }
      }
    } catch (e) {
      emit(state.copyWith(
        status: CartStatus.error,
        errorMessage: getErrorMessage(e),
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
        errorMessage: getErrorMessage(e),
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
    // If cart is loading, store the city ID to process after cart loads
    if (state.status == CartStatus.loading) {
      debugPrint('🛒 CartBloc: Cart is loading, storing pending shipping city: ${event.cityId}');
      emit(state.copyWith(pendingShippingCityId: event.cityId));
      return;
    }
    
    // Clear pending city ID and update shipping
    emit(state.copyWith(status: CartStatus.loading, clearPendingCityId: true));

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
        errorMessage: getErrorMessage(e),
      ));
    }
  }

  Future<void> _onApplyPromoRequested(
    CartApplyPromoRequested event,
    Emitter<CartState> emit,
  ) async {
    emit(state.copyWith(promoStatus: PromoStatus.loading));

    try {
      debugPrint('🛒 CartBloc: Applying promo code ${event.code}...');
      final response = await _promoRepository.applyPromoCode(code: event.code);

      if (response.success && response.cart != null) {
        debugPrint('🛒 CartBloc: Promo applied - Discount: ${response.discount?.discountAmount}');
        emit(state.copyWith(
          promoStatus: PromoStatus.success,
          cart: response.cart,
          promoMessage: response.message,
          appliedPromoCode: response.discount?.code ?? event.code,
          clearPromoError: true,
        ));
      } else {
        debugPrint('🛒 CartBloc: Failed to apply promo: ${response.error ?? response.message}');
        emit(state.copyWith(
          promoStatus: PromoStatus.error,
          promoError: response.error ?? response.message,
          clearPromoMessage: true,
        ));
      }
    } catch (e) {
      debugPrint('🛒 CartBloc: Error applying promo: $e');
      emit(state.copyWith(
        promoStatus: PromoStatus.error,
        promoError: getErrorMessage(e),
        clearPromoMessage: true,
      ));
    }
  }

  Future<void> _onRemovePromoRequested(
    CartRemovePromoRequested event,
    Emitter<CartState> emit,
  ) async {
    emit(state.copyWith(status: CartStatus.loading));

    try {
      debugPrint('🛒 CartBloc: Removing promo code...');
      final response = await _promoRepository.removePromoCode();

      if (response.success && response.cart != null) {
        debugPrint('🛒 CartBloc: Promo removed');
        emit(state.copyWith(
          status: CartStatus.loaded,
          cart: response.cart,
          promoMessage: null,
          promoError: null,
        ));
      } else {
        debugPrint('🛒 CartBloc: Failed to remove promo: ${response.error ?? response.message}');
        emit(state.copyWith(
          status: CartStatus.error,
          errorMessage: response.error ?? response.message,
        ));
      }
    } catch (e) {
      debugPrint('🛒 CartBloc: Error removing promo: $e');
      emit(state.copyWith(
        status: CartStatus.error,
        errorMessage: getErrorMessage(e),
      ));
    }
  }

  Future<void> _onPlaceOrderRequested(
    CartPlaceOrderRequested event,
    Emitter<CartState> emit,
  ) async {
    emit(state.copyWith(placeOrderStatus: PlaceOrderStatus.loading));

    try {
      final cartId = state.cart?.id;
      if (cartId == null) {
        emit(state.copyWith(
          placeOrderStatus: PlaceOrderStatus.error,
          placeOrderError: 'No cart found',
        ));
        return;
      }

      debugPrint('🛒 CartBloc: Placing order for cart $cartId...');
      final response = await _cartRepository.placeOrder(
        cartId: cartId,
        shippingAddressId: event.shippingAddressId,
      );

      if (response.success && response.payment != null) {
        debugPrint('🛒 CartBloc: Order placed! Payment URL: ${response.payment?.authorizationUrl}');
        emit(state.copyWith(
          placeOrderStatus: PlaceOrderStatus.success,
          placeOrderResponse: response,
          // Don't clear cart yet - wait for payment confirmation
        ));
      } else {
        debugPrint('🛒 CartBloc: Failed to place order: ${response.error ?? response.message}');
        emit(state.copyWith(
          placeOrderStatus: PlaceOrderStatus.error,
          placeOrderError: response.error ?? response.message,
        ));
      }
    } catch (e) {
      debugPrint('🛒 CartBloc: Error placing order: $e');
      emit(state.copyWith(
        placeOrderStatus: PlaceOrderStatus.error,
        placeOrderError: getErrorMessage(e),
      ));
    }
  }

  void _onPlaceOrderReset(
    CartPlaceOrderReset event,
    Emitter<CartState> emit,
  ) {
    emit(state.copyWith(clearPlaceOrder: true));
  }
}
