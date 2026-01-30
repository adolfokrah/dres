import 'package:equatable/equatable.dart';
import 'package:dres/features/profile/data/models/transaction_model.dart';

enum TransactionsStatus { initial, loading, success, error }

enum WithdrawalStatus { initial, loading, success, error }

class TransactionsState extends Equatable {
  final TransactionsStatus status;
  final List<TransactionModel> transactions;
  final double totalEarned;
  final double availableBalance;
  final double withdrawalFee;
  final double minimumWithdrawalAmount;
  final bool hasWithdrawalAccount;
  final String currencySymbol;
  final String? error;
  final bool hasMore;
  final int currentPage;
  final String? typeFilter;
  final String? statusFilter;
  final WithdrawalStatus withdrawalStatus;
  final String? withdrawalError;
  final String? withdrawalMessage;

  const TransactionsState({
    this.status = TransactionsStatus.initial,
    this.transactions = const [],
    this.totalEarned = 0,
    this.availableBalance = 0,
    this.withdrawalFee = 1,
    this.minimumWithdrawalAmount = 5,
    this.hasWithdrawalAccount = false,
    this.currencySymbol = '₵',
    this.error,
    this.hasMore = true,
    this.currentPage = 1,
    this.typeFilter,
    this.statusFilter,
    this.withdrawalStatus = WithdrawalStatus.initial,
    this.withdrawalError,
    this.withdrawalMessage,
  });

  TransactionsState copyWith({
    TransactionsStatus? status,
    List<TransactionModel>? transactions,
    double? totalEarned,
    double? availableBalance,
    double? withdrawalFee,
    double? minimumWithdrawalAmount,
    bool? hasWithdrawalAccount,
    String? currencySymbol,
    String? error,
    bool? hasMore,
    int? currentPage,
    String? typeFilter,
    String? statusFilter,
    bool clearTypeFilter = false,
    bool clearStatusFilter = false,
    WithdrawalStatus? withdrawalStatus,
    String? withdrawalError,
    String? withdrawalMessage,
    bool clearWithdrawalError = false,
    bool clearWithdrawalMessage = false,
  }) {
    return TransactionsState(
      status: status ?? this.status,
      transactions: transactions ?? this.transactions,
      totalEarned: totalEarned ?? this.totalEarned,
      availableBalance: availableBalance ?? this.availableBalance,
      withdrawalFee: withdrawalFee ?? this.withdrawalFee,
      minimumWithdrawalAmount: minimumWithdrawalAmount ?? this.minimumWithdrawalAmount,
      hasWithdrawalAccount: hasWithdrawalAccount ?? this.hasWithdrawalAccount,
      currencySymbol: currencySymbol ?? this.currencySymbol,
      error: error,
      hasMore: hasMore ?? this.hasMore,
      currentPage: currentPage ?? this.currentPage,
      typeFilter: clearTypeFilter ? null : (typeFilter ?? this.typeFilter),
      statusFilter: clearStatusFilter ? null : (statusFilter ?? this.statusFilter),
      withdrawalStatus: withdrawalStatus ?? this.withdrawalStatus,
      withdrawalError: clearWithdrawalError ? null : (withdrawalError ?? this.withdrawalError),
      withdrawalMessage: clearWithdrawalMessage ? null : (withdrawalMessage ?? this.withdrawalMessage),
    );
  }

  @override
  List<Object?> get props => [
        status,
        transactions,
        totalEarned,
        availableBalance,
        withdrawalFee,
        minimumWithdrawalAmount,
        hasWithdrawalAccount,
        currencySymbol,
        error,
        hasMore,
        currentPage,
        typeFilter,
        statusFilter,
        withdrawalStatus,
        withdrawalError,
        withdrawalMessage,
      ];
}
