import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/utilities/currency_utils.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/core/widgets/status_badge.dart';
import 'package:dres/core/services/rate_app_service.dart';
import 'package:dres/features/profile/logic/transactions_bloc/transactions_bloc.dart';
import 'package:dres/features/profile/data/models/transaction_model.dart';

/// Transactions list tab content (seller's view)
class TransactionsList extends StatefulWidget {
  final BuildContext parentContext;

  const TransactionsList({
    super.key,
    required this.parentContext,
  });

  @override
  State<TransactionsList> createState() => _TransactionsListState();
}

class _TransactionsListState extends State<TransactionsList> {
  late final TransactionsBloc _transactionsBloc;

  @override
  void initState() {
    super.initState();
    _transactionsBloc = getIt<TransactionsBloc>();

    // Always fetch transactions when this widget is shown
    _transactionsBloc.add(const TransactionsFetchRequested());
  }

  @override
  void dispose() {
    // Don't close bloc - it's a singleton
    super.dispose();
  }

  void _onScroll(ScrollNotification notification) {
    if (notification is ScrollEndNotification) {
      final metrics = notification.metrics;
      if (metrics.pixels >= metrics.maxScrollExtent - 200) {
        _transactionsBloc.add(const TransactionsLoadMoreRequested());
      }
    }
  }

  Future<void> _onRefresh() async {
    _transactionsBloc.add(const TransactionsRefreshRequested());
    // Wait for the state to change from loading
    await _transactionsBloc.stream.firstWhere(
      (state) => state.status != TransactionsStatus.loading,
    );
  }

