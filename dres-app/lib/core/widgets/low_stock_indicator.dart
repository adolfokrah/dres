import 'package:flutter/material.dart';
import 'package:dres/core/theme/app_typography.dart';

class LowStockIndicator extends StatelessWidget {
  final int stock;
  final int threshold;

  const LowStockIndicator({
    super.key,
    required this.stock,
    this.threshold = 20,
  });

  /// Returns true if stock is low (between 1 and threshold)
  static bool isLowStock(int? stock, {int threshold = 20}) {
    return stock != null && stock > 0 && stock < threshold;
  }

  @override
  Widget build(BuildContext context) {
    if (stock <= 0 || stock >= threshold) {
      return const SizedBox.shrink();
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.red.shade50,
      ),
      child: Text(
        'Only $stock left',
        style: AppTypography.bodyS.copyWith(
          color: Colors.red.shade700,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
