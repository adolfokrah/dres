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
    emit(state.copyWith(
      status: OrderDetailsStatus.loading,
      currentOrderId: event.orderId,
    ));

    try {
      final order = await _ordersRepository.getOrderById(event.orderId);
      emit(state.copyWith(
        status: OrderDetailsStatus.success,
        order: order,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: OrderDetailsStatus.error,
        error: e.toString(),
      ));
    }
  }

  Future<void> _onRefreshRequested(
    OrderDetailsRefreshRequested event,
    Emitter<OrderDetailsState> emit,
  ) async {
    if (state.currentOrderId == null) return;

    try {
      final order = await _ordersRepository.getOrderById(state.currentOrderId!);
      emit(state.copyWith(
        status: OrderDetailsStatus.success,
        order: order,
      ));
    } catch (e) {
      // Keep existing order on refresh error
      emit(state.copyWith(
        error: e.toString(),
      ));
    }
  }
}
