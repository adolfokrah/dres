import 'package:equatable/equatable.dart';

abstract class NotificationsEvent extends Equatable {
  const NotificationsEvent();

  @override
  List<Object?> get props => [];
}

/// Fetch notifications
class NotificationsFetchRequested extends NotificationsEvent {
  const NotificationsFetchRequested();
}

/// Refresh notifications (pull to refresh)
class NotificationsRefreshRequested extends NotificationsEvent {
  const NotificationsRefreshRequested();
}

/// Load more notifications (pagination)
class NotificationsLoadMoreRequested extends NotificationsEvent {
  const NotificationsLoadMoreRequested();
}

/// Fetch only the unread count (lightweight)
class NotificationsUnreadCountRequested extends NotificationsEvent {
  const NotificationsUnreadCountRequested();
}

/// Mark a notification as read
class NotificationMarkAsReadRequested extends NotificationsEvent {
  final String notificationId;

  const NotificationMarkAsReadRequested({required this.notificationId});

  @override
  List<Object?> get props => [notificationId];
}

/// Mark all notifications as read
class NotificationsMarkAllAsReadRequested extends NotificationsEvent {
  const NotificationsMarkAllAsReadRequested();
}

/// Clear notifications state (e.g., on logout)
class NotificationsClearRequested extends NotificationsEvent {
  const NotificationsClearRequested();
}
