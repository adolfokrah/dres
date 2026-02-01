import 'package:equatable/equatable.dart';
import 'package:dres/features/orders/data/models/incoming_order_details_model.dart';

enum IncomingOrderDetailsBlocStatus { initial, loading, success, error }

class IncomingOrderDetailsState extends Equatable {
  final IncomingOrderDetailsBlocStatus status;
  final IncomingOrderDetailsModel? order;
  final String? error;
  final bool isUpdating;
  final bool isRefreshing;

  const IncomingOrderDetailsState({
    this.status = IncomingOrderDetailsBlocStatus.initial,
    this.order,
    this.error,
    this.isUpdating = false,
    this.isRefreshing = false,
  });

  IncomingOrderDetailsState copyWith({
    IncomingOrderDetailsBlocStatus? status,
    IncomingOrderDetailsModel? order,
    String? error,
    bool? isUpdating,
    bool? isRefreshing,
  }) {
    return IncomingOrderDetailsState(
      status: status ?? this.status,
      order: order ?? this.order,
      error: error ?? this.error,
      isUpdating: isUpdating ?? this.isUpdating,
      isRefreshing: isRefreshing ?? this.isRefreshing,
    );
  }

  @override
  List<Object?> get props => [status, order, error, isUpdating, isRefreshing];
}
