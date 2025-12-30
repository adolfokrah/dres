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
  }

  Future<void> _onFetchRequested(
    CartFetchRequested event,
    Emitter<CartState> emit,
  ) async {
    emit(state.copyWith(status: CartStatus.loading));

    try {
      final cart = await _cartRepository.getMyCart();
      
      debugPrint('🛒 CartBloc: Fetched cart with ${cart?.itemCount ?? 0} items');
      
      emit(state.copyWith(
        status: CartStatus.loaded,
        cart: cart,
      ));
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
}
