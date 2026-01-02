import 'package:equatable/equatable.dart';
import 'package:dres/features/orders/data/models/incoming_order_model.dart';

enum IncomingOrdersStatus { initial, loading, success, error }

class IncomingOrdersState extends Equatable {
  final IncomingOrdersStatus status;
  final List<IncomingOrderModel> orders;
  final String? error;
  final bool hasMore;
  final int currentPage;
  final String? statusFilter;

  const IncomingOrdersState({
    this.status = IncomingOrdersStatus.initial,
    this.orders = const [],
    this.error,
    this.hasMore = false,
    this.currentPage = 1,
    this.statusFilter,
  });

  IncomingOrdersState copyWith({
    IncomingOrdersStatus? status,
    List<IncomingOrderModel>? orders,
    String? error,
    bool? hasMore,
    int? currentPage,
    String? statusFilter,
    bool clearStatusFilter = false,
  }) {
    return IncomingOrdersState(
      status: status ?? this.status,
      orders: orders ?? this.orders,
      error: error ?? this.error,
      hasMore: hasMore ?? this.hasMore,
      currentPage: currentPage ?? this.currentPage,
      statusFilter: clearStatusFilter ? null : (statusFilter ?? this.statusFilter),
    );
  }

  @override
  List<Object?> get props => [status, orders, error, hasMore, currentPage, statusFilter];
}
