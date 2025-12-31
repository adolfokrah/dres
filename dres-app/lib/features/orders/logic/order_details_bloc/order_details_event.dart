import 'package:equatable/equatable.dart';

abstract class OrderDetailsEvent extends Equatable {
  const OrderDetailsEvent();

  @override
  List<Object?> get props => [];
}

/// Fetch order by ID
class OrderDetailsFetchRequested extends OrderDetailsEvent {
  final String orderId;

  const OrderDetailsFetchRequested({required this.orderId});

  @override
  List<Object?> get props => [orderId];
}

/// Refresh order
class OrderDetailsRefreshRequested extends OrderDetailsEvent {
  const OrderDetailsRefreshRequested();
}
