import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dres/features/orders/data/repositories/orders_repository.dart';
import 'order_details_event.dart';
import 'order_details_state.dart';

export 'order_details_event.dart';
export 'order_details_state.dart';

class OrderDetailsBloc extends Bloc<OrderDetailsEvent, OrderDetailsState> {
  final OrdersRepository _ordersRepository;

  OrderDetailsBloc({required OrdersRepository ordersRepository})
    : _ordersRepository = ordersRepository,
      super(const OrderDetailsState()) {
    on<OrderDetailsFetchRequested>(_onFetchRequested);
    on<OrderDetailsRefreshRequested>(_onRefreshRequested);
  }

  Future<void> _onFetchRequested(
    OrderDetailsFetchRequested event,
    Emitter<OrderDetailsState> emit,
  ) async {
    emit(
      state.copyWith(
        status: OrderDetailsStatus.loading,
        currentOrderId: event.orderId,
      ),
    );

    try {
      final purchaseDetails = await _ordersRepository.getPurchaseDetails(
        event.orderId,
      );

      emit(
        state.copyWith(
          status: OrderDetailsStatus.success,
          purchaseDetails: purchaseDetails,
        ),
      );
    } catch (e) {
      emit(
        state.copyWith(status: OrderDetailsStatus.error, error: e.toString()),
      );
    }
  }

  Future<void> _onRefreshRequested(
    OrderDetailsRefreshRequested event,
    Emitter<OrderDetailsState> emit,
  ) async {
    if (state.currentOrderId == null) return;

    emit(state.copyWith(isRefreshing: true));

    try {
      final purchaseDetails = await _ordersRepository.getPurchaseDetails(
        state.currentOrderId!,
      );

      emit(
        state.copyWith(
          status: OrderDetailsStatus.success,
          purchaseDetails: purchaseDetails,
          isRefreshing: false,
        ),
      );
    } catch (e) {
      // Keep existing data on refresh error
      emit(state.copyWith(error: e.toString(), isRefreshing: false));
    }
  }
}
