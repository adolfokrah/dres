import 'package:flutter/material.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/utilities/currency_utils.dart';

/// Shows item count total - part of the scrollable content
class CartTotalsSection extends StatelessWidget {
  final int itemCount;
  final double itemsTotal;

  const CartTotalsSection({
    super.key,
    required this.itemCount,
    required this.itemsTotal,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      color: AppColors.secondary,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            '$itemCount ${itemCount == 1 ? 'item' : 'items'}',
            style: AppTypography.bodyM.copyWith(color: AppColors.textPrimary),
          ),
          Text(
            CurrencyUtils.format(itemsTotal),
            style: AppTypography.bodyM.copyWith(color: AppColors.textPrimary),
          ),
        ],
      ),
    );
  }
}
