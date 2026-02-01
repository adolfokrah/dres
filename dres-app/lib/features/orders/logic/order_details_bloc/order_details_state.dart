import 'package:equatable/equatable.dart';
import 'package:dres/features/orders/data/models/purchase_details_model.dart';

enum OrderDetailsStatus { initial, loading, success, error }

class OrderDetailsState extends Equatable {
  final OrderDetailsStatus status;
  final PurchaseDetailsModel? purchaseDetails;
  final String? error;
  final String? currentOrderId;
  final bool isRefreshing;

  const OrderDetailsState({
    this.status = OrderDetailsStatus.initial,
    this.purchaseDetails,
    this.error,
    this.currentOrderId,
    this.isRefreshing = false,
  });

  OrderDetailsState copyWith({
    OrderDetailsStatus? status,
    PurchaseDetailsModel? purchaseDetails,
    String? error,
    String? currentOrderId,
    bool? isRefreshing,
  }) {
    return OrderDetailsState(
      status: status ?? this.status,
      purchaseDetails: purchaseDetails ?? this.purchaseDetails,
      error: error,
      currentOrderId: currentOrderId ?? this.currentOrderId,
      isRefreshing: isRefreshing ?? this.isRefreshing,
    );
  }

  @override
  List<Object?> get props =>
      [status, purchaseDetails, error, currentOrderId, isRefreshing];
}
