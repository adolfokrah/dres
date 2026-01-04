import 'package:dres/core/services/api_service.dart';
import 'package:dres/features/notifications/data/models/notification_model.dart';

export 'package:dres/features/notifications/data/models/notification_model.dart';

class NotificationsRepository {
  final ApiService _apiService;

  NotificationsRepository({required ApiService apiService})
      : _apiService = apiService;

  /// Fetch notifications for the current user
  Future<NotificationsResponse> getNotifications({int page = 1, int limit = 20}) async {
    final response = await _apiService.get(
      '/notifications/my-notifications',
      queryParameters: {
        'page': page,
        'limit': limit,
      },
    );
    return NotificationsResponse.fromJson(response.data);
  }

  /// Get unread notification count
  Future<int> getUnreadCount() async {
    final response = await _apiService.get('/notifications/unread-count');
    return response.data['count'] ?? 0;
  }

  /// Mark a notification as read
  Future<void> markAsRead(String notificationId) async {
    await _apiService.patch('/notifications/$notificationId/read');
  }

  /// Mark all notifications as read
  Future<void> markAllAsRead() async {
    await _apiService.post('/notifications/mark-all-read');
  }
}