  void _showWithdrawalSheet(TransactionsState state) {
    final balance = state.availableBalance;
    final fee = state.withdrawalFee;
    final withdrawAmount = balance - fee;
    final symbol = state.currencySymbol;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      isDismissible: false,
      enableDrag: false,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.zero,
      ),
      builder: (sheetContext) => BlocConsumer<TransactionsBloc, TransactionsState>(
        bloc: _transactionsBloc,
        listenWhen: (previous, current) =>
            previous.withdrawalStatus != current.withdrawalStatus,
        listener: (context, currentState) {
          // Close sheet when withdrawal completes (success or error)
          if (currentState.withdrawalStatus == WithdrawalStatus.success ||
              currentState.withdrawalStatus == WithdrawalStatus.error) {
            Navigator.of(sheetContext).pop();
          }
        },
        builder: (context, currentState) {
          final isCurrentlyWithdrawing = currentState.withdrawalStatus == WithdrawalStatus.loading;

          return PopScope(
            canPop: !isCurrentlyWithdrawing,
            child: Stack(
              children: [
                Padding(
                  padding: EdgeInsets.only(
                    left: 24,
                    right: 24,
                    top: 24,
                    bottom: MediaQuery.of(sheetContext).viewInsets.bottom + 24,
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Handle bar
                      Center(
                        child: Container(
                          width: 40,
                          height: 4,
                          color: AppColors.secondary,
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Title
                      Text(
                        'Withdraw Funds',
                        style: AppTypography.titleL.copyWith(
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                        ),
                        textAlign: TextAlign.center,
                      ),
                const SizedBox(height: 24),

                // Invoice-style breakdown
                Container(
                  padding: const EdgeInsets.all(16),
                  color: AppColors.secondary.withValues(alpha: 0.5),
                  child: Column(
                    children: [
                      // Available Balance row
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Available Balance',
                            style: AppTypography.bodyM.copyWith(
                              color: AppColors.textSecondary,
                            ),
                          ),
                          Text(
                            CurrencyUtils.format(balance, symbol: symbol),
                            style: AppTypography.bodyM.copyWith(
                              color: AppColors.textPrimary,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      // Transfer Fee row
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Transfer Fee',
                            style: AppTypography.bodyM.copyWith(
                              color: AppColors.textSecondary,
                            ),
                          ),
                          Text(
                            '- ${CurrencyUtils.format(fee, symbol: symbol)}',
                            style: AppTypography.bodyM.copyWith(
                              color: AppColors.textHint,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      // Divider
                      const Divider(height: 1),
                      const SizedBox(height: 12),

                      // You Will Receive row
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'You Will Receive',
                            style: AppTypography.bodyM.copyWith(
                              fontWeight: FontWeight.w700,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          Text(
                            CurrencyUtils.format(withdrawAmount, symbol: symbol),
                            style: AppTypography.bodyL.copyWith(
                              fontWeight: FontWeight.w700,
                              color: AppColors.primary,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Action buttons
                Row(
                  children: [
                    // Cancel button
                    Expanded(
                      child: OutlinedButton(
                        onPressed: isCurrentlyWithdrawing
                            ? null
                            : () => Navigator.of(sheetContext).pop(),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          side: const BorderSide(color: AppColors.secondary),
                          shape: const RoundedRectangleBorder(
                            borderRadius: BorderRadius.zero,
                          ),
                        ),
                        child: Text(
                          'Cancel',
                          style: AppTypography.bodyM.copyWith(
                            fontWeight: FontWeight.w600,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),

                    // Withdraw button
                    Expanded(
                      child: ElevatedButton(
                        onPressed: isCurrentlyWithdrawing
                            ? null
                            : () {
                                _transactionsBloc.add(const WithdrawalRequested());
                              },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: const RoundedRectangleBorder(
                            borderRadius: BorderRadius.zero,
                          ),
                        ),
                        child: isCurrentlyWithdrawing
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : Text(
                                'Withdraw',
                                style: AppTypography.bodyM.copyWith(
                                  fontWeight: FontWeight.w600,
                                  color: Colors.white,
                                ),
                              ),
                      ),
                    ),
                    ],
                  ),
                ],
              ),
            ),
            // Loading overlay
            if (isCurrentlyWithdrawing)
              Positioned.fill(
                child: Container(
                  color: Colors.white.withValues(alpha: 0.8),
                  child: Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const CircularProgressIndicator(),
                        const SizedBox(height: 16),
                        Text(
                          'Processing withdrawal...',
                          style: AppTypography.bodyM.copyWith(
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
          ],
        ),
      );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<TransactionsBloc, TransactionsState>(
      bloc: _transactionsBloc,
      listenWhen: (previous, current) {
        // Only listen when withdrawal status changes from loading to success/error
        return previous.withdrawalStatus != current.withdrawalStatus;
      },
      listener: (context, state) {
        // Show feedback for withdrawal status changes
        if (state.withdrawalStatus == WithdrawalStatus.success &&
            state.withdrawalMessage != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.withdrawalMessage!),
              backgroundColor: Colors.green,
            ),
          );
          // Request app review after successful withdrawal (happy moment)
          getIt<RateAppService>().requestReview();
        } else if (state.withdrawalStatus == WithdrawalStatus.error &&
            state.withdrawalError != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.withdrawalError!),
              backgroundColor: Colors.red,
            ),
          );
        }
      },
      builder: (context, state) {
        return NotificationListener<ScrollNotification>(
          onNotification: (notification) {
            _onScroll(notification);
            return false; // Allow notification to bubble up to NestedScrollView
          },
          child: RefreshIndicator(
            onRefresh: _onRefresh,
            edgeOffset: 100, // Account for NestedScrollView header
            child: CustomScrollView(
              slivers: [
                // Inject overlap from NestedScrollView header
                SliverOverlapInjector(
                  handle: NestedScrollView.sliverOverlapAbsorberHandleFor(
                      widget.parentContext),
                ),

                // Summary header
                SliverToBoxAdapter(
                  child: _buildSummaryHeader(state),
                ),

                // Transactions content
                _buildSliverContent(state),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildSummaryHeader(TransactionsState state) {
    final canWithdraw = state.availableBalance >= state.minimumWithdrawalAmount;

    return Container(
      decoration: const BoxDecoration(
        border: Border(
          bottom: BorderSide(color: AppColors.secondary, width: 1),
        ),
      ),
      child: IntrinsicHeight(
        child: Row(
          children: [
            // Total Earned
            Expanded(
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: const BoxDecoration(
                  border: Border(
                    right: BorderSide(color: AppColors.secondary, width: 1),
                  ),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            CurrencyUtils.formatCompact(state.totalEarned, symbol: state.currencySymbol),
                            style: AppTypography.bodyL.copyWith(
                              fontWeight: FontWeight.w700,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Total earned',
                            style: AppTypography.bodyM.copyWith(
                              color: AppColors.textPrimary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Icon(
                      PhosphorIcons.arrowUp(PhosphorIconsStyle.bold),
                      size: 16,
                      color: const Color(0xFFACF8BF),
                    ),
                  ],
                ),
              ),
            ),
            // Available Balance - tap to withdraw
            Expanded(
              child: GestureDetector(
                onTap: canWithdraw ? () => _showWithdrawalSheet(state) : null,
                child: Container(
                  padding: const EdgeInsets.all(20),
                  color: Colors.transparent,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        CurrencyUtils.formatCompact(state.availableBalance, symbol: state.currencySymbol),
                        style: AppTypography.bodyL.copyWith(
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Available balance',
                        style: AppTypography.bodyM.copyWith(
                          color: AppColors.textPrimary,
                        ),
                      ),
                      if (canWithdraw) ...[
                        const SizedBox(height: 8),
                        Text(
                          'Tap to withdraw',
                          style: AppTypography.bodyS.copyWith(
                            color: AppColors.primary,
                            fontSize: 11,
                          ),
                        ),
                      ] else if (state.availableBalance > 0) ...[
                        const SizedBox(height: 8),
                        Text(
                          'Min. ${CurrencyUtils.format(state.minimumWithdrawalAmount, symbol: state.currencySymbol)} to withdraw',
                          style: AppTypography.bodyS.copyWith(
                            color: AppColors.textHint,
                            fontSize: 10,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSliverContent(TransactionsState state) {
    if (state.status == TransactionsStatus.loading &&
        state.transactions.isEmpty) {
      return const SliverFillRemaining(
        child: Center(child: CircularProgressIndicator()),
      );
    }

    if (state.status == TransactionsStatus.error &&
        state.transactions.isEmpty) {
      return SliverFillRemaining(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'Failed to load transactions',
                  style: AppTypography.bodyL.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
                if (state.error != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    state.error!,
                    style: AppTypography.bodyS.copyWith(
                      color: AppColors.textHint,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
                const SizedBox(height: 16),
                TextButton(
                  onPressed: () {
                    _transactionsBloc.add(const TransactionsRefreshRequested());
                  },
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    if (state.transactions.isEmpty) {
      return SliverFillRemaining(
        child: Center(
          child: Text(
            'No transactions yet',
            style: AppTypography.bodyL.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
        ),
      );
    }

    return SliverList(
      delegate: SliverChildBuilderDelegate(
        (context, index) {
          if (index >= state.transactions.length) {
            return const SizedBox.shrink();
          }
          final transaction = state.transactions[index];
          return _TransactionCard(transaction: transaction);
        },
        childCount: state.transactions.length + (state.hasMore ? 1 : 0),
      ),
    );
  }
}

/// Transaction card widget
class _TransactionCard extends StatelessWidget {
  final TransactionModel transaction;

  const _TransactionCard({required this.transaction});

  @override
  Widget build(BuildContext context) {
    final isCancelled = transaction.status == TransactionStatus.cancelled;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(
          bottom: BorderSide(color: AppColors.secondary, width: 1),
        ),
      ),
      child: Row(
        children: [
          // Status icon
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: AppColors.secondary,
              borderRadius: BorderRadius.circular(100),
            ),
            child: Center(
              child: Icon(
                _getStatusIcon(),
                size: 20,
                color: AppColors.textHint,
              ),
            ),
          ),
          const SizedBox(width: 15),

          // Transaction info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _getTransactionTitle(),
                  style: AppTypography.bodyM.copyWith(
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 11),
                StatusBadge(
                  status: transaction.status.value,
                  type: StatusBadgeType.transaction,
                ),
              ],
            ),
          ),

          // Amount and date
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                CurrencyUtils.format(transaction.amount, symbol: transaction.currencySymbol),
                style: AppTypography.bodyM.copyWith(
                  fontWeight: FontWeight.w700,
                  color: transaction.amount < 0 ? Colors.red : AppColors.textPrimary,
                  decoration: isCancelled ? TextDecoration.lineThrough : null,
                ),
              ),
              const SizedBox(height: 11),
              Text(
                _formatDate(transaction.createdAt),
                style: AppTypography.bodyS.copyWith(
                  color: AppColors.textPrimary,
                  fontSize: 10,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _getTransactionTitle() {
    if (transaction.type == TransactionType.transfer) {
      return 'Withdrawal';
    }
    if (transaction.type == TransactionType.refund) {
      if (transaction.orderDisplayId.isNotEmpty) {
        return 'Refund - Order #${transaction.orderDisplayId}';
      }
      return 'Refund';
    }
    if (transaction.orderDisplayId.isNotEmpty) {
      return 'Order #${transaction.orderDisplayId}';
    }
    return transaction.type.displayName;
  }

  IconData _getStatusIcon() {
    // For transfers, show arrow up (money going out)
    if (transaction.type == TransactionType.transfer) {
      return PhosphorIcons.arrowUp();
    }
    // For refunds, show arrow down (money coming in)
    if (transaction.type == TransactionType.refund) {
      return PhosphorIcons.arrowDown();
    }
    switch (transaction.status) {
      case TransactionStatus.cancelled:
        return PhosphorIcons.x();
      case TransactionStatus.completed:
      case TransactionStatus.pending:
      case TransactionStatus.inProgress:
        return PhosphorIcons.arrowDown();
    }
  }

  String _formatDate(DateTime date) {
    final month = date.month.toString().padLeft(2, '0');
    final day = date.day.toString().padLeft(2, '0');
    final year = date.year;
    final hour = date.hour > 12 ? date.hour - 12 : (date.hour == 0 ? 12 : date.hour);
    final minute = date.minute.toString().padLeft(2, '0');
    final period = date.hour >= 12 ? 'PM' : 'AM';
    return '$month/$day/$year $hour:$minute $period';
  }
}
