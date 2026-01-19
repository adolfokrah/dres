import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/core/widgets/app_info_banner.dart';
import 'package:dres/features/orders/data/models/order_model.dart';
import 'package:dres/features/orders/data/models/purchase_details_model.dart';
import 'package:dres/features/orders/logic/order_details_bloc/order_details_bloc.dart';
import 'package:dres/features/orders/presentation/widgets/order_progress_bar.dart';
import 'package:dres/features/orders/presentation/widgets/purchase_seller_card.dart';
import 'package:dres/features/orders/presentation/widgets/order_summary_card.dart';

class PurchaseDetailsScreen extends StatefulWidget {
  final String orderId;

  const PurchaseDetailsScreen({super.key, required this.orderId});

  @override
  State<PurchaseDetailsScreen> createState() => _PurchaseDetailsScreenState();
}

class _PurchaseDetailsScreenState extends State<PurchaseDetailsScreen> {
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
          icon: Icon(PhosphorIcons.caretLeft(), color: AppColors.textPrimary),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              // After checkout, navigate to profile user screen (which shows purchases by default)
              context.go('/profile/user');
            }
          },
        ),
        title: BlocBuilder<OrderDetailsBloc, OrderDetailsState>(
          bloc: _orderDetailsBloc,
          builder: (context, state) {
            final displayOrderId = state.purchaseDetails?.order.orderId ?? '';
            return Text(
              displayOrderId.isNotEmpty
                  ? 'Order #$displayOrderId'
                  : 'Order Details',
              style: AppTypography.bodyL.copyWith(color: AppColors.textPrimary),
            );
          },
        ),
        centerTitle: true,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: AppColors.secondary),
        ),
      ),
      body: BlocBuilder<OrderDetailsBloc, OrderDetailsState>(
        bloc: _orderDetailsBloc,
        builder: (context, state) {
          if (state.status == OrderDetailsStatus.loading) {
            return const Center(child: CircularProgressIndicator());
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

          final purchaseDetails = state.purchaseDetails;
          if (purchaseDetails == null) {
            return const Center(child: Text('Order not found'));
          }

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
                    status: purchaseDetails.order.status,
                    progressValue: _calculateOverallProgress(purchaseDetails),
                  ),

                  // Testing alert for out_for_delivery items
                  if (_hasOutForDeliveryItems(purchaseDetails))
                    const Padding(
                      padding: EdgeInsets.all(20),
                      child: AppInfoBanner.warning(
                        title: 'Testing Mode',
                        text: 'Items out for delivery will be auto-delivered after 5 minutes for testing purposes.',
                      ),
                    ),

                  // Shipping address section
                  if (purchaseDetails.shippingAddress != null)
                    _ShippingSection(address: purchaseDetails.shippingAddress!),

                  // Seller cards with items
                  ...purchaseDetails.sellerGroups.map((sellerGroup) {
                    return PurchaseSellerCard(
                      sellerGroup: sellerGroup,
                      orderId: widget.orderId,
                      currencySymbol: purchaseDetails.currencySymbol,
                      onReturnItemTap: (item) async {
                        final result = await context.push<bool>(
                          '/orders/${widget.orderId}/return/${item.id}',
                        );
                        // Refresh order if return was successful
                        if (result == true && mounted) {
                          _orderDetailsBloc.add(
                            OrderDetailsFetchRequested(orderId: widget.orderId),
                          );
                        }
                      },
                    );
                  }),

                  // Order summary
                  OrderSummaryCard(
                    summary: purchaseDetails.summary,
                    currencySymbol: purchaseDetails.currencySymbol,
                  ),

                  const SizedBox(height: 40),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  /// Check if any items are out for delivery
  bool _hasOutForDeliveryItems(PurchaseDetailsModel purchaseDetails) {
    for (final group in purchaseDetails.sellerGroups) {
      for (final item in group.items) {
        if (item.shippingStatus == ShippingStatus.outForDelivery) {
          return true;
        }
      }
    }
    return false;
  }

  /// Calculate overall progress from all items in all seller groups
  /// Returns 4 if order is completed, otherwise returns max item shipping progress
  int _calculateOverallProgress(PurchaseDetailsModel purchaseDetails) {
    // If order is completed, all steps should be green
    if (purchaseDetails.order.status == OrderStatus.completed) {
      return 4;
    }
    
    int maxProgress = 0;
    for (final group in purchaseDetails.sellerGroups) {
      for (final item in group.items) {
        final itemProgress = item.shippingStatus.progressValue;
        if (itemProgress > maxProgress) {
          maxProgress = itemProgress;
        }
      }
    }
    return maxProgress;
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
          bottom: BorderSide(color: AppColors.secondary, width: 1),
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
