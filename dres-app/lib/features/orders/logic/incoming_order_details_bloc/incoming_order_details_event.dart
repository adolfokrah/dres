import 'package:equatable/equatable.dart';

abstract class IncomingOrderDetailsEvent extends Equatable {
  const IncomingOrderDetailsEvent();

  @override
  List<Object?> get props => [];
}

/// Fetch incoming order details
class IncomingOrderDetailsFetchRequested extends IncomingOrderDetailsEvent {
  final String orderId;

  const IncomingOrderDetailsFetchRequested({required this.orderId});

  @override
  List<Object?> get props => [orderId];
}

/// Refresh incoming order details (pull-to-refresh)
class IncomingOrderDetailsRefreshRequested extends IncomingOrderDetailsEvent {
  const IncomingOrderDetailsRefreshRequested();
}

/// Mark item as not available
class IncomingOrderItemMarkNotAvailable extends IncomingOrderDetailsEvent {
  final String itemId;

  const IncomingOrderItemMarkNotAvailable({required this.itemId});

  @override
  List<Object?> get props => [itemId];
}

/// Mark all items as out for delivery
class IncomingOrderMarkAllOutForDelivery extends IncomingOrderDetailsEvent {
  const IncomingOrderMarkAllOutForDelivery();
}

/// Accept return for an item
class IncomingOrderAcceptReturn extends IncomingOrderDetailsEvent {
  final String itemId;

  const IncomingOrderAcceptReturn({required this.itemId});

  @override
  List<Object?> get props => [itemId];
}

/// Reject/Dispute return for an item
class IncomingOrderRejectReturn extends IncomingOrderDetailsEvent {
  final String itemId;

  const IncomingOrderRejectReturn({required this.itemId});

  @override
  List<Object?> get props => [itemId];
}
