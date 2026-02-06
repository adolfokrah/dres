import 'package:flutter/material.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/utilities/currency_utils.dart';
import 'package:dres/core/widgets/app_button.dart';
import 'package:dres/features/orders/data/models/order_model.dart';
import 'package:dres/features/orders/presentation/widgets/shipping_status_badge.dart';

/// Order item tile widget
class OrderItemTile extends StatelessWidget {
  final OrderItemModel item;
  final void Function(OrderItemModel item)? onReturnItemTap;

  const OrderItemTile({
    super.key,
    required this.item,
    this.onReturnItemTap,
  });

  @override
  Widget build(BuildContext context) {
    // Get brand name from variation > style > brand
    final brandName = item.variation?.style?.brand?.name ?? '';
    
    // Get variation title from orders collection (stored at time of purchase)
    final variationTitle = item.variationTitle ?? '';
    
    // Get SKU option value from skuTitle (middle part of "Pink / 44 / ₵ 233")
    final optionValue = item.skuOptionValue ?? '';

    // Get image URL (prefers variationImage stored at purchase time)
    final imageUrl = item.imageUrl;

    // Check if item is delivered
    final isDelivered = item.shippingStatus == ShippingStatus.delivered;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Item row
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Product image
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                image: imageUrl != null
                    ? DecorationImage(
                        image: NetworkImage(imageUrl),
                        fit: BoxFit.cover,
                      )
                    : null,
              ),
            ),
            const SizedBox(width: 16),
            // Product info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Brand
                  if (brandName.isNotEmpty)
                    Text(
                      brandName.toUpperCase(),
                      style: AppTypography.bodyL.copyWith(
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  // Variation title
                  if (variationTitle.isNotEmpty)
                    Text(
                      variationTitle.toUpperCase(),
                      style: AppTypography.bodyM.copyWith(
                        color: AppColors.textPrimary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  // SKU option value x quantity
                  Text(
                    optionValue.isNotEmpty 
                        ? '$optionValue x${item.quantity}'
                        : 'x${item.quantity}',
                    style: AppTypography.bodyM.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            // Price
            Text(
              CurrencyUtils.format(item.itemTotal),
              style: AppTypography.bodyL.copyWith(
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        // Status badge
        ShippingStatusBadge(status: item.shippingStatus),

        // Action button for delivered items only
        if (isDelivered && item.canReturn) ...[
          const SizedBox(height: 12),
          AppButton.outlined(
            text: 'Return Item',
            onPressed: () => onReturnItemTap?.call(item),
            height: 44,
          ),
        ],
      ],
    );
  }
}
