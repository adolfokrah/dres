import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/cart_icon_button.dart';
import 'package:dres/core/widgets/notification_bell_icon.dart';
import 'package:dres/l10n/app_localizations.dart';

/// Header variation types
enum HeaderVariant {
  /// Home/Discover style: bell + search bar + cart
  search,

  /// Simple style: back button + title + cart
  simple,

  /// Title with bell: bell + title + cart (for Sell, etc.)
  titleWithBell,

  /// Title only: back button + title + empty space (for Checkout, etc.)
  titleOnly,
}

/// Unified header widget with different variations
class UnifiedHeader extends StatelessWidget {
  const UnifiedHeader._({
    super.key,
    required this.variant,
    this.title,
    this.onNotificationTap,
    this.onCartTap,
    this.onSearchTap,
    this.onBackTap,
    this.notificationCount = 0,
    this.rightWidget,
  });

  /// Search bar header (Home/Discover style)
  /// bell + search bar + cart
  const factory UnifiedHeader.search({
    Key? key,
    VoidCallback? onNotificationTap,
    VoidCallback? onCartTap,
    VoidCallback? onSearchTap,
    int notificationCount,
  }) = _SearchHeader;

  /// Simple header with title
  /// back button + title + cart
  const factory UnifiedHeader.simple({
    Key? key,
    required String title,
    VoidCallback? onBackTap,
    VoidCallback? onCartTap,
  }) = _SimpleHeader;

  /// Title header with bell icon
  /// bell + title + cart (for Sell, etc.)
  const factory UnifiedHeader.titleWithBell({
    Key? key,
    required String title,
    VoidCallback? onNotificationTap,
    VoidCallback? onCartTap,
    int notificationCount,
  }) = _TitleWithBellHeader;

  /// Title only header
  /// back button + title + empty space (for Checkout, etc.)
  const factory UnifiedHeader.titleOnly({
    Key? key,
    required String title,
    VoidCallback? onBackTap,
    Widget? rightWidget,
  }) = _TitleOnlyHeader;

  final HeaderVariant variant;
  final String? title;
  final VoidCallback? onNotificationTap;
  final VoidCallback? onCartTap;
  final VoidCallback? onSearchTap;
  final VoidCallback? onBackTap;
  final int notificationCount;
  final Widget? rightWidget;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      color: AppColors.background,
      child: Row(
        children: [
          // Left widget
          _buildLeftWidget(context),
          const SizedBox(width: 12),
          // Center widget
          Expanded(child: _buildCenterWidget(context)),
          const SizedBox(width: 12),
          // Right widget
          _buildRightWidget(context),
        ],
      ),
    );
  }

  Widget _buildLeftWidget(BuildContext context) {
    switch (variant) {
      case HeaderVariant.search:
      case HeaderVariant.titleWithBell:
        return NotificationBellIcon(
        );
      case HeaderVariant.simple:
      case HeaderVariant.titleOnly:
        return _HeaderIconButton(
          icon: PhosphorIcons.caretLeft(),
          onTap: onBackTap ?? () => _handleBack(context),
        );
    }
  }

  Widget _buildCenterWidget(BuildContext context) {
    switch (variant) {
      case HeaderVariant.search:
        final l10n = AppLocalizations.of(context)!;
        return GestureDetector(
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
        );
      case HeaderVariant.simple:
      case HeaderVariant.titleWithBell:
      case HeaderVariant.titleOnly:
        return Text(
          title ?? '',
          style: AppTypography.bodyL.copyWith(color: AppColors.textPrimary),
          textAlign: TextAlign.center,
        );
    }
  }

  Widget _buildRightWidget(BuildContext context) {
    switch (variant) {
      case HeaderVariant.search:
      case HeaderVariant.simple:
      case HeaderVariant.titleWithBell:
        return CartIconButton(onTap: onCartTap);
      case HeaderVariant.titleOnly:
        return rightWidget ?? const SizedBox(width: 40);
    }
  }

  void _handleBack(BuildContext context) {
    if (context.canPop()) {
      context.pop();
    } else {
      context.go('/home');
    }
  }
}

// Private constructors for each variant

class _SearchHeader extends UnifiedHeader {
  const _SearchHeader({
    super.key,
    VoidCallback? onNotificationTap,
    VoidCallback? onCartTap,
    VoidCallback? onSearchTap,
    int notificationCount = 0,
  }) : super._(
         variant: HeaderVariant.search,
         onNotificationTap: onNotificationTap,
         onCartTap: onCartTap,
         onSearchTap: onSearchTap,
         notificationCount: notificationCount,
       );
}

class _SimpleHeader extends UnifiedHeader {
  const _SimpleHeader({
    super.key,
    required String title,
    VoidCallback? onBackTap,
    VoidCallback? onCartTap,
  }) : super._(
         variant: HeaderVariant.simple,
         title: title,
         onBackTap: onBackTap,
         onCartTap: onCartTap,
       );
}

class _TitleWithBellHeader extends UnifiedHeader {
  const _TitleWithBellHeader({
    super.key,
    required String title,
    VoidCallback? onNotificationTap,
    VoidCallback? onCartTap,
    int notificationCount = 0,
  }) : super._(
         variant: HeaderVariant.titleWithBell,
         title: title,
         onNotificationTap: onNotificationTap,
         onCartTap: onCartTap,
         notificationCount: notificationCount,
       );
}

class _TitleOnlyHeader extends UnifiedHeader {
  const _TitleOnlyHeader({
    super.key,
    required String title,
    VoidCallback? onBackTap,
    Widget? rightWidget,
  }) : super._(
         variant: HeaderVariant.titleOnly,
         title: title,
         onBackTap: onBackTap,
         rightWidget: rightWidget,
       );
}

/// Reusable header icon button (for back button, etc.)
class _HeaderIconButton extends StatelessWidget {
  const _HeaderIconButton({
    required this.icon,
    this.onTap,
  });

  final PhosphorIconData icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: 40,
        height: 40,
        child: Center(
          child: PhosphorIcon(icon, color: AppColors.textPrimary, size: 24),
        ),
      ),
    );
  }
}
