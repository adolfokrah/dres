import 'package:flutter/material.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/app_button.dart';
import 'package:dres/core/utilities/currency_utils.dart';

/// Fixed bottom bar showing subtotal and Next button
class CartSummary extends StatelessWidget {
  final double subtotal;
  final bool hasUnavailableItems;
  final VoidCallback? onNextPressed;

  const CartSummary({
    super.key,
    required this.subtotal,
    this.hasUnavailableItems = false,
    this.onNextPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.secondary,
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Subtotal row
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
                CurrencyUtils.format(subtotal),
                style: AppTypography.bodyL.copyWith(
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          // Next button
          AppButton.filled(
            text: 'NEXT',
            onPressed: hasUnavailableItems ? null : onNextPressed,
            width: double.infinity,
          ),
        ],
      ),
    );
  }
}
