import 'package:flutter/material.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/features/variations/presentation/view/photo_tips_screen.dart';

/// Reusable link widget to navigate to photo tips screen
class PhotoTipsLink extends StatelessWidget {
  const PhotoTipsLink({super.key});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => const PhotoTipsScreen(),
          ),
        );
      },
      child: Row(
        children: [
          Text(
            'Read our photo tips',
            style: AppTypography.bodyM.copyWith(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(width: 8),
          Container(
            width: 20,
            height: 20,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: AppColors.textPrimary,
                width: 1,
              ),
            ),
            child: Center(
              child: Text(
                'i',
                style: AppTypography.bodyS.copyWith(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.w600,
                  fontSize: 12,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
