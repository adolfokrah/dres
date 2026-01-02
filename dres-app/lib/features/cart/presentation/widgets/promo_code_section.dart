import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/app_text_field.dart';
import 'package:dres/core/widgets/app_button.dart';

/// Promo code input section for checkout
class PromoCodeSection extends StatelessWidget {
  final TextEditingController controller;
  final VoidCallback? onApply;
  final String? appliedCode;
  final double? discountAmount;
  final bool isLoading;

  const PromoCodeSection({
    super.key,
    required this.controller,
    this.onApply,
    this.appliedCode,
    this.discountAmount,
    this.isLoading = false,
  });

  bool get hasPromoApplied => appliedCode != null && discountAmount != null && discountAmount! > 0;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Show applied promo or input field
          if (hasPromoApplied) ...[
            // Applied promo display
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.success.withOpacity(0.1),
                border: Border.all(color: AppColors.success.withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  PhosphorIcon(
                    PhosphorIconsFill.checkCircle,
                    color: AppColors.success,
                    size: 24,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Promo code applied',
                          style: AppTypography.bodyS.copyWith(
                            color: AppColors.success,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '"${appliedCode!.toUpperCase()}" - GHS ${discountAmount!.toStringAsFixed(2)} off',
                          style: AppTypography.bodyM.copyWith(
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ] else ...[
            // Promo code input
            AppTextField(
              controller: controller,
              label: 'Promo code (optional)',
              hintText: 'eg. welcome',
              enabled: !isLoading,
            ),

            const SizedBox(height: 5),

            // Apply Promo button
            AppButton.outlined(
              text: isLoading ? 'Applying...' : 'Apply Promo',
              onPressed: isLoading ? null : onApply,
              isFullWidth: true,
            ),
          ],

          const SizedBox(height: 5),

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
