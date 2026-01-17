import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/app_info_banner.dart';

class SellerUnavailableMessage extends StatelessWidget {
  final String message;
  final bool isWarning;

  const SellerUnavailableMessage({
    super.key,
    this.message = "The seller can't ship these items at this time.",
    this.isWarning = false,
  });

  @override
  Widget build(BuildContext context) {
    if (isWarning) {
      return AppInfoBanner.warning(text: message);
    }
    
    // Default info style (gray background)
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: const BoxDecoration(
        color: AppColors.secondary,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            PhosphorIcons.info(),
            size: 16,
            color: AppColors.textPrimary,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: AppTypography.bodyL.copyWith(
                color: AppColors.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
