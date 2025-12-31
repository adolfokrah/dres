import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/features/orders/logic/order_details_bloc/order_details_bloc.dart';
import 'package:dres/features/orders/presentation/widgets/order_progress_bar.dart';
import 'package:dres/features/orders/presentation/widgets/order_seller_card.dart';
import 'package:dres/features/orders/presentation/widgets/order_summary_card.dart';

class OrderDetailsScreen extends StatefulWidget {
  final String orderId;

  const OrderDetailsScreen({
    super.key,
    required this.orderId,
  });

  @override
  State<OrderDetailsScreen> createState() => _OrderDetailsScreenState();
}

class _OrderDetailsScreenState extends State<OrderDetailsScreen> {
  late final OrderDetailsBloc _orderDetailsBloc;

  @override
  void initState() {
    super.initState();
    _orderDetailsBloc = getIt<OrderDetailsBloc>();
    _orderDetailsBloc.add(OrderDetailsFetchRequested(orderId: widget.orderId));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: IconButton(
          icon: Icon(
            PhosphorIcons.caretLeft(),
            color: AppColors.textPrimary,
          ),
          onPressed: () => context.pop(),
        ),
        title: BlocBuilder<OrderDetailsBloc, OrderDetailsState>(
          bloc: _orderDetailsBloc,
          builder: (context, state) {
            final displayOrderId = state.order?.orderId ?? '';
            return Text(
              displayOrderId.isNotEmpty ? 'Order #$displayOrderId' : 'Order Details',
              style: AppTypography.bodyL.copyWith(
                color: AppColors.textPrimary,
              ),
            );
          },
        ),
        centerTitle: true,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(
            height: 1,
            color: AppColors.secondary,
          ),
        ),
      ),
      body: BlocBuilder<OrderDetailsBloc, OrderDetailsState>(
        bloc: _orderDetailsBloc,
        builder: (context, state) {
          if (state.status == OrderDetailsStatus.loading) {
            return const Center(
              child: CircularProgressIndicator(),
            );
          }

          if (state.status == OrderDetailsStatus.error) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    PhosphorIcons.warning(),
                    size: 48,
                    color: AppColors.textHint,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Failed to load order',
                    style: AppTypography.bodyL.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: () {
                      _orderDetailsBloc.add(
                        OrderDetailsFetchRequested(orderId: widget.orderId),
                      );
                    },
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          final order = state.order;
          if (order == null) {
            return const Center(
              child: Text('Order not found'),
            );
          }

          final itemsBySeller = order.itemsBySeller;

          return RefreshIndicator(
            onRefresh: () async {
              _orderDetailsBloc.add(const OrderDetailsRefreshRequested());
            },
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Progress bar
                  OrderProgressBar(
                    status: order.status,
                    progressValue: order.overallProgress,
                  ),

                  // Shipping address section
                  if (order.shippingAddress != null)
                    _ShippingSection(address: order.shippingAddress!),

                  // Seller cards with items
                  ...itemsBySeller.entries.map((entry) {
                    final seller = order.items
                        .firstWhere((item) => item.seller.id == entry.key)
                        .seller;
                    return OrderSellerCard(
                      seller: seller,
                      items: entry.value,
                      onLearnMoreTap: () {
                        // TODO: Show direct shipping info
                      },
                      onReturnItemTap: (item) async {
                        final result = await context.push<bool>(
                          '/orders/${widget.orderId}/return/${item.id}',
                        );
                        // Refresh order if return was successful
                        if (result == true && mounted) {
                          _orderDetailsBloc.add(OrderDetailsFetchRequested(orderId: widget.orderId));
                        }
                      },
                      onResellItemTap: (item) {
                        // TODO: Handle resell item
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Resell item feature coming soon'),
                          ),
                        );
                      },
                    );
                  }),

                  // Order summary
                  OrderSummaryCard(order: order),

                  const SizedBox(height: 40),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _ShippingSection extends StatelessWidget {
  final dynamic address;

  const _ShippingSection({required this.address});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: const BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: AppColors.secondary,
            width: 1,
          ),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Shipping',
            style: AppTypography.bodyL.copyWith(
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 11),
          Text(
            address.displayAddress,
            style: AppTypography.bodyM.copyWith(
              color: AppColors.textPrimary,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}
