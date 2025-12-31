import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/features/profile/logic/purchases_bloc/purchases_bloc.dart';
import 'package:dres/features/profile/presentation/widgets/order_card.dart';
import 'package:dres/features/profile/presentation/widgets/status_filter_chips.dart';

/// Purchases list tab content
class PurchasesList extends StatefulWidget {
  final BuildContext parentContext;

  const PurchasesList({
    super.key,
    required this.parentContext,
  });

  @override
  State<PurchasesList> createState() => _PurchasesListState();
}

class _PurchasesListState extends State<PurchasesList> {
  late final PurchasesBloc _purchasesBloc;
  bool _initialLoadDone = false;

  @override
  void initState() {
    super.initState();
    _purchasesBloc = getIt<PurchasesBloc>();
    
    // Only fetch if no purchases loaded yet (first time)
    if (_purchasesBloc.state.purchases.isEmpty && !_initialLoadDone) {
      _purchasesBloc.add(PurchasesFetchRequested(statusFilter: _purchasesBloc.state.statusFilter));
      _initialLoadDone = true;
    }
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
        _purchasesBloc.add(const PurchasesLoadMoreRequested());
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<PurchasesBloc, PurchasesState>(
      bloc: _purchasesBloc,
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
                handle: NestedScrollView.sliverOverlapAbsorberHandleFor(widget.parentContext),
              ),

              // Filter chips - fixed at top of tab content
              SliverToBoxAdapter(
                child: StatusFilterChips(
                  selectedFilter: state.statusFilter,
                  onFilterChanged: (filter) {
                    _purchasesBloc.add(PurchasesFilterChanged(statusFilter: filter));
                  },
                ),
              ),

              // Purchases content
              _buildSliverContent(state),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSliverContent(PurchasesState state) {
    if (state.status == PurchasesStatus.loading && state.purchases.isEmpty) {
      return const SliverFillRemaining(
        child: Center(child: CircularProgressIndicator()),
      );
    }

    if (state.status == PurchasesStatus.error && state.purchases.isEmpty) {
      return SliverFillRemaining(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'Failed to load purchases',
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
                    _purchasesBloc.add(PurchasesFetchRequested(
                      statusFilter: state.statusFilter,
                    ));
                  },
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    if (state.purchases.isEmpty) {
      return SliverFillRemaining(
        child: Center(
          child: Text(
            'No purchases found',
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
          if (index >= state.purchases.length) {
            return const Padding(
              padding: EdgeInsets.all(20),
              child: Center(child: CircularProgressIndicator()),
            );
          }

          final purchase = state.purchases[index];
          return Column(
            children: [
              PurchaseCard(
                purchase: purchase,
                onTap: () {
                  context.push('/orders/${purchase.id}');
                },
              ),
              const Divider(height: 1),
            ],
          );
        },
        childCount: state.purchases.length + (state.hasMore ? 1 : 0),
      ),
    );
  }
}
