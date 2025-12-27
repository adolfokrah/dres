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

  const AppButton({
    Key? key,
    required this.text,
    this.onPressed,
    this.variant = AppButtonVariant.filled,
    this.isLoading = false,
    this.isFullWidth = false,
    this.padding,
    this.width,
    this.height,
  }) : super(key: key);

  const AppButton.filled({
    Key? key,
    required this.text,
    this.onPressed,
    this.isLoading = false,
    this.isFullWidth = false,
    this.padding,
    this.width,
    this.height,
  })  : variant = AppButtonVariant.filled,
        super(key: key);

  const AppButton.outlined({
    Key? key,
    required this.text,
    this.onPressed,
    this.isLoading = false,
    this.isFullWidth = false,
    this.padding,
    this.width,
    this.height,
  })  : variant = AppButtonVariant.outlined,
        super(key: key);

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
            backgroundColor: isDisabled ? AppColors.disabled : AppColors.primary,
            foregroundColor: AppColors.textOnPrimary,
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
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(AppColors.textOnPrimary),
                  ),
                )
              : Text(
                  text,
                  style: AppTypography.bodyM.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
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
          foregroundColor: isDisabled ? AppColors.disabled : AppColors.textPrimary,
          side: BorderSide(
            color: isDisabled ? AppColors.disabled : AppColors.textPrimary,
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
                    isDisabled ? AppColors.disabled : AppColors.textPrimary,
                  ),
                ),
              )
            : Text(
                text,
                style: AppTypography.bodyM.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
      ),
    );
  }
}
