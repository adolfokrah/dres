import 'package:dres/core/utilities/media_utils.dart';

/// Notification type enum
enum NotificationType {
  priceDrop('price_drop'),
  orderUpdate('order_update'),
  promotion('promotion'),
  system('system');

  const NotificationType(this.value);
  final String value;

  static NotificationType fromString(String? value) {
    return NotificationType.values.firstWhere(
      (e) => e.value == value,
      orElse: () => NotificationType.system,
    );
  }
}

/// Notification model
class NotificationModel {
  final String id;
  final NotificationType type;
  final String message;
  final String? imageUrl;
  final bool isRead;
  final DateTime createdAt;
  final String? actionUrl; // Deep link for navigation (e.g., /orders/123, /products/abc)
  final Map<String, dynamic>? metadata; // Additional data like orderId, productId, etc.

  NotificationModel({
    required this.id,
    required this.type,
    required this.message,
    this.imageUrl,
    required this.isRead,
    required this.createdAt,
    this.actionUrl,
    this.metadata,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id'] ?? '',
      type: NotificationType.fromString(json['type']),
      message: json['message'] ?? '',
      imageUrl: json['imageUrl'] != null 
          ? MediaUtils.resolveUrl(json['imageUrl']) 
          : null,
      isRead: json['isRead'] ?? false,
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
      actionUrl: json['actionUrl'],
      metadata: json['metadata'],
    );
  }

  /// Get relative time string (e.g., "2d", "3h", "5m")
  String get timeAgo {
    final now = DateTime.now();
    final difference = now.difference(createdAt);

    if (difference.inDays > 0) {
      return '${difference.inDays}d';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}m';
    } else {
      return 'now';
    }
  }

  /// Create a copy with updated values
  NotificationModel copyWith({
    String? id,
    NotificationType? type,
    String? message,
    String? imageUrl,
    bool? isRead,
    DateTime? createdAt,
    String? actionUrl,
    Map<String, dynamic>? metadata,
  }) {
    return NotificationModel(
      id: id ?? this.id,
      type: type ?? this.type,
      message: message ?? this.message,
      imageUrl: imageUrl ?? this.imageUrl,
      isRead: isRead ?? this.isRead,
      createdAt: createdAt ?? this.createdAt,
      actionUrl: actionUrl ?? this.actionUrl,
      metadata: metadata ?? this.metadata,
    );
  }
}

/// Response model for notifications list
class NotificationsResponse {
  final List<NotificationModel> notifications;
  final int unreadCount;
  final int totalCount;
  final bool hasMore;
  final int page;

  NotificationsResponse({
    required this.notifications,
    required this.unreadCount,
    required this.totalCount,
    required this.hasMore,
    required this.page,
  });

  factory NotificationsResponse.fromJson(Map<String, dynamic> json) {
    return NotificationsResponse(
      notifications: (json['docs'] as List<dynamic>?)
              ?.map((e) => NotificationModel.fromJson(e))
              .toList() ??
          [],
      unreadCount: json['unreadCount'] ?? 0,
      totalCount: json['totalDocs'] ?? 0,
      hasMore: json['hasNextPage'] ?? false,
      page: json['page'] ?? 1,
    );
  }
}
