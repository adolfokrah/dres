import 'package:flutter/material.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';

class BadgeWidget extends StatelessWidget {
  final String text;
  final Color? backgroundColor;
  final Color? borderColor;
  final Color? textColor;

  const BadgeWidget({
    super.key,
    required this.text,
    this.backgroundColor,
    this.borderColor,
    this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 5,
        vertical: 5,
      ),
      decoration: BoxDecoration(
        color: backgroundColor ?? AppColors.primary
      ),
      child: Text(
        text.toUpperCase(),
        style: AppTypography.bodyXS.copyWith(
          fontWeight: FontWeight.w500,
          color: textColor ?? Colors.white,
        ),
      ),
    );
  }
}
