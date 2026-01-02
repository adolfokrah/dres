import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/utilities/currency_utils.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/core/widgets/app_button.dart';
import 'package:dres/core/widgets/status_badge.dart';
import 'package:dres/features/orders/logic/incoming_order_details_bloc/incoming_order_details_bloc.dart';
import 'package:dres/features/orders/data/models/incoming_order_details_model.dart';
import 'package:dres/features/profile/presentation/widgets/incoming_order_item_tile.dart';

/// Incoming order details screen (seller's view)
class IncomingOrderDetailsScreen extends StatefulWidget {
  final String orderId;

  const IncomingOrderDetailsScreen({
    super.key,
    required this.orderId,
  });

  @override
  State<IncomingOrderDetailsScreen> createState() => _IncomingOrderDetailsScreenState();
}

class _IncomingOrderDetailsScreenState extends State<IncomingOrderDetailsScreen> {
  late final IncomingOrderDetailsBloc _bloc;

  @override
  void initState() {
    super.initState();
    _bloc = getIt<IncomingOrderDetailsBloc>();
    _bloc.add(IncomingOrderDetailsFetchRequested(orderId: widget.orderId));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: _buildAppBar(),
      body: BlocBuilder<IncomingOrderDetailsBloc, IncomingOrderDetailsState>(
        bloc: _bloc,
        builder: (context, state) {
          if (state.status == IncomingOrderDetailsBlocStatus.loading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (state.status == IncomingOrderDetailsBlocStatus.error) {
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
                  const SizedBox(height: 16),
                  TextButton(
                    onPressed: () {
                      _bloc.add(IncomingOrderDetailsFetchRequested(orderId: widget.orderId));
                    },
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          final order = state.order;
          if (order == null) {
            return const Center(child: Text('Order not found'));
          }

          return Stack(
            children: [
              _buildBody(order),
              // Loading overlay when updating
              if (state.isUpdating)
                Container(
                  color: Colors.black.withValues(alpha: 0.3),
                  child: const Center(
                    child: CircularProgressIndicator(),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: AppColors.background,
      elevation: 0,
      leading: IconButton(
        icon: Icon(
          PhosphorIcons.caretLeft(),
          color: AppColors.textPrimary,
        ),
        onPressed: () => context.pop(),
      ),
      title: BlocBuilder<IncomingOrderDetailsBloc, IncomingOrderDetailsState>(
        bloc: _bloc,
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
    );
  }

  Widget _buildBody(IncomingOrderDetailsModel order) {
    return Column(
      children: [
        // Scrollable content
        Expanded(
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Warning banner - only show when there are placed items
                if (order.hasPlacedItems) _buildWarningBanner(),

                // Progress bar with status
                _buildProgressBar(order),

                // Shipping info
                _buildShippingInfo(order),

                // Items list
                ...order.items.map((item) => IncomingOrderItemTile(
                      item: item,
                      onNotAvailableTap: item.canMarkNotAvailable
                          ? () => _onMarkNotAvailable(item)
                          : null,
                      onAcceptReturnTap: item.hasReturnInProgress
                          ? () => _onAcceptReturn(item)
                          : null,
                    )),

                // Order summary
                _buildOrderSummary(order),
              ],
            ),
          ),
        ),

        // Bottom action button - only show when there are placed items
        if (order.hasPlacedItems) _buildBottomButton(order),
      ],
    );
  }

  Widget _buildWarningBanner() {
    return Container(
      padding: const EdgeInsets.all(20),
      color: AppColors.secondary,
      child: Text(
        'You have 24 hours to package and ship the products. Failure to ship within 48 hours will result in automatic order cancellation and a loss of credibility on the platform.',
        style: AppTypography.bodyM.copyWith(
          color: AppColors.textPrimary,
        ),
      ),
    );
  }

  Widget _buildProgressBar(IncomingOrderDetailsModel order) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      child: Row(
        children: [
          // Progress bars
          Expanded(
            child: Row(
              children: [
                _buildProgressSegment(isActive: order.status.progressValue >= 1),
                const SizedBox(width: 10),
                _buildProgressSegment(isActive: order.status.progressValue >= 2),
                const SizedBox(width: 10),
                _buildProgressSegment(isActive: order.status.progressValue >= 3),
                const SizedBox(width: 10),
                _buildProgressSegment(isActive: order.status.progressValue >= 4),
              ],
            ),
          ),
          const SizedBox(width: 10),
          // Status badge
          StatusBadge(
            status: order.status.value,
            type: StatusBadgeType.order,
            displayText: order.status.displayName,
          ),
        ],
      ),
    );
  }

  Widget _buildProgressSegment({required bool isActive}) {
    return Expanded(
      child: Container(
        height: 8,
        decoration: BoxDecoration(
          color: isActive ? const Color(0xFFACF8BF) : AppColors.gray,
          borderRadius: BorderRadius.circular(2),
        ),
      ),
    );
  }

  Widget _buildShippingInfo(IncomingOrderDetailsModel order) {
    final shipping = order.shipping;
    if (shipping == null) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: const BoxDecoration(
        border: Border(
          top: BorderSide(color: AppColors.secondary, width: 1),
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
            shipping.customerName,
            style: AppTypography.bodyM.copyWith(
              color: AppColors.textPrimary,
            ),
          ),
          Text(
            shipping.location,
            style: AppTypography.bodyM.copyWith(
              color: AppColors.textPrimary,
            ),
          ),
          if (shipping.phone != null && shipping.phone!.isNotEmpty)
            Text(
              shipping.phone!,
              style: AppTypography.bodyM.copyWith(
                color: AppColors.textPrimary,
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildOrderSummary(IncomingOrderDetailsModel order) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          // Items count and total
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '${order.itemCount} ${order.itemCount == 1 ? 'item' : 'items'}',
                style: AppTypography.bodyM.copyWith(
                  color: AppColors.textPrimary,
                ),
              ),
              Text(
                CurrencyUtils.format(order.itemsTotal),
                style: AppTypography.bodyM.copyWith(
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Shipping fee
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Shipping Fee',
                style: AppTypography.bodyM.copyWith(
                  color: AppColors.textPrimary,
                ),
              ),
              Text(
                CurrencyUtils.format(order.shippingFee),
                style: AppTypography.bodyM.copyWith(
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Subtotal
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Subtotal',
                style: AppTypography.bodyL.copyWith(
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              Text(
                CurrencyUtils.format(order.subtotal),
                style: AppTypography.bodyL.copyWith(
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBottomButton(IncomingOrderDetailsModel order) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: const BoxDecoration(
        border: Border(
          top: BorderSide(color: AppColors.secondary, width: 1),
        ),
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          width: double.infinity,
          child: AppButton.filled(
            text: 'All out for delivery',
            onPressed: _onMarkAllOutForDelivery,
            height: 44,
          ),
        ),
      ),
    );
  }

  void _onMarkNotAvailable(IncomingOrderItemModel item) {
    _bloc.add(IncomingOrderItemMarkNotAvailable(itemId: item.id));
  }

  void _onAcceptReturn(IncomingOrderItemModel item) {
    _bloc.add(IncomingOrderAcceptReturn(itemId: item.id));
  }

  void _onMarkAllOutForDelivery() {
    _bloc.add(const IncomingOrderMarkAllOutForDelivery());
  }
}
