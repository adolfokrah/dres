import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';

enum InfoBannerType {
  info,
  warning,
  success,
  error,
}

class AppInfoBanner extends StatelessWidget {
  final String text;
  final InfoBannerType type;
  final String? title;
  final IconData? customIcon;

  const AppInfoBanner({
    super.key,
    required this.text,
    this.type = InfoBannerType.info,
    this.title,
    this.customIcon,
  });

  /// Factory constructor for info banners (default blue style)
  const AppInfoBanner.info({
    super.key,
    required this.text,
    this.title,
    this.customIcon,
  }) : type = InfoBannerType.info;

  /// Factory constructor for warning banners (yellow style)
  const AppInfoBanner.warning({
    super.key,
    required this.text,
    this.title,
    this.customIcon,
  }) : type = InfoBannerType.warning;

  /// Factory constructor for success banners (green style)
  const AppInfoBanner.success({
    super.key,
    required this.text,
    this.title,
    this.customIcon,
  }) : type = InfoBannerType.success;

  /// Factory constructor for error banners (red style)
  const AppInfoBanner.error({
    super.key,
    required this.text,
    this.title,
    this.customIcon,
  }) : type = InfoBannerType.error;

  Color get _backgroundColor {
    switch (type) {
      case InfoBannerType.info:
        return AppColors.primary.withValues(alpha: 0.05);
      case InfoBannerType.warning:
        return const Color(0xFFFFF3C4); // Light yellow
      case InfoBannerType.success:
        return AppColors.success.withValues(alpha: 0.05);
      case InfoBannerType.error:
        return AppColors.error.withValues(alpha: 0.05);
    }
  }

  Color get _borderColor {
    switch (type) {
      case InfoBannerType.info:
        return AppColors.primary.withValues(alpha: 0.2);
      case InfoBannerType.warning:
        return const Color(0xFFEAB308); // Yellow
      case InfoBannerType.success:
        return AppColors.success.withValues(alpha: 0.3);
      case InfoBannerType.error:
        return AppColors.error.withValues(alpha: 0.3);
    }
  }

  Color get _iconColor {
    switch (type) {
      case InfoBannerType.info:
        return AppColors.primary;
      case InfoBannerType.warning:
        return const Color(0xFFEAB308); // Yellow
      case InfoBannerType.success:
        return AppColors.success;
      case InfoBannerType.error:
        return AppColors.error;
    }
  }

  IconData get _defaultIcon {
    if (customIcon != null) return customIcon!;
    
    switch (type) {
      case InfoBannerType.info:
        return PhosphorIconsFill.lightbulb;
      case InfoBannerType.warning:
        return PhosphorIconsFill.warning;
      case InfoBannerType.success:
        return PhosphorIconsFill.checkCircle;
      case InfoBannerType.error:
        return PhosphorIconsFill.xCircle;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _backgroundColor,
        border: Border.all(color: _borderColor),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          PhosphorIcon(
            _defaultIcon,
            size: 20,
            color: _iconColor,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                if (title != null) ...[
                  Text(
                    title!,
                    style: AppTypography.bodyL.copyWith(
                      fontWeight: FontWeight.w600,
                      color: _iconColor,
                    ),
                  ),
                  const SizedBox(height: 4),
                ],
                Text(
                  text,
                  style: AppTypography.bodyM.copyWith(
                    color: AppColors.textSecondary,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}