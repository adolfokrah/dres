import 'package:flutter/foundation.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dres/features/orders/data/repositories/incoming_orders_repository.dart';
import 'incoming_orders_event.dart';
import 'incoming_orders_state.dart';

export 'incoming_orders_event.dart';
export 'incoming_orders_state.dart';

class IncomingOrdersBloc extends Bloc<IncomingOrdersEvent, IncomingOrdersState> {
  final IncomingOrdersRepository _incomingOrdersRepository;
  static const int _pageSize = 10;

  IncomingOrdersBloc({
    required IncomingOrdersRepository incomingOrdersRepository,
  })  : _incomingOrdersRepository = incomingOrdersRepository,
        super(const IncomingOrdersState()) {
    on<IncomingOrdersFetchRequested>(_onFetchRequested);
    on<IncomingOrdersLoadMoreRequested>(_onLoadMoreRequested);
    on<IncomingOrdersRefreshRequested>(_onRefreshRequested);
    on<IncomingOrdersFilterChanged>(_onFilterChanged);
    on<IncomingOrdersClearRequested>(_onClearRequested);
  }

  Future<void> _onFetchRequested(
    IncomingOrdersFetchRequested event,
    Emitter<IncomingOrdersState> emit,
  ) async {
    // Use clearStatusFilter when explicitly setting to null (All filter)
    emit(state.copyWith(
      status: IncomingOrdersStatus.loading,
      statusFilter: event.statusFilter,
      clearStatusFilter: event.statusFilter == null,
      currentPage: 1,
    ));

    try {
      debugPrint('📦 Fetching incoming orders with filter: ${event.statusFilter}');
      final response = await _incomingOrdersRepository.getIncomingOrders(
        page: 1,
        limit: _pageSize,
        statusFilter: event.statusFilter,
      );
      debugPrint('📦 Fetched ${response.docs.length} incoming orders');

      emit(state.copyWith(
        status: IncomingOrdersStatus.success,
        orders: response.docs,
        hasMore: response.hasNextPage,
        currentPage: response.page,
      ));
    } catch (e, stackTrace) {
      debugPrint('📦 Error fetching incoming orders: $e');
      debugPrint('📦 Stack trace: $stackTrace');
      emit(state.copyWith(
        status: IncomingOrdersStatus.error,
        error: e.toString(),
      ));
    }
  }

  Future<void> _onLoadMoreRequested(
    IncomingOrdersLoadMoreRequested event,
    Emitter<IncomingOrdersState> emit,
  ) async {
    if (!state.hasMore || state.status == IncomingOrdersStatus.loading) return;

    try {
      final nextPage = state.currentPage + 1;
      final response = await _incomingOrdersRepository.getIncomingOrders(
        page: nextPage,
        limit: _pageSize,
        statusFilter: state.statusFilter,
      );

      emit(state.copyWith(
        orders: [...state.orders, ...response.docs],
        hasMore: response.hasNextPage,
        currentPage: response.page,
      ));
    } catch (e) {
      // Silently fail on load more
      debugPrint('📦 Error loading more incoming orders: $e');
    }
  }

  Future<void> _onFilterChanged(
    IncomingOrdersFilterChanged event,
    Emitter<IncomingOrdersState> emit,
  ) async {
    add(IncomingOrdersFetchRequested(statusFilter: event.statusFilter));
  }

  Future<void> _onRefreshRequested(
    IncomingOrdersRefreshRequested event,
    Emitter<IncomingOrdersState> emit,
  ) async {
    // Refresh with current filter
    add(IncomingOrdersFetchRequested(statusFilter: state.statusFilter));
  }

  void _onClearRequested(
    IncomingOrdersClearRequested event,
    Emitter<IncomingOrdersState> emit,
  ) {
    emit(const IncomingOrdersState());
  }
}
