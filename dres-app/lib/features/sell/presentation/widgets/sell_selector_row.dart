import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';

/// Selector row widget for the sell flow
/// Shows label on left, value and chevron on right
/// Used for Category, Brand selection etc.
class SellSelectorRow extends StatelessWidget {
  final String label;
  final String value;
  final VoidCallback onTap;
  final bool hasBoldBorder;

  const SellSelectorRow({
    super.key,
    required this.label,
    required this.value,
    required this.onTap,
    this.hasBoldBorder = false,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        decoration: BoxDecoration(
          border: Border(
            bottom: BorderSide(
              color: AppColors.secondary,
              width: hasBoldBorder ? 10 : 1,
            ),
          ),
        ),
        child: Row(
          children: [
            // Label and Value stacked vertically
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: AppTypography.bodyL.copyWith(
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  if (value.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      value,
                      style: AppTypography.bodyM.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(width: 10),
            // Chevron
            PhosphorIcon(
              PhosphorIcons.caretRight(),
              size: 14,
              color: AppColors.textPrimary,
            ),
          ],
        ),
      ),
    );
  }
}
