import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/core/services/storage_service.dart';
import 'package:dres/features/auth/logic/auth_bloc/auth_bloc.dart';
import 'package:dres/features/notifications/logic/notifications_bloc/notifications_bloc.dart';

/// A reusable notification bell icon button widget for headers
/// Displays a bell icon and shows unread count badge from NotificationsBloc
/// Checks authentication before navigating to notifications
class NotificationBellIcon extends StatelessWidget {
  /// Optional callback when tapped. If null, navigates to notifications route.

  /// Icon size (default: 24)
  final double size;

  /// Icon color (default: AppColors.textPrimary)
  final Color? color;

  /// Route to redirect to after authentication (default: /notifications)
  final String redirectTo;

  const NotificationBellIcon({
    super.key,
    this.size = 24,
    this.color,
    this.redirectTo = '/notifications',
  });

  Future<void> _handleTap(BuildContext context) async {
    // Check if user is logged in before navigating to notifications
    final storageService = getIt<StorageService>();
    final isLoggedIn = await storageService.isLoggedIn();

    if (!context.mounted) return;

    if (!isLoggedIn) {
      // Not logged in - set redirect in bloc and go to auth
      context.read<AuthBloc>().add(AuthSetRedirect(redirectTo));
      context.push('/auth');
      return;
    }

    context.push(redirectTo);
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<NotificationsBloc, NotificationsState>(
      bloc: getIt<NotificationsBloc>(),
      builder: (context, state) {
        final unreadCount = state.unreadCount;

        return GestureDetector(
          onTap: () => _handleTap(context),
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              Icon(
                PhosphorIcons.bellSimple(),
                size: size,
                color: color ?? AppColors.textPrimary,
              ),
              if (unreadCount > 0)
                Positioned(
                  right: -6,
                  top: -4,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: AppColors.primary,
                      shape: BoxShape.circle,
                    ),
                    constraints: const BoxConstraints(
                      minWidth: 16,
                      minHeight: 16,
                    ),
                    child: Text(
                      unreadCount > 99 ? '99+' : unreadCount.toString(),
                      style: const TextStyle(
                        color: AppColors.textOnPrimary,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}
