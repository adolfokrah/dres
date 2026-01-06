import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/utilities/currency_utils.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/core/widgets/status_badge.dart';
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

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<TransactionsBloc, TransactionsState>(
      bloc: _transactionsBloc,
      builder: (context, state) {
        return NotificationListener<ScrollNotification>(
          onNotification: (notification) {
            _onScroll(notification);
            return false; // Allow notification to bubble up to NestedScrollView
          },
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
        );
      },
    );
  }

  Widget _buildSummaryHeader(TransactionsState state) {
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
            // Upcoming Payments
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            CurrencyUtils.formatCompact(state.upcomingPayments, symbol: state.currencySymbol),
                            style: AppTypography.bodyL.copyWith(
                              fontWeight: FontWeight.w700,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Up coming payments',
                            style: AppTypography.bodyM.copyWith(
                              color: AppColors.textPrimary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
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

          // Order info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Order #${transaction.orderDisplayId}',
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
                  color: AppColors.textPrimary,
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

  IconData _getStatusIcon() {
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
