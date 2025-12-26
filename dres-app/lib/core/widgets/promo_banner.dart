import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';

class PromoBanner extends StatelessWidget {
  const PromoBanner({
    super.key,
    required this.title,
    required this.description,
    required this.actionText,
    this.backgroundColor = 'light',
    this.onActionTap,
    this.onDismiss,
  });

  final String title;
  final String description;
  final String actionText;
  final String backgroundColor;
  final VoidCallback? onActionTap;
  final VoidCallback? onDismiss;

  Color _getBackgroundColor() {
    switch (backgroundColor) {
      case 'white':
        return AppColors.background;
      case 'info':
        return AppColors.info;
      case 'success':
        return AppColors.success;
      case 'warning':
        return AppColors.warning;
      case 'error':
        return AppColors.error;
      case 'light':
      default:
        return AppColors.secondary;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _getBackgroundColor(),
        borderRadius: BorderRadius.circular(0),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Title
          Text(
            title,
            style: AppTypography.titleXL.copyWith(
              color: AppColors.textPrimary,
              fontSize: 28,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          // Description
          Text(
            description,
            style: AppTypography.bodyL.copyWith(
              color: AppColors.textPrimary,
              fontSize: 17,
            ),
          ),
          const SizedBox(height: 12),
          // Action button
          GestureDetector(
            onTap: onActionTap,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  actionText,
                  style: AppTypography.bodyL.copyWith(
                    color: AppColors.textPrimary,
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(width: 8),
                PhosphorIcon(
                  PhosphorIcons.arrowRight(),
                  color: AppColors.textPrimary,
                  size: 22,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
