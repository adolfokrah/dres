import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dres/core/services/api_exception.dart';
import 'package:dres/features/notifications/data/repositories/notifications_repository.dart';
import 'package:dres/features/notifications/logic/notifications_bloc/notifications_event.dart';
import 'package:dres/features/notifications/logic/notifications_bloc/notifications_state.dart';

export 'notifications_event.dart';
export 'notifications_state.dart';

class NotificationsBloc extends Bloc<NotificationsEvent, NotificationsState> {
  final NotificationsRepository _notificationsRepository;

  NotificationsBloc({required NotificationsRepository notificationsRepository})
      : _notificationsRepository = notificationsRepository,
        super(const NotificationsState()) {
    on<NotificationsFetchRequested>(_onFetchRequested);
    on<NotificationsRefreshRequested>(_onRefreshRequested);
    on<NotificationsLoadMoreRequested>(_onLoadMoreRequested);
    on<NotificationsUnreadCountRequested>(_onUnreadCountRequested);
    on<NotificationMarkAsReadRequested>(_onMarkAsReadRequested);
    on<NotificationsMarkAllAsReadRequested>(_onMarkAllAsReadRequested);
  }

  Future<void> _onFetchRequested(
    NotificationsFetchRequested event,
    Emitter<NotificationsState> emit,
  ) async {
    emit(state.copyWith(status: NotificationsStatus.loading));

    try {
      final response = await _notificationsRepository.getNotifications(page: 1);
      emit(state.copyWith(
        status: NotificationsStatus.success,
        notifications: response.notifications,
        unreadCount: response.unreadCount,
        totalCount: response.totalCount,
        hasMore: response.hasMore,
        currentPage: 1,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: NotificationsStatus.error,
        errorMessage: getErrorMessage(e),
      ));
    }
  }

  Future<void> _onRefreshRequested(
    NotificationsRefreshRequested event,
    Emitter<NotificationsState> emit,
  ) async {
    try {
      final response = await _notificationsRepository.getNotifications(page: 1);
      emit(state.copyWith(
        status: NotificationsStatus.success,
        notifications: response.notifications,
        unreadCount: response.unreadCount,
        totalCount: response.totalCount,
        hasMore: response.hasMore,
        currentPage: 1,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: NotificationsStatus.error,
        errorMessage: getErrorMessage(e),
      ));
    }
  }

  Future<void> _onLoadMoreRequested(
    NotificationsLoadMoreRequested event,
    Emitter<NotificationsState> emit,
  ) async {
    if (!state.hasMore || state.status == NotificationsStatus.loadingMore) {
      return;
    }

    emit(state.copyWith(status: NotificationsStatus.loadingMore));

    try {
      final nextPage = state.currentPage + 1;
      final response = await _notificationsRepository.getNotifications(page: nextPage);
      emit(state.copyWith(
        status: NotificationsStatus.success,
        notifications: [...state.notifications, ...response.notifications],
        unreadCount: response.unreadCount,
        hasMore: response.hasMore,
        currentPage: nextPage,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: NotificationsStatus.error,
        errorMessage: getErrorMessage(e),
      ));
    }
  }

  Future<void> _onUnreadCountRequested(
    NotificationsUnreadCountRequested event,
    Emitter<NotificationsState> emit,
  ) async {
    try {
      final count = await _notificationsRepository.getUnreadCount();
      emit(state.copyWith(unreadCount: count));
    } catch (_) {
      // Silently fail for unread count - not critical
    }
  }

  Future<void> _onMarkAsReadRequested(
    NotificationMarkAsReadRequested event,
    Emitter<NotificationsState> emit,
  ) async {
    try {
      await _notificationsRepository.markAsRead(event.notificationId);
      
      // Update local state
      final updatedNotifications = state.notifications.map((n) {
        if (n.id == event.notificationId) {
          return n.copyWith(isRead: true);
        }
        return n;
      }).toList();

      final newUnreadCount = state.unreadCount > 0 ? state.unreadCount - 1 : 0;
      
      emit(state.copyWith(
        notifications: updatedNotifications,
        unreadCount: newUnreadCount,
      ));
    } catch (_) {
      // Silently fail - not critical
    }
  }

  Future<void> _onMarkAllAsReadRequested(
    NotificationsMarkAllAsReadRequested event,
    Emitter<NotificationsState> emit,
  ) async {
    try {
      await _notificationsRepository.markAllAsRead();
      
      // Update local state
      final updatedNotifications = state.notifications
          .map((n) => n.copyWith(isRead: true))
          .toList();
      
      emit(state.copyWith(
        notifications: updatedNotifications,
        unreadCount: 0,
      ));
    } catch (_) {
      // Silently fail - not critical
    }
  }
}
