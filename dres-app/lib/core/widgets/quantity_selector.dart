import 'package:flutter/material.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';

/// A quantity selector widget with decrement, quantity display, and increment buttons
/// Used in product details and cart screens
class QuantitySelector extends StatelessWidget {
  final int quantity;
  final bool isLoading;
  final int? maxStock;
  final VoidCallback? onDecrement;
  final VoidCallback? onIncrement;
  final double height;

  const QuantitySelector({
    super.key,
    required this.quantity,
    this.isLoading = false,
    this.maxStock,
    this.onDecrement,
    this.onIncrement,
    this.height = 45, // Same as AppButton
  });

  @override
  Widget build(BuildContext context) {
    final canDecrement = quantity > 1;
    final canIncrement = maxStock == null || quantity < maxStock!;

    return Container(
      height: height,
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.textPrimary, width: 1),
      ),
      child: Row(
        children: [
          // Decrement button
          Expanded(
            child: InkWell(
              onTap: isLoading || !canDecrement ? null : onDecrement,
              child: Container(
                height: double.infinity,
                alignment: Alignment.center,
                child: isLoading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Text(
                        '−',
                        style: AppTypography.titleL.copyWith(
                          color: canDecrement
                              ? AppColors.textPrimary
                              : AppColors.textSecondary,
                        ),
                      ),
              ),
            ),
          ),
          
          // Left divider
          Container(
            width: 1,
            height: double.infinity,
            color: AppColors.textPrimary,
          ),
          
          // Quantity display
          Expanded(
            child: Container(
              alignment: Alignment.center,
              child: Text(
                '$quantity',
                style: AppTypography.bodyL.copyWith(
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
            ),
          ),
          
          // Right divider
          Container(
            width: 1,
            height: double.infinity,
            color: AppColors.textPrimary,
          ),
          
          // Increment button
          Expanded(
            child: InkWell(
              onTap: isLoading || !canIncrement ? null : onIncrement,
              child: Container(
                height: double.infinity,
                alignment: Alignment.center,
                child: Text(
                  '+',
                  style: AppTypography.titleL.copyWith(
                    color: canIncrement 
                        ? AppColors.textPrimary 
                        : AppColors.textSecondary,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
