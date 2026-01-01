import 'package:equatable/equatable.dart';

abstract class IncomingOrdersEvent extends Equatable {
  const IncomingOrdersEvent();

  @override
  List<Object?> get props => [];
}

/// Fetch incoming orders with optional filter
class IncomingOrdersFetchRequested extends IncomingOrdersEvent {
  final String? statusFilter;

  const IncomingOrdersFetchRequested({this.statusFilter});

  @override
  List<Object?> get props => [statusFilter];
}

/// Load more incoming orders (pagination)
class IncomingOrdersLoadMoreRequested extends IncomingOrdersEvent {
  const IncomingOrdersLoadMoreRequested();
}

/// Change status filter
class IncomingOrdersFilterChanged extends IncomingOrdersEvent {
  final String? statusFilter;

  const IncomingOrdersFilterChanged({this.statusFilter});

  @override
  List<Object?> get props => [statusFilter];
}
