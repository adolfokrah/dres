import 'package:flutter/foundation.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dres/core/services/api_service.dart';
import 'package:dres/features/profile/data/repositories/transactions_repository.dart';
import 'transactions_event.dart';
import 'transactions_state.dart';

export 'transactions_event.dart';
export 'transactions_state.dart';

class TransactionsBloc extends Bloc<TransactionsEvent, TransactionsState> {
  final TransactionsRepository _transactionsRepository;
  static const int _pageSize = 10;

  TransactionsBloc({
    required TransactionsRepository transactionsRepository,
  })  : _transactionsRepository = transactionsRepository,
        super(const TransactionsState()) {
    on<TransactionsFetchRequested>(_onFetchRequested);
    on<TransactionsLoadMoreRequested>(_onLoadMoreRequested);
    on<TransactionsRefreshRequested>(_onRefreshRequested);
    on<TransactionsFilterChanged>(_onFilterChanged);
    on<TransactionsClearRequested>(_onClearRequested);
    on<WithdrawalRequested>(_onWithdrawalRequested);
  }

  Future<void> _onFetchRequested(
    TransactionsFetchRequested event,
    Emitter<TransactionsState> emit,
  ) async {
    emit(state.copyWith(
      status: TransactionsStatus.loading,
      typeFilter: event.typeFilter,
      statusFilter: event.statusFilter,
      clearTypeFilter: event.typeFilter == null,
      clearStatusFilter: event.statusFilter == null,
      currentPage: 1,
    ));

    try {
      debugPrint('💰 Fetching transactions with type: ${event.typeFilter}, status: ${event.statusFilter}');
      final response = await _transactionsRepository.getUserTransactions(
        page: 1,
        limit: _pageSize,
        typeFilter: event.typeFilter,
        statusFilter: event.statusFilter,
      );
      debugPrint('💰 Fetched ${response.transactions.length} transactions');

      emit(state.copyWith(
        status: TransactionsStatus.success,
        transactions: response.transactions,
        totalEarned: response.totalEarned,
        availableBalance: response.availableBalance,
        withdrawalFee: response.withdrawalFee,
        minimumWithdrawalAmount: response.minimumWithdrawalAmount,
        hasWithdrawalAccount: response.hasWithdrawalAccount,
        currencySymbol: response.currencySymbol,
        hasMore: response.hasNextPage,
        currentPage: response.page,
      ));
    } catch (e, stackTrace) {
      debugPrint('💰 Error fetching transactions: $e');
      debugPrint('💰 Stack trace: $stackTrace');
      emit(state.copyWith(
        status: TransactionsStatus.error,
        error: e.toString(),
      ));
    }
  }

  Future<void> _onLoadMoreRequested(
    TransactionsLoadMoreRequested event,
    Emitter<TransactionsState> emit,
  ) async {
    if (!state.hasMore || state.status == TransactionsStatus.loading) return;

    try {
      final nextPage = state.currentPage + 1;
      final response = await _transactionsRepository.getUserTransactions(
        page: nextPage,
        limit: _pageSize,
        typeFilter: state.typeFilter,
        statusFilter: state.statusFilter,
      );

      emit(state.copyWith(
        transactions: [...state.transactions, ...response.transactions],
        hasMore: response.hasNextPage,
        currentPage: response.page,
      ));
    } catch (e) {
      debugPrint('💰 Error loading more transactions: $e');
    }
  }

  Future<void> _onFilterChanged(
    TransactionsFilterChanged event,
    Emitter<TransactionsState> emit,
  ) async {
    add(TransactionsFetchRequested(
      typeFilter: event.typeFilter,
      statusFilter: event.statusFilter,
    ));
  }

  Future<void> _onRefreshRequested(
    TransactionsRefreshRequested event,
    Emitter<TransactionsState> emit,
  ) async {
    add(TransactionsFetchRequested(
      typeFilter: state.typeFilter,
      statusFilter: state.statusFilter,
    ));
  }

  void _onClearRequested(
    TransactionsClearRequested event,
    Emitter<TransactionsState> emit,
  ) {
    emit(const TransactionsState());
  }

  Future<void> _onWithdrawalRequested(
    WithdrawalRequested event,
    Emitter<TransactionsState> emit,
  ) async {
    emit(state.copyWith(
      withdrawalStatus: WithdrawalStatus.loading,
      clearWithdrawalError: true,
      clearWithdrawalMessage: true,
    ));

    try {
      debugPrint('💰 Requesting withdrawal...');
      final response = await _transactionsRepository.requestWithdrawal();
      debugPrint('💰 Withdrawal successful: ${response.message}');

      emit(state.copyWith(
        withdrawalStatus: WithdrawalStatus.success,
        withdrawalMessage: response.message,
        availableBalance: response.newBalance,
      ));

      // Refresh transactions to show the new transfer
      add(const TransactionsRefreshRequested());
    } catch (e, stackTrace) {
      debugPrint('💰 Error requesting withdrawal: $e');
      debugPrint('💰 Stack trace: $stackTrace');

      // Extract user-friendly error message from API response
      final errorMessage = getErrorMessage(e);

      emit(state.copyWith(
        withdrawalStatus: WithdrawalStatus.error,
        withdrawalError: errorMessage,
      ));
    }
  }
}
