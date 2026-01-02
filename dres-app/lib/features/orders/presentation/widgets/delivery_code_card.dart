import 'package:flutter/material.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';

/// Card showing the delivery PIN code for the order
class DeliveryCodeCard extends StatelessWidget {
  final String code;

  const DeliveryCodeCard({super.key, required this.code});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: const BoxDecoration(
        color: AppColors.background,
        border: Border(
          bottom: BorderSide(color: AppColors.secondary, width: 1),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            'Your delivery pin',
            style: AppTypography.bodyL.copyWith(color: AppColors.textPrimary),
          ),
          Row(
            children: code
                .split('')
                .map((digit) => _PinBox(digit: digit))
                .toList(),
          ),
        ],
      ),
    );
  }
}

/// Individual PIN box with digit
class _PinBox extends StatelessWidget {
  final String digit;

  const _PinBox({required this.digit});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 41,
      height: 34,
      margin: const EdgeInsets.only(left: 2),
      decoration: BoxDecoration(
        color: AppColors.textPrimary,
        border: Border.all(color: AppColors.textPrimary, width: 1),
      ),
      child: Center(
        child: Text(
          digit,
          style: AppTypography.bodyL.copyWith(
            fontWeight: FontWeight.w700,
            color: Colors.white,
          ),
        ),
      ),
    );
  }
}
