import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';

class PromoBanner extends StatelessWidget {
  const PromoBanner({
    super.key,
    required this.title,
    required this.description,
    this.actionLabel,
    this.backgroundColor = 'light',
    this.path,
    this.onActionTap,
    this.onDismiss,
  });

  final String title;
  final String description;
  final String? actionLabel;
  final String backgroundColor;
  final String? path;
  final VoidCallback? onActionTap;
  final VoidCallback? onDismiss;

  Color _getBackgroundColor() {
    switch (backgroundColor) {
      case 'white':
        return AppColors.background;
      case 'info':
        return AppColors.promoInfo;
      case 'success':
        return AppColors.promoSuccess;
      case 'warning':
        return AppColors.promoWarning;
      case 'error':
        return AppColors.promoError;
      case 'light':
      default:
        return AppColors.secondary;
    }
  }

  Color _getTextColor() {
    // All promo backgrounds are pastel/light so use dark text
    return AppColors.textPrimary;
  }

  @override
  Widget build(BuildContext context) {
    final textColor = _getTextColor();
    
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(top: 16),
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
              color: textColor,
              fontSize: 28,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          // Description
          Text(
            description,
            style: AppTypography.bodyL.copyWith(
              color: textColor,
              fontSize: 17,
            ),
          ),
          const SizedBox(height: 12),
          // Action button - only show if there's a label or path
          if (actionLabel != null && actionLabel!.isNotEmpty)
            GestureDetector(
              onTap: () {
                if (onActionTap != null) {
                  onActionTap!();
                } else if (path != null && path!.isNotEmpty) {
                  context.push(path!);
                }
              },
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    actionLabel!,
                    style: AppTypography.bodyL.copyWith(
                      color: textColor,
                      fontSize: 17,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(width: 8),
                  PhosphorIcon(
                    PhosphorIcons.arrowRight(),
                    color: textColor,
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
