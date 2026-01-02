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

/// Transactions tab for seller profile
class TransactionsTab extends StatefulWidget {
  const TransactionsTab({super.key});

  @override
  State<TransactionsTab> createState() => _TransactionsTabState();
}

class _TransactionsTabState extends State<TransactionsTab> {
  late final TransactionsBloc _bloc;
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _bloc = getIt<TransactionsBloc>();
    _bloc.add(const TransactionsFetchRequested());
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      _bloc.add(const TransactionsLoadMoreRequested());
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<TransactionsBloc, TransactionsState>(
      bloc: _bloc,
      builder: (context, state) {
        if (state.status == TransactionsStatus.loading &&
            state.transactions.isEmpty) {
          return const Center(child: CircularProgressIndicator());
        }

        if (state.status == TransactionsStatus.error &&
            state.transactions.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'Failed to load transactions',
                  style: AppTypography.bodyM.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 16),
                TextButton(
                  onPressed: () =>
                      _bloc.add(const TransactionsRefreshRequested()),
                  child: const Text('Retry'),
                ),
              ],
            ),
          );
        }

        return RefreshIndicator(
          onRefresh: () async {
            _bloc.add(const TransactionsRefreshRequested());
          },
          child: CustomScrollView(
            controller: _scrollController,
            slivers: [
              // Summary header
              SliverToBoxAdapter(
                child: _buildSummaryHeader(state),
              ),

              // Transactions list
              if (state.transactions.isEmpty)
                SliverFillRemaining(
                  child: Center(
                    child: Text(
                      'No transactions yet',
                      style: AppTypography.bodyM.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ),
                )
              else
                SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      if (index >= state.transactions.length) {
                        return const SizedBox.shrink();
                      }
                      return _TransactionCard(
                        transaction: state.transactions[index],
                      );
                    },
                    childCount: state.transactions.length,
                  ),
                ),

              // Loading indicator
              if (state.hasMore && state.transactions.isNotEmpty)
                const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.all(20),
                    child: Center(child: CircularProgressIndicator()),
                  ),
                ),
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
                            CurrencyUtils.formatCompact(state.totalEarned),
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
                            CurrencyUtils.formatCompact(state.upcomingPayments),
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
                CurrencyUtils.format(transaction.amount),
                style: AppTypography.bodyM.copyWith(
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                  decoration:
                      isCancelled ? TextDecoration.lineThrough : null,
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
    final hour = date.hour > 12 ? date.hour - 12 : date.hour;
    final minute = date.minute.toString().padLeft(2, '0');
    final period = date.hour >= 12 ? 'PM' : 'AM';
    return '$month/$day/$year ${hour == 0 ? 12 : hour}:$minute $period';
  }
}
