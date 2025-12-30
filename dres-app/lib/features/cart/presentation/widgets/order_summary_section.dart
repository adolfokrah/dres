import 'package:flutter/material.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/utilities/currency_utils.dart';
import 'package:dres/core/widgets/app_button.dart';

/// Order summary section with totals and place order button
class OrderSummarySection extends StatelessWidget {
  final int itemCount;
  final double itemsTotal;
  final double discount;
  final double shipping;
  final double buyerProtection;
  final double subtotal;
  final VoidCallback? onPlaceOrder;
  final bool isLoading;
  final bool canPlaceOrder;

  const OrderSummarySection({
    super.key,
    required this.itemCount,
    required this.itemsTotal,
    required this.discount,
    required this.shipping,
    required this.buyerProtection,
    required this.subtotal,
    this.onPlaceOrder,
    this.isLoading = false,
    this.canPlaceOrder = true,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      color: AppColors.background,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Summary rows
          _SummaryRow(
            label: '$itemCount items',
            amount: itemsTotal,
          ),
          const SizedBox(height: 8),
          _SummaryRow(
            label: 'Discount',
            amount: -discount,
            isNegative: true,
          ),
          const SizedBox(height: 8),
          _SummaryRow(
            label: 'Shipping',
            amount: shipping,
          ),
          // Only show buyer protection if amount > 0
          if (buyerProtection > 0) ...[
            const SizedBox(height: 8),
            _SummaryRow(
              label: 'Buyer Protection',
              amount: buyerProtection,
            ),
          ],

          const SizedBox(height: 67),

          // Grand total row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Grand Total',
                style: AppTypography.bodyL.copyWith(
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              Text(
                CurrencyUtils.format(subtotal),
                style: AppTypography.bodyL.copyWith(
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),

          const SizedBox(height: 13),

          // Place order button
          AppButton.filled(
            text: 'Place order',
            onPressed: canPlaceOrder ? onPlaceOrder : null,
            isFullWidth: true,
            isLoading: isLoading,
          ),
        ],
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  final String label;
  final double amount;
  final bool isNegative;

  const _SummaryRow({
    required this.label,
    required this.amount,
    this.isNegative = false,
  });

  @override
  Widget build(BuildContext context) {
    final displayAmount = isNegative && amount != 0
        ? '-${CurrencyUtils.format(amount.abs())}'
        : CurrencyUtils.format(amount);

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
          displayAmount,
          style: AppTypography.bodyM.copyWith(
            color: AppColors.textPrimary,
          ),
        ),
      ],
    );
  }
}
