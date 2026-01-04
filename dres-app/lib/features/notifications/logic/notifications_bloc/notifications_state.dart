import 'package:equatable/equatable.dart';
import 'package:dres/features/notifications/data/models/notification_model.dart';

enum NotificationsStatus {
  initial,
  loading,
  success,
  loadingMore,
  error,
}

class NotificationsState extends Equatable {
  final NotificationsStatus status;
  final List<NotificationModel> notifications;
  final int unreadCount;
  final int totalCount;
  final bool hasMore;
  final int currentPage;
  final String? errorMessage;

  const NotificationsState({
    this.status = NotificationsStatus.initial,
    this.notifications = const [],
    this.unreadCount = 0,
    this.totalCount = 0,
    this.hasMore = false,
    this.currentPage = 1,
    this.errorMessage,
  });

  NotificationsState copyWith({
    NotificationsStatus? status,
    List<NotificationModel>? notifications,
    int? unreadCount,
    int? totalCount,
    bool? hasMore,
    int? currentPage,
    String? errorMessage,
  }) {
    return NotificationsState(
      status: status ?? this.status,
      notifications: notifications ?? this.notifications,
      unreadCount: unreadCount ?? this.unreadCount,
      totalCount: totalCount ?? this.totalCount,
      hasMore: hasMore ?? this.hasMore,
      currentPage: currentPage ?? this.currentPage,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }

  @override
  List<Object?> get props => [
        status,
        notifications,
        unreadCount,
        totalCount,
        hasMore,
        currentPage,
        errorMessage,
      ];
}
