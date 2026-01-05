import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/l10n/app_localizations.dart';

/// Shopping preference option
class ShoppingPreferenceOption {
  final String value;
  final String label;

  const ShoppingPreferenceOption({
    required this.value,
    required this.label,
  });
}

/// Bottom sheet for selecting shopping preference (Women/Men)
class ShoppingPreferenceSheet extends StatelessWidget {
  final String? currentPreference;

  const ShoppingPreferenceSheet({
    super.key,
    this.currentPreference,
  });

  /// Show the shopping preference bottom sheet
  static Future<String?> show(
    BuildContext context, {
    String? currentPreference,
  }) {
    return showModalBottomSheet<String>(
      context: context,
      backgroundColor: AppColors.background,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.zero,
      ),
      builder: (context) => ShoppingPreferenceSheet(
        currentPreference: currentPreference,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    final options = [
      ShoppingPreferenceOption(value: 'women', label: l10n.women),
      ShoppingPreferenceOption(value: 'men', label: l10n.men),
    ];

    return SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  l10n.shoppingPreference,
                  style: AppTypography.bodyL.copyWith(
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                GestureDetector(
                  onTap: () => Navigator.of(context).pop(),
                  child: PhosphorIcon(
                    PhosphorIcons.x(),
                    size: 20,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: AppColors.divider),

          // Options
          ...options.map((option) {
            final isSelected = currentPreference == option.value;
            return InkWell(
              onTap: () => Navigator.of(context).pop(option.value),
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 16,
                ),
                decoration: BoxDecoration(
                  border: Border(
                    bottom: BorderSide(
                      color: AppColors.divider,
                      width: 1,
                    ),
                  ),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        option.label,
                        style: AppTypography.bodyM.copyWith(
                          color: AppColors.textPrimary,
                          fontWeight:
                              isSelected ? FontWeight.w600 : FontWeight.w400,
                        ),
                      ),
                    ),
                    if (isSelected)
                      PhosphorIcon(
                        PhosphorIcons.check(),
                        size: 20,
                        color: AppColors.textPrimary,
                      ),
                  ],
                ),
              ),
            );
          }),

          const SizedBox(height: 16),
        ],
      ),
    );
  }
}
