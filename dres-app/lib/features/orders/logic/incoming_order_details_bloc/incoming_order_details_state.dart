import 'package:equatable/equatable.dart';
import 'package:dres/features/orders/data/models/incoming_order_details_model.dart';

enum IncomingOrderDetailsBlocStatus { initial, loading, success, error }

class IncomingOrderDetailsState extends Equatable {
  final IncomingOrderDetailsBlocStatus status;
  final IncomingOrderDetailsModel? order;
  final String? error;
  final bool isUpdating;

  const IncomingOrderDetailsState({
    this.status = IncomingOrderDetailsBlocStatus.initial,
    this.order,
    this.error,
    this.isUpdating = false,
  });

  IncomingOrderDetailsState copyWith({
    IncomingOrderDetailsBlocStatus? status,
    IncomingOrderDetailsModel? order,
    String? error,
    bool? isUpdating,
  }) {
    return IncomingOrderDetailsState(
      status: status ?? this.status,
      order: order ?? this.order,
      error: error ?? this.error,
      isUpdating: isUpdating ?? this.isUpdating,
    );
  }

  @override
  List<Object?> get props => [status, order, error, isUpdating];
}
