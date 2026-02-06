import 'package:flutter/material.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/utilities/currency_utils.dart';
import 'package:dres/core/widgets/app_button.dart';
import 'package:dres/features/orders/data/models/order_model.dart';
import 'package:dres/features/orders/data/models/purchase_details_model.dart';
import 'package:dres/features/orders/presentation/widgets/shipping_status_badge.dart';

/// Purchase item tile widget (uses PurchaseItemModel)
class PurchaseItemTile extends StatelessWidget {
  final PurchaseItemModel item;
  final String currencySymbol;
  final void Function(PurchaseItemModel item)? onReturnItemTap;

  const PurchaseItemTile({
    super.key,
    required this.item,
    required this.currencySymbol,
    this.onReturnItemTap,
  });

  @override
  Widget build(BuildContext context) {
    // Get variation title from purchase details
    final variationTitle = item.variationTitle ?? '';

    // Get SKU option value from skuTitle (middle part of "Pink / 44 / ₵ 233")
    final optionValue = item.skuOptionValue ?? '';

    // Get image URL
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
                  // Product title (acts as brand)
                  Text(
                    item.productTitle.toUpperCase(),
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
              CurrencyUtils.format(item.itemTotal, symbol: currencySymbol),
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

        // Action buttons for delivered items only
        if (isDelivered && _canReturn) ...[
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

  /// Check if item can be returned (within 6 hours of delivery)
  bool get _canReturn {
    if (item.shippingStatus != ShippingStatus.delivered) return false;

    // Find the delivered status log
    final deliveredLog = item.statusLogs.firstWhere(
      (log) => log.status == ShippingStatus.delivered.value,
      orElse: () => StatusLog(
        status: ShippingStatus.delivered.value,
        timestamp: DateTime.now(),
      ),
    );

    // Check if within 6 hours
    final now = DateTime.now();
    final deliveredAt = deliveredLog.timestamp;
    final difference = now.difference(deliveredAt);

    return difference.inHours < 6;
  }
}
