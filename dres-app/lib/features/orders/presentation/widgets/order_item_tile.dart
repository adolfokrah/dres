import 'package:flutter/material.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/utilities/currency_utils.dart';
import 'package:dres/features/orders/data/models/order_model.dart';
import 'package:dres/features/orders/presentation/widgets/shipping_status_badge.dart';

/// Order item tile widget
class OrderItemTile extends StatelessWidget {
  final OrderItemModel item;

  const OrderItemTile({
    super.key,
    required this.item,
  });

  @override
  Widget build(BuildContext context) {
    // Get brand name
    final brandName = item.variation?.style?.brand?.name ?? '';
    
    // Product title contains the full description
    final productTitle = item.productTitle;

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
                color: AppColors.secondary,
                borderRadius: BorderRadius.circular(4),
                image: item.imageUrl != null
                    ? DecorationImage(
                        image: NetworkImage(item.imageUrl!),
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
                  if (brandName.isNotEmpty)
                    Text(
                      brandName.toUpperCase(),
                      style: AppTypography.bodyL.copyWith(
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  Text(
                    productTitle,
                    style: AppTypography.bodyM.copyWith(
                      color: AppColors.textPrimary,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
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
      ],
    );
  }
}
