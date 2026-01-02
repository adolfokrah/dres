import 'package:equatable/equatable.dart';
import 'package:dres/features/profile/data/models/transaction_model.dart';

enum TransactionsStatus { initial, loading, success, error }

class TransactionsState extends Equatable {
  final TransactionsStatus status;
  final List<TransactionModel> transactions;
  final double totalEarned;
  final double upcomingPayments;
  final String? error;
  final bool hasMore;
  final int currentPage;
  final String? typeFilter;
  final String? statusFilter;

  const TransactionsState({
    this.status = TransactionsStatus.initial,
    this.transactions = const [],
    this.totalEarned = 0,
    this.upcomingPayments = 0,
    this.error,
    this.hasMore = true,
    this.currentPage = 1,
    this.typeFilter,
    this.statusFilter,
  });

  TransactionsState copyWith({
    TransactionsStatus? status,
    List<TransactionModel>? transactions,
    double? totalEarned,
    double? upcomingPayments,
    String? error,
    bool? hasMore,
    int? currentPage,
    String? typeFilter,
    String? statusFilter,
    bool clearTypeFilter = false,
    bool clearStatusFilter = false,
  }) {
    return TransactionsState(
      status: status ?? this.status,
      transactions: transactions ?? this.transactions,
      totalEarned: totalEarned ?? this.totalEarned,
      upcomingPayments: upcomingPayments ?? this.upcomingPayments,
      error: error,
      hasMore: hasMore ?? this.hasMore,
      currentPage: currentPage ?? this.currentPage,
      typeFilter: clearTypeFilter ? null : (typeFilter ?? this.typeFilter),
      statusFilter: clearStatusFilter ? null : (statusFilter ?? this.statusFilter),
    );
  }

  @override
  List<Object?> get props => [
        status,
        transactions,
        totalEarned,
        upcomingPayments,
        error,
        hasMore,
        currentPage,
        typeFilter,
        statusFilter,
      ];
}
