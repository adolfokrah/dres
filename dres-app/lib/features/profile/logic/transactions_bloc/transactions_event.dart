import 'package:equatable/equatable.dart';

abstract class TransactionsEvent extends Equatable {
  const TransactionsEvent();

  @override
  List<Object?> get props => [];
}

/// Event to fetch transactions
class TransactionsFetchRequested extends TransactionsEvent {
  final String? typeFilter;
  final String? statusFilter;

  const TransactionsFetchRequested({
    this.typeFilter,
    this.statusFilter,
  });

  @override
  List<Object?> get props => [typeFilter, statusFilter];
}

/// Event to load more transactions
class TransactionsLoadMoreRequested extends TransactionsEvent {
  const TransactionsLoadMoreRequested();
}

/// Event to refresh transactions
class TransactionsRefreshRequested extends TransactionsEvent {
  const TransactionsRefreshRequested();
}

/// Event to change filter
class TransactionsFilterChanged extends TransactionsEvent {
  final String? typeFilter;
  final String? statusFilter;

  const TransactionsFilterChanged({
    this.typeFilter,
    this.statusFilter,
  });

  @override
  List<Object?> get props => [typeFilter, statusFilter];
}
