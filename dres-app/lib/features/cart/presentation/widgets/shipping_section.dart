import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';

/// Shipping address section for checkout
class ShippingSection extends StatelessWidget {
  final String customerName;
  final String address;
  final String? phone;
  final VoidCallback? onTap;

  const ShippingSection({
    super.key,
    required this.customerName,
    required this.address,
    this.phone,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: const BoxDecoration(
          color: AppColors.background,
          border: Border(
            bottom: BorderSide(
              color: AppColors.secondary,
              width: 1,
            ),
          ),
        ),
        child: Row(
          children: [
            // Shipping info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Section number and title
                  Text(
                    '1. Shipping',
                    style: AppTypography.bodyL.copyWith(
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 11),
                  // Customer name
                  Text(
                    customerName,
                    style: AppTypography.bodyM.copyWith(
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                      height: 1.5,
                    ),
                  ),
                  // Address
                  Text(
                    address,
                    style: AppTypography.bodyM.copyWith(
                      color: AppColors.textPrimary,
                      height: 1.5,
                    ),
                  ),
                  // Phone (if provided)
                  if (phone != null && phone!.isNotEmpty)
                    Text(
                      phone!,
                      style: AppTypography.bodyM.copyWith(
                        color: AppColors.textPrimary,
                        height: 1.5,
                      ),
                    ),
                ],
              ),
            ),

            // Chevron right
            Icon(
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
