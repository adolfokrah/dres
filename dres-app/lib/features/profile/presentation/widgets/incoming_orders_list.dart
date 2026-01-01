import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/features/profile/logic/incoming_orders_bloc/incoming_orders_bloc.dart';
import 'package:dres/features/profile/presentation/widgets/incoming_order_card.dart';
import 'package:dres/features/profile/presentation/widgets/status_filter_chips.dart';

/// Incoming orders list tab content (seller's view)
class IncomingOrdersList extends StatefulWidget {
  final BuildContext parentContext;

  const IncomingOrdersList({
    super.key,
    required this.parentContext,
  });

  @override
  State<IncomingOrdersList> createState() => _IncomingOrdersListState();
}

class _IncomingOrdersListState extends State<IncomingOrdersList> {
  late final IncomingOrdersBloc _incomingOrdersBloc;

  @override
  void initState() {
    super.initState();
    _incomingOrdersBloc = getIt<IncomingOrdersBloc>();
    
    // Always fetch incoming orders when this widget is shown
    _incomingOrdersBloc.add(IncomingOrdersFetchRequested(statusFilter: _incomingOrdersBloc.state.statusFilter));
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
        _incomingOrdersBloc.add(const IncomingOrdersLoadMoreRequested());
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<IncomingOrdersBloc, IncomingOrdersState>(
      bloc: _incomingOrdersBloc,
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
                child: IncomingOrdersFilterChips(
                  selectedFilter: state.statusFilter,
                  onFilterChanged: (filter) {
                    _incomingOrdersBloc.add(IncomingOrdersFilterChanged(statusFilter: filter));
                  },
                ),
              ),

              // Incoming orders content
              _buildSliverContent(state),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSliverContent(IncomingOrdersState state) {
    if (state.status == IncomingOrdersStatus.loading && state.orders.isEmpty) {
      return const SliverFillRemaining(
        child: Center(child: CircularProgressIndicator()),
      );
    }

    if (state.status == IncomingOrdersStatus.error && state.orders.isEmpty) {
      return SliverFillRemaining(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'Failed to load incoming orders',
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
                    _incomingOrdersBloc.add(IncomingOrdersFetchRequested(
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

    if (state.orders.isEmpty) {
      return SliverFillRemaining(
        child: Center(
          child: Text(
            'No incoming orders found',
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
          if (index >= state.orders.length) {
            return const Padding(
              padding: EdgeInsets.all(20),
              child: Center(child: CircularProgressIndicator()),
            );
          }

          final order = state.orders[index];
          return Column(
            children: [
              IncomingOrderCard(
                order: order,
                onTap: () {
                  // Navigate to incoming order details (seller's view)
                  context.push('/incoming-orders/${order.id}');
                },
              ),
              const Divider(height: 1),
            ],
          );
        },
        childCount: state.orders.length + (state.hasMore ? 1 : 0),
      ),
    );
  }
}
