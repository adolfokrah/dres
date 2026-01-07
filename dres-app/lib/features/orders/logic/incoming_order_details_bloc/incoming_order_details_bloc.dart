import 'package:flutter/foundation.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/features/orders/data/repositories/incoming_orders_repository.dart';
import 'package:dres/features/orders/logic/incoming_orders_bloc/incoming_orders_bloc.dart';
import 'incoming_order_details_event.dart';
import 'incoming_order_details_state.dart';

export 'incoming_order_details_event.dart';
export 'incoming_order_details_state.dart';

class IncomingOrderDetailsBloc extends Bloc<IncomingOrderDetailsEvent, IncomingOrderDetailsState> {
  final IncomingOrdersRepository _repository;
  String? _currentOrderId;

  IncomingOrderDetailsBloc({
    required IncomingOrdersRepository incomingOrdersRepository,
  })  : _repository = incomingOrdersRepository,
        super(const IncomingOrderDetailsState()) {
    on<IncomingOrderDetailsFetchRequested>(_onFetchRequested);
    on<IncomingOrderItemMarkNotAvailable>(_onMarkNotAvailable);
    on<IncomingOrderMarkAllOutForDelivery>(_onMarkAllOutForDelivery);
    on<IncomingOrderAcceptReturn>(_onAcceptReturn);
    on<IncomingOrderRejectReturn>(_onRejectReturn);
  }

  Future<void> _onFetchRequested(
    IncomingOrderDetailsFetchRequested event,
    Emitter<IncomingOrderDetailsState> emit,
  ) async {
    _currentOrderId = event.orderId;
    emit(state.copyWith(status: IncomingOrderDetailsBlocStatus.loading));

    try {
      debugPrint('📦 Fetching incoming order details for orderId: ${event.orderId}');
      final order = await _repository.getIncomingOrderDetails(
        orderId: event.orderId,
      );
      debugPrint('📦 Fetched order ${order.orderId} with ${order.items.length} items');

      emit(state.copyWith(
        status: IncomingOrderDetailsBlocStatus.success,
        order: order,
      ));
    } catch (e, stackTrace) {
      debugPrint('📦 Error fetching incoming order details: $e');
      debugPrint('📦 Stack trace: $stackTrace');
      emit(state.copyWith(
        status: IncomingOrderDetailsBlocStatus.error,
        error: e.toString(),
      ));
    }
  }

  Future<void> _onMarkNotAvailable(
    IncomingOrderItemMarkNotAvailable event,
    Emitter<IncomingOrderDetailsState> emit,
  ) async {
    if (_currentOrderId == null) return;

    emit(state.copyWith(isUpdating: true));

    try {
      debugPrint('📦 Marking item ${event.itemId} as not available');
      await _repository.markItemNotAvailable(
        orderId: _currentOrderId!,
        itemId: event.itemId,
      );

      // Refetch order details
      await _refetchOrder(emit);

      // Refresh incoming orders list
      _refreshIncomingOrdersList();
    } catch (e) {
      debugPrint('📦 Error marking item as not available: $e');
      emit(state.copyWith(
        isUpdating: false,
        error: e.toString(),
      ));
    }
  }

  Future<void> _onMarkAllOutForDelivery(
    IncomingOrderMarkAllOutForDelivery event,
    Emitter<IncomingOrderDetailsState> emit,
  ) async {
    if (_currentOrderId == null) return;

    emit(state.copyWith(isUpdating: true));

    try {
      debugPrint('📦 Marking all items as out for delivery');
      await _repository.markAllOutForDelivery(
        orderId: _currentOrderId!,
      );

      // Refetch order details
      await _refetchOrder(emit);

      // Refresh incoming orders list
      _refreshIncomingOrdersList();
    } catch (e) {
      debugPrint('📦 Error marking all items as out for delivery: $e');
      emit(state.copyWith(
        isUpdating: false,
        error: e.toString(),
      ));
    }
  }

  Future<void> _onAcceptReturn(
    IncomingOrderAcceptReturn event,
    Emitter<IncomingOrderDetailsState> emit,
  ) async {
    if (_currentOrderId == null) return;

    emit(state.copyWith(isUpdating: true));

    try {
      debugPrint('📦 Accepting return for item ${event.itemId}');
      await _repository.acceptReturn(
        orderId: _currentOrderId!,
        itemId: event.itemId,
      );

      // Refetch order details
      await _refetchOrder(emit);

      // Refresh incoming orders list
      _refreshIncomingOrdersList();
    } catch (e) {
      debugPrint('📦 Error accepting return: $e');
      emit(state.copyWith(
        isUpdating: false,
        error: e.toString(),
      ));
    }
  }

  Future<void> _onRejectReturn(
    IncomingOrderRejectReturn event,
    Emitter<IncomingOrderDetailsState> emit,
  ) async {
    if (_currentOrderId == null) return;

    emit(state.copyWith(isUpdating: true));

    try {
      debugPrint('📦 Rejecting/Disputing return for item ${event.itemId}');
      await _repository.rejectReturn(
        orderId: _currentOrderId!,
        itemId: event.itemId,
      );

      // Refetch order details
      await _refetchOrder(emit);

      // Refresh incoming orders list
      _refreshIncomingOrdersList();
    } catch (e) {
      debugPrint('📦 Error rejecting return: $e');
      emit(state.copyWith(
        isUpdating: false,
        error: e.toString(),
      ));
    }
  }

  Future<void> _refetchOrder(Emitter<IncomingOrderDetailsState> emit) async {
    if (_currentOrderId == null) return;

    try {
      final order = await _repository.getIncomingOrderDetails(
        orderId: _currentOrderId!,
      );

      emit(state.copyWith(
        status: IncomingOrderDetailsBlocStatus.success,
        order: order,
        isUpdating: false,
      ));
    } catch (e) {
      debugPrint('📦 Error refetching order: $e');
      emit(state.copyWith(isUpdating: false));
    }
  }

  void _refreshIncomingOrdersList() {
    // Trigger refresh of the incoming orders list
    try {
      getIt<IncomingOrdersBloc>().add(const IncomingOrdersRefreshRequested());
    } catch (e) {
      debugPrint('📦 Could not refresh incoming orders list: $e');
    }
  }
}
