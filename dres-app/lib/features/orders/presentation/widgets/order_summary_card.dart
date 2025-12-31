import 'package:flutter/material.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/utilities/currency_utils.dart';
import 'package:dres/features/orders/data/models/order_model.dart';

/// Order summary section showing totals
class OrderSummaryCard extends StatelessWidget {
  final OrderModel order;

  const OrderSummaryCard({
    super.key,
    required this.order,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      color: AppColors.secondary,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Items count and subtotal
          _SummaryRow(
            label: '${order.totalItems} item${order.totalItems != 1 ? 's' : ''}',
            value: CurrencyUtils.format(order.subtotal),
          ),
          const SizedBox(height: 8),

          // Discount
          if (order.totalDiscount > 0) ...[
            _SummaryRow(
              label: 'Discount',
              value: '-${CurrencyUtils.format(order.totalDiscount)}',
            ),
            const SizedBox(height: 8),
          ],

          // Shipping
          _SummaryRow(
            label: 'Shipping',
            value: CurrencyUtils.format(order.totalShipping),
          ),
          const SizedBox(height: 8),

          // Buyer protection
          _SummaryRow(
            label: 'Buyer Protection',
            value: CurrencyUtils.format(order.totalBuyerProtection),
          ),

          const SizedBox(height: 24),

          // Grand total
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Grand total',
                style: AppTypography.bodyL.copyWith(
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              Text(
                CurrencyUtils.format(order.grandTotal),
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
}

class _SummaryRow extends StatelessWidget {
  final String label;
  final String value;

  const _SummaryRow({
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: AppTypography.bodyM.copyWith(
            color: AppColors.textPrimary,
          ),
        ),
        Text(
          value,
          style: AppTypography.bodyM.copyWith(
            color: AppColors.textPrimary,
          ),
        ),
      ],
    );
  }
}
