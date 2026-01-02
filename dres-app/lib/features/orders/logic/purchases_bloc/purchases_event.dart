import 'package:equatable/equatable.dart';

abstract class PurchasesEvent extends Equatable {
  const PurchasesEvent();

  @override
  List<Object?> get props => [];
}

/// Fetch user's purchases/orders
class PurchasesFetchRequested extends PurchasesEvent {
  final String? statusFilter;
  final int page;

  const PurchasesFetchRequested({
    this.statusFilter,
    this.page = 1,
  });

  @override
  List<Object?> get props => [statusFilter, page];
}

/// Load more purchases
class PurchasesLoadMoreRequested extends PurchasesEvent {
  const PurchasesLoadMoreRequested();
}

/// Change status filter
class PurchasesFilterChanged extends PurchasesEvent {
  final String? statusFilter;

  const PurchasesFilterChanged({this.statusFilter});

  @override
  List<Object?> get props => [statusFilter];
}
