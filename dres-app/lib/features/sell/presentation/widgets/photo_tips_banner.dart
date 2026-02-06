import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/features/sell/presentation/widgets/photo_tips_link.dart';

/// Banner that shows photo tips with tag examples
class PhotoTipsBanner extends StatelessWidget {
  const PhotoTipsBanner({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(20, 20, 20, 0),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.background,
        border: Border.all(
          color: AppColors.primaryLight.withValues(alpha: 0.2),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Title
          Row(
            children: [
              PhosphorIcon(
                PhosphorIcons.camera(PhosphorIconsStyle.fill),
                size: 20,
                color: AppColors.primary,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Include photos of tags & labels',
                  style: AppTypography.bodyM.copyWith(
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),

          // Photo placeholders row
          _buildPhotoPlaceholder(
                imagePath: 'assets/images/authentic-labels/main.png',
          ),

          const SizedBox(height: 12),

          // Description text
          Text(
            'Clear photos of brand tags and labels help buyers trust your listing and make it easier to sell.',
            style: AppTypography.bodyS.copyWith(
              color: AppColors.textSecondary,
              height: 1.4,
            ),
          ),

          const SizedBox(height: 12),

          // Photo tips link
          const PhotoTipsLink(),
        ],
      ),
    );
  }

  Widget _buildPhotoPlaceholder({
    required String imagePath,
  }) {
    return Container(
      width: double.infinity,
      height: 80,
      child: ClipRect(
        child: Image.asset(
          imagePath,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) {
            print('❌ Failed to load image: $imagePath');
            print('Error: $error');
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  PhosphorIcon(
                    PhosphorIcons.image(),
                    size: 32,
                    color: AppColors.textSecondary,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Image\nError',
                    textAlign: TextAlign.center,
                    style: AppTypography.bodyXS.copyWith(
                      color: AppColors.textSecondary,
                      fontSize: 8,
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}
