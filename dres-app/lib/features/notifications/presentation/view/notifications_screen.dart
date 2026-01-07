import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/features/notifications/data/models/notification_model.dart';
import 'package:dres/features/notifications/logic/notifications_bloc/notifications_bloc.dart';
import 'package:dres/features/notifications/presentation/widgets/notification_tile.dart';

/// Notifications screen
class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  late final NotificationsBloc _notificationsBloc;
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _notificationsBloc = getIt<NotificationsBloc>();
    
    // Fetch notifications if not already loaded
    if (_notificationsBloc.state.status == NotificationsStatus.initial) {
      _notificationsBloc.add(const NotificationsFetchRequested());
    }

    // Add scroll listener for pagination
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_isBottom) {
      _notificationsBloc.add(const NotificationsLoadMoreRequested());
    }
  }

  bool get _isBottom {
    if (!_scrollController.hasClients) return false;
    final maxScroll = _scrollController.position.maxScrollExtent;
    final currentScroll = _scrollController.offset;
    return currentScroll >= (maxScroll * 0.9);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: IconButton(
          icon: Icon(PhosphorIcons.caretLeft(), color: AppColors.textPrimary),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/');
            }
          },
        ),
        title: Text(
          'Notifications',
          style: AppTypography.bodyL.copyWith(color: AppColors.textPrimary),
        ),
        centerTitle: true,
        actions: [
          // Mark all as read button
          BlocBuilder<NotificationsBloc, NotificationsState>(
            bloc: _notificationsBloc,
            builder: (context, state) {
              if (state.unreadCount > 0) {
                return TextButton(
                  onPressed: () {
                    _notificationsBloc.add(const NotificationsMarkAllAsReadRequested());
                  },
                  child: Text(
                    'Mark all read',
                    style: AppTypography.bodyM.copyWith(
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                  ),
                );
              }
              return const SizedBox.shrink();
            },
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: AppColors.secondary),
        ),
      ),
      body: BlocBuilder<NotificationsBloc, NotificationsState>(
        bloc: _notificationsBloc,
        builder: (context, state) {
          if (state.status == NotificationsStatus.loading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (state.status == NotificationsStatus.error) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    PhosphorIcons.warning(),
                    size: 48,
                    color: AppColors.textHint,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Failed to load notifications',
                    style: AppTypography.bodyL.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: () {
                      _notificationsBloc.add(const NotificationsFetchRequested());
                    },
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          if (state.notifications.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    PhosphorIcons.bellSimple(),
                    size: 48,
                    color: AppColors.textHint,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No notifications yet',
                    style: AppTypography.bodyL.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async {
              _notificationsBloc.add(const NotificationsRefreshRequested());
            },
            child: ListView.builder(
              controller: _scrollController,
              physics: const AlwaysScrollableScrollPhysics(),
              itemCount: state.notifications.length + (state.hasMore ? 1 : 0),
              itemBuilder: (context, index) {
                if (index >= state.notifications.length) {
                  // Loading indicator for pagination
                  return const Padding(
                    padding: EdgeInsets.all(16),
                    child: Center(child: CircularProgressIndicator()),
                  );
                }

                final notification = state.notifications[index];
                return NotificationTile(
                  notification: notification,
                  onTap: () => _onNotificationTap(notification),
                );
              },
            ),
          );
        },
      ),
    );
  }

  void _onNotificationTap(NotificationModel notification) {
    // Mark as read
    if (!notification.isRead) {
      _notificationsBloc.add(
        NotificationMarkAsReadRequested(notificationId: notification.id),
      );
    }

    // Navigate based on action URL (path field from backend)
    final path = notification.actionUrl;
    if (path != null && path.isNotEmpty) {
      try {
        debugPrint('Navigating to path: $path');
        // Convert backend paths to app paths
        final convertedPath = _convertPath(path);
        debugPrint('Converted path: $convertedPath');
        context.push(convertedPath);
      } catch (e) {
        debugPrint('Failed to navigate to path: $path, error: $e');
      }
    }
  }

  /// Convert backend paths to app paths
  String _convertPath(String path) {
    // Handle SKU detail deep links
    // Backend path: /sell/style/:styleId/variation/:variationId/sku/:skuId
    // App path: /sku-detail/:styleId/:variationId/:skuId
    final skuMatch = RegExp(r'^/sell/style/([^/]+)/variation/([^/]+)/sku/([^/]+)$').firstMatch(path);
    if (skuMatch != null) {
      final styleId = skuMatch.group(1)!;
      final variationId = skuMatch.group(2)!;
      final skuId = skuMatch.group(3)!;
      return '/sku-detail/$styleId/$variationId/$skuId';
    }
    return path;
  }
}
