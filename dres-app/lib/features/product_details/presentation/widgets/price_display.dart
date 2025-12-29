import 'package:dres/core/theme/theme.dart';
import 'package:flutter/material.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/features/product_details/data/models/product_details_model.dart';

class PriceDisplay extends StatelessWidget {
  final List<SkuModel> skus;
  final String? selectedSkuId;

  const PriceDisplay({
    super.key,
    required this.skus,
    this.selectedSkuId,
  });

  SkuModel? get _selectedSku {
    if (selectedSkuId == null || skus.isEmpty) return null;
    try {
      return skus.firstWhere((sku) => sku.id == selectedSkuId);
    } catch (e) {
      return skus.first; // Fallback to first SKU
    }
  }

  @override
  Widget build(BuildContext context) {
    final sku = _selectedSku;
    if (sku == null) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Compare at price (if available)
        if (sku.compareAtPrice != null) ...[
          Text(
            'GHS ${sku.compareAtPrice!.toStringAsFixed(2)}',
            style: AppTypography.bodyL.copyWith(
              decoration: TextDecoration.lineThrough,
              color: AppColors.textHint,
              fontWeight: FontWeight.bold,
              fontSize: 24,
            ),
          ),
          const SizedBox(height: 10),
        ],

        // Current price
        Text(
          'GHS ${sku.price.toStringAsFixed(2)}',
          style: AppTypography.bodyL.copyWith(
            fontWeight: FontWeight.w700,
            fontSize: 24,
            color: sku.compareAtPrice != null ? Colors.red : AppColors.textPrimary,
          ),
        ),
      ],
    );
  }
}
