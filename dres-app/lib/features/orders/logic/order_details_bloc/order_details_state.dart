import 'package:equatable/equatable.dart';
import 'package:dres/features/orders/data/models/order_model.dart';

enum OrderDetailsStatus { initial, loading, success, error }

class OrderDetailsState extends Equatable {
  final OrderDetailsStatus status;
  final OrderModel? order;
  final String? error;
  final String? currentOrderId;

  const OrderDetailsState({
    this.status = OrderDetailsStatus.initial,
    this.order,
    this.error,
    this.currentOrderId,
  });

  OrderDetailsState copyWith({
    OrderDetailsStatus? status,
    OrderModel? order,
    String? error,
    String? currentOrderId,
  }) {
    return OrderDetailsState(
      status: status ?? this.status,
      order: order ?? this.order,
      error: error,
      currentOrderId: currentOrderId ?? this.currentOrderId,
    );
  }

  @override
  List<Object?> get props => [status, order, error, currentOrderId];
}
