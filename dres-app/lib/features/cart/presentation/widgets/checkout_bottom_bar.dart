import 'package:flutter/material.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/utilities/currency_utils.dart';
import 'package:dres/core/widgets/app_button.dart';

/// Sticky bottom bar with grand total and place order button
class CheckoutBottomBar extends StatelessWidget {
  final double grandTotal;
  final VoidCallback? onPlaceOrder;
  final bool isLoading;
  final bool canPlaceOrder;

  const CheckoutBottomBar({
    super.key,
    required this.grandTotal,
    this.onPlaceOrder,
    this.isLoading = false,
    this.canPlaceOrder = true,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
      decoration: BoxDecoration(
        color: AppColors.background,
        border: Border(
          top: BorderSide(
            color: AppColors.border,
            width: 1,
          ),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
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
                  CurrencyUtils.format(grandTotal),
                  style: AppTypography.bodyL.copyWith(
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            // Place order button
            AppButton.filled(
              text: 'Place order',
              onPressed: canPlaceOrder ? onPlaceOrder : null,
              isFullWidth: true,
              isLoading: isLoading,
            ),
          ],
        ),
      ),
    );
  }
}
