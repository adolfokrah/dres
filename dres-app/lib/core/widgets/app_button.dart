import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';

enum AppButtonVariant { filled, outlined }

class AppButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final AppButtonVariant variant;
  final bool isLoading;
  final bool isFullWidth;
  final EdgeInsetsGeometry? padding;
  final double? width;
  final double? height;
  final Color? backgroundColor;
  final Color? textColor;
  final Color? borderColor;
  final Widget? icon;

  const AppButton({
    super.key,
    required this.text,
    this.onPressed,
    this.variant = AppButtonVariant.filled,
    this.isLoading = false,
    this.isFullWidth = false,
    this.padding,
    this.width,
    this.height,
    this.backgroundColor,
    this.textColor,
    this.borderColor,
    this.icon,
  });

  const AppButton.filled({
    super.key,
    required this.text,
    this.onPressed,
    this.isLoading = false,
    this.isFullWidth = false,
    this.padding,
    this.width,
    this.height,
    this.backgroundColor,
    this.textColor,
    this.icon,
  })  : variant = AppButtonVariant.filled,
        borderColor = null;

  const AppButton.outlined({
    super.key,
    required this.text,
    this.onPressed,
    this.isLoading = false,
    this.isFullWidth = false,
    this.padding,
    this.width,
    this.height,
    this.textColor,
    this.borderColor,
    this.icon,
  })  : variant = AppButtonVariant.outlined,
        backgroundColor = null;

  @override
  Widget build(BuildContext context) {
    final bool isDisabled = onPressed == null || isLoading;

    if (variant == AppButtonVariant.filled) {
      return SizedBox(
        width: isFullWidth ? double.infinity : width,
        height: height ?? 48,
        child: ElevatedButton(
          onPressed: isDisabled ? null : onPressed,
          style: ElevatedButton.styleFrom(
            backgroundColor: isDisabled 
                ? AppColors.disabled 
                : (backgroundColor ?? AppColors.primary),
            foregroundColor: textColor ?? AppColors.textOnPrimary,
            elevation: 0,
            padding: padding ??
                const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 12,
                ),
            shape: const RoundedRectangleBorder(
              borderRadius: BorderRadius.zero,
            ),
          ),
          child: isLoading
              ? SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      textColor ?? AppColors.textOnPrimary,
                    ),
                  ),
                )
              : Row(
                  mainAxisSize: MainAxisSize.min,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (icon != null) ...[
                      icon!,
                      const SizedBox(width: 12),
                    ],
                    Flexible(
                      child: Text(
                        text,
                        style: AppTypography.bodyM.copyWith(
                          fontWeight: FontWeight.w600,
                          color: textColor ?? AppColors.textOnPrimary,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
        ),
      );
    }

    // Outlined variant
    return SizedBox(
      width: isFullWidth ? double.infinity : width,
      height: height ?? 48,
      child: OutlinedButton(
        onPressed: isDisabled ? null : onPressed,
        style: OutlinedButton.styleFrom(
          foregroundColor: isDisabled 
              ? AppColors.disabled 
              : (textColor ?? AppColors.textPrimary),
          side: BorderSide(
            color: isDisabled 
                ? AppColors.disabled 
                : (borderColor ?? AppColors.textPrimary),
            width: 1,
          ),
          elevation: 0,
          padding: padding ??
              const EdgeInsets.symmetric(
                horizontal: 24,
                vertical: 12,
              ),
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.zero,
          ),
        ),
        child: isLoading
            ? SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(
                    isDisabled 
                        ? AppColors.disabled 
                        : (textColor ?? AppColors.textPrimary),
                  ),
                ),
              )
            : Row(
                mainAxisSize: MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (icon != null) ...[
                    icon!,
                    const SizedBox(width: 8),
                  ],
                  Text(
                    text,
                    style: AppTypography.bodyM.copyWith(
                      fontWeight: FontWeight.w600,
                      color: textColor ?? AppColors.textPrimary,
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}
