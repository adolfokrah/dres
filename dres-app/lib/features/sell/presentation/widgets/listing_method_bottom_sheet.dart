import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';

class ListingMethodBottomSheet extends StatelessWidget {
  const ListingMethodBottomSheet({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surface,
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle bar
            Container(
              margin: const EdgeInsets.only(top: 12),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.textHint.withAlpha(76),
              ),
            ),
            const SizedBox(height: 24),
            // Title
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Text(
                'How would you like to create your listing?',
                style: AppTypography.titleLM.copyWith(
                  color: AppColors.textPrimary,
                ),
                textAlign: TextAlign.center,
              ),
            ),
            const SizedBox(height: 24),
            // Manual option
            _ListingMethodOption(
              icon: PhosphorIcons.note(),
              title: 'Manually create listing',
              description: 'Enter details step-by-step',
              onTap: () => Navigator.of(context).pop('manual'),
            ),
            const SizedBox(height: 12),
            // AI option
            _ListingMethodOption(
              icon: PhosphorIcons.sparkle(),
              title: 'Create listing with AI',
              description: 'Upload photos and let AI do the work',
              onTap: () => Navigator.of(context).pop('ai'),
              highlighted: true,
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}

class _ListingMethodOption extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;
  final VoidCallback onTap;
  final bool highlighted;

  const _ListingMethodOption({
    required this.icon,
    required this.title,
    required this.description,
    required this.onTap,
    this.highlighted = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Material(
        color: highlighted
            ? AppColors.primary.withAlpha(13)
            : AppColors.background,
        child: InkWell(
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              border: Border.all(
                color: highlighted
                    ? AppColors.primary
                    : AppColors.border,
                width: highlighted ? 2 : 1,
              ),
            ),
            child: Row(
              children: [
                // Icon
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: highlighted
                        ? AppColors.primary
                        : AppColors.surface,
                  ),
                  child: Center(
                    child: PhosphorIcon(
                      icon,
                      size: 24,
                      color: highlighted
                          ? AppColors.textOnPrimary
                          : AppColors.textPrimary,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                // Text content
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: AppTypography.bodyM.copyWith(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.w500,
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        description,
                        style: AppTypography.bodyS.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                // Arrow
                PhosphorIcon(
                  PhosphorIcons.caretRight(),
                  size: 20,
                  color: AppColors.textHint,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
