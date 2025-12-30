import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/app_text_field.dart';

/// Promo code input section for checkout
class PromoCodeSection extends StatelessWidget {
  final TextEditingController controller;
  final VoidCallback? onApply;
  final String? appliedCode;

  const PromoCodeSection({
    super.key,
    required this.controller,
    this.onApply,
    this.appliedCode,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Promo code input using AppTextField
          AppTextField(
            controller: controller,
            label: 'Promo code (optional)',
            hintText: 'eg. welcome',
            suffixIcon: appliedCode != null
                ? const Icon(
                    Icons.check_circle,
                    color: AppColors.success,
                    size: 20,
                  )
                : null,
          ),

          const SizedBox(height: 20),

          // Terms text
          RichText(
            text: TextSpan(
              style: AppTypography.bodyM.copyWith(
                color: AppColors.textPrimary,
              ),
              children: [
                const TextSpan(
                  text: 'By placing your order, you agree to our ',
                ),
                TextSpan(
                  text: 'Buyer Terms & Conditions',
                  style: AppTypography.bodyM.copyWith(
                    color: AppColors.textPrimary,
                    decoration: TextDecoration.underline,
                  ),
                  recognizer: TapGestureRecognizer()
                    ..onTap = () {
                      // TODO: Open terms and conditions
                    },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
