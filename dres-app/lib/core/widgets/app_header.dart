import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/cart_icon_button.dart';
import 'package:dres/l10n/app_localizations.dart';

class AppHeader extends StatelessWidget {
  const AppHeader({
    super.key,
    this.onNotificationTap,
    this.onCartTap,
    this.onSearchTap,
    this.onBackTap,
    this.showBackButton = false,
    this.notificationCount = 0,
  });

  final VoidCallback? onNotificationTap;
  final VoidCallback? onCartTap;
  final VoidCallback? onSearchTap;
  final VoidCallback? onBackTap;
  final bool showBackButton;
  final int notificationCount;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      color: AppColors.background,
      child: Row(
        children: [
          // Back button or Notification bell
          showBackButton
              ? _HeaderIconButton(
                  icon: PhosphorIcons.caretLeft(),
                  onTap: onBackTap,
                )
              : _HeaderIconButton(
                  icon: PhosphorIcons.bellSimple(),
                  onTap: onNotificationTap,
                  badgeCount: notificationCount,
                ),
          
          const SizedBox(width: 12),
          
          // Search bar
          Expanded(
            child: GestureDetector(
              onTap: onSearchTap,
              child: Container(
                height: 40,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                decoration: BoxDecoration(
                  color: AppColors.secondary,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  children: [
                    PhosphorIcon(
                      PhosphorIcons.magnifyingGlass(),
                      color: AppColors.textHint,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        l10n.searchPlaceholder,
                        style: AppTypography.bodyL.copyWith(
                          color: AppColors.textHint,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          
          const SizedBox(width: 12),
          
          // Cart/bag icon with auth check (count from CartBloc)
          CartIconButton(
            onTap: onCartTap,
          ),
        ],
      ),
    );
  }
}

class _HeaderIconButton extends StatelessWidget {
  const _HeaderIconButton({
    required this.icon,
    this.onTap,
    this.badgeCount = 0,
  });

  final PhosphorIconData icon;
  final VoidCallback? onTap;
  final int badgeCount;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: 40,
        height: 40,
        child: Stack(
          alignment: Alignment.center,
          children: [
            PhosphorIcon(
              icon,
              color: AppColors.textPrimary,
              size: 24,
            ),
            if (badgeCount > 0)
              Positioned(
                top: 4,
                right: 4,
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: const BoxDecoration(
                    color: AppColors.error,
                    shape: BoxShape.circle,
                  ),
                  constraints: const BoxConstraints(
                    minWidth: 16,
                    minHeight: 16,
                  ),
                  child: Text(
                    badgeCount > 99 ? '99+' : badgeCount.toString(),
                    style: AppTypography.bodyXS.copyWith(
                      color: AppColors.textOnPrimary,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
