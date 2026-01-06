import 'dart:io';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:dres/core/services/api_service.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/features/notifications/logic/notifications_bloc/notifications_bloc.dart';
import 'package:dres/routes.dart';
import 'package:dres/features/auth/logic/auth_bloc/auth_bloc.dart';

/// Background message handler - must be a top-level function
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  debugPrint('🔔 Background message received: ${message.messageId}');
  // Handle background message here if needed
}

class PushNotificationService {
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();
  final ApiService _apiService;
  
  String? _fcmToken;
  bool _isTokenRegistered = false;
  
  /// Get the current FCM token
  String? get fcmToken => _fcmToken;
  
  /// Check if token is registered with server
  bool get isTokenRegistered => _isTokenRegistered;

  PushNotificationService({required ApiService apiService}) : _apiService = apiService;

  /// Initialize push notification service
  /// Note: This only sets up FCM and gets the token. 
  /// Call registerToken() after user logs in to send token to server.
  Future<void> initialize() async {
    // Set up background message handler
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
    
    // Request permission
    await _requestPermission();
    
    // Initialize local notifications for foreground
    await _initializeLocalNotifications();
    
    // Try to get FCM token (non-blocking - will retry later if needed)
    _getToken();
    
    // Listen for token refresh (this will fire when APNS token becomes available on iOS)
    _messaging.onTokenRefresh.listen(_onTokenRefresh);
    
    // Handle foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
    
    // Handle notification tap when app is in background/terminated
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);
    
    // Check if app was opened from a notification
    final initialMessage = await _messaging.getInitialMessage();
    if (initialMessage != null) {
      _handleNotificationTap(initialMessage);
    }
    
    debugPrint('🔔 Push notification service initialized');
  }

  /// Request notification permission
  Future<void> _requestPermission() async {
    final settings = await _messaging.requestPermission(
      alert: true,
      announcement: false,
      badge: true,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
      sound: true,
    );

    debugPrint('🔔 Permission status: ${settings.authorizationStatus}');
    
    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      debugPrint('🔔 User granted permission');
    } else if (settings.authorizationStatus == AuthorizationStatus.provisional) {
      debugPrint('🔔 User granted provisional permission');
    } else {
      debugPrint('🔔 User declined or has not accepted permission');
    }
  }

  /// Initialize local notifications for foreground display
  Future<void> _initializeLocalNotifications() async {
    // Android initialization
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    
    // iOS initialization
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: false, // Already requested via FCM
      requestBadgePermission: false,
      requestSoundPermission: false,
    );
    
    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );
    
    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onNotificationTap,
    );
    
    // Create Android notification channel
    if (Platform.isAndroid) {
      const channel = AndroidNotificationChannel(
        'dres_notifications', // id
        'DRES Notifications', // name
        description: 'Notifications from DRES app',
        importance: Importance.high,
      );
      
      await _localNotifications
          .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(channel);
    }
  }

  /// Get FCM token (internal - doesn't send to server)
  /// This is fire-and-forget on iOS since APNS token may not be ready
  Future<void> _getToken() async {
    try {
      // On iOS, APNS token might not be ready yet
      // The token will come through onTokenRefresh when ready
      if (Platform.isIOS) {
        final apnsToken = await _messaging.getAPNSToken();
        if (apnsToken == null) {
          debugPrint('🔔 APNS token not ready yet, will get FCM token via onTokenRefresh');
          return;
        }
        debugPrint('🔔 APNS Token available');
      }
      
      _fcmToken = await _messaging.getToken();
      debugPrint('🔔 FCM Token: $_fcmToken');
    } catch (e) {
      debugPrint('🔔 Error getting FCM token (will retry via onTokenRefresh): $e');
      // Don't throw - token will come through onTokenRefresh when APNS is ready
    }
  }

  /// Handle token refresh - this fires when FCM token is available (including after APNS becomes ready)
  void _onTokenRefresh(String token) {
    debugPrint('🔔 FCM Token received/refreshed: $token');
    _fcmToken = token;
    // Only send to server if we've already registered (user is logged in)
    if (_isTokenRegistered) {
      _sendTokenToServer(token);
    }
  }

  /// Register FCM token with server (call after user logs in)
  /// This should be called after successful authentication
  Future<void> registerToken() async {
    // Mark that we want to register - if token comes later via onTokenRefresh, it will be sent
    _isTokenRegistered = true;
    
    if (_fcmToken == null) {
      // Try to get token if we don't have one
      await _getToken();
    }
    
    if (_fcmToken != null) {
      await _sendTokenToServer(_fcmToken!);
    } else {
      debugPrint('🔔 FCM token not available yet, will register when received');
    }
  }

  /// Send FCM token to backend server using fcm-tokens collection API
  Future<void> _sendTokenToServer(String token) async {
    try {
      // First, check if this token already exists
      final existingResponse = await _apiService.get(
        '/fcm-tokens',
        queryParameters: {
          'where[token][equals]': token,
          'limit': 1,
        },
      );
      
      final docs = existingResponse.data['docs'] as List?;
      
      if (docs != null && docs.isNotEmpty) {
        // Token exists, update it (to update lastUsed timestamp)
        final existingId = docs[0]['id'];
        await _apiService.patch(
          '/fcm-tokens/$existingId',
          data: {
            'platform': Platform.isIOS ? 'ios' : 'android',
            'isActive': true,
          },
        );
        debugPrint('🔔 FCM token updated on server');
      } else {
        // Create new token
        await _apiService.post(
          '/fcm-tokens',
          data: {
            'token': token,
            'platform': Platform.isIOS ? 'ios' : 'android',
            'isActive': true,
          },
        );
        debugPrint('🔔 FCM token created on server');
      }
    } catch (e) {
      debugPrint('🔔 Error sending FCM token to server: $e');
      // Don't throw - token will be sent on next app launch
    }
  }

  /// Handle foreground message
  void _handleForegroundMessage(RemoteMessage message) {
    debugPrint('🔔 Foreground message: ${message.notification?.title}');

    final notification = message.notification;
    final android = message.notification?.android;

    // Build payload with notificationId and path
    final notificationId = message.data['notificationId'] as String?;
    final path = message.data['path'] as String?;
    String? payload;
    if (notificationId != null && path != null) {
      payload = '$notificationId|$path';
    } else if (path != null) {
      payload = path;
    }

    // Refresh notifications list if user is authenticated
    _refreshNotifications();

    // Show local notification when app is in foreground
    if (notification != null) {
      _localNotifications.show(
        notification.hashCode,
        notification.title,
        notification.body,
        NotificationDetails(
          android: AndroidNotificationDetails(
            'dres_notifications',
            'DRES Notifications',
            channelDescription: 'Notifications from DRES app',
            importance: Importance.high,
            priority: Priority.high,
            icon: android?.smallIcon ?? '@mipmap/ic_launcher',
          ),
          iOS: const DarwinNotificationDetails(
            presentAlert: true,
            presentBadge: true,
            presentSound: true,
          ),
        ),
        payload: payload,
      );
    }
  }

  /// Refresh notifications list when a push is received
  void _refreshNotifications() {
    try {
      // Only refresh if user is authenticated
      final authBloc = getIt<AuthBloc>();
      if (authBloc.state.status == AuthStatus.authenticated) {
        getIt<NotificationsBloc>().add(const NotificationsRefreshRequested());
        debugPrint('🔔 Triggered notifications refresh');
      }
    } catch (e) {
      debugPrint('🔔 Error refreshing notifications: $e');
    }
  }

  /// Handle notification tap when app is in background/terminated
  void _handleNotificationTap(RemoteMessage message) {
    debugPrint('🔔 Notification tapped: ${message.data}');
    _navigateFromNotification(message.data);
  }

  /// Handle local notification tap
  void _onNotificationTap(NotificationResponse response) {
    debugPrint('🔔 Local notification tapped: ${response.payload}');
    if (response.payload != null && response.payload!.isNotEmpty) {
      // Parse payload - format: "notificationId|path" or just "path"
      final parts = response.payload!.split('|');
      if (parts.length >= 2) {
        final notificationId = parts[0];
        final path = parts[1];
        _markAsReadAndNavigate(notificationId, path);
      } else {
        // Legacy format - just path
        AppRoutes.router.push(response.payload!);
      }
    }
  }

  /// Navigate based on notification data
  void _navigateFromNotification(Map<String, dynamic> data) {
    final notificationId = data['notificationId'] as String?;
    final path = data['path'] as String?;
    
    if (notificationId != null && path != null && path.isNotEmpty) {
      _markAsReadAndNavigate(notificationId, path);
    } else if (path != null && path.isNotEmpty) {
      AppRoutes.router.push(path);
    }
  }
  
  /// Mark notification as read and navigate to path
  void _markAsReadAndNavigate(String notificationId, String path) {
    debugPrint('🔔 Marking notification $notificationId as read and navigating to $path');
    
    // Mark notification as read via NotificationsBloc
    try {
      getIt<NotificationsBloc>().add(
        NotificationMarkAsReadRequested(notificationId: notificationId),
      );
    } catch (e) {
      debugPrint('🔔 Error marking notification as read: $e');
    }
    
    // Navigate to the path
    AppRoutes.router.push(path);
  }

  /// Subscribe to a topic
  Future<void> subscribeToTopic(String topic) async {
    await _messaging.subscribeToTopic(topic);
    debugPrint('🔔 Subscribed to topic: $topic');
  }

  /// Unsubscribe from a topic
  Future<void> unsubscribeFromTopic(String topic) async {
    await _messaging.unsubscribeFromTopic(topic);
    debugPrint('🔔 Unsubscribed from topic: $topic');
  }

  /// Delete FCM token (useful for logout)
  Future<void> deleteToken() async {
    // Remove token from server first
    if (_fcmToken != null) {
      try {
        // Find the token in the collection
        final response = await _apiService.get(
          '/fcm-tokens',
          queryParameters: {
            'where[token][equals]': _fcmToken,
            'limit': 1,
          },
        );
        
        final docs = response.data['docs'] as List?;
        if (docs != null && docs.isNotEmpty) {
          final tokenId = docs[0]['id'];
          await _apiService.delete('/fcm-tokens/$tokenId');
          debugPrint('🔔 FCM token removed from server');
        }
      } catch (e) {
        debugPrint('🔔 Error removing FCM token from server: $e');
      }
    }
    
    await _messaging.deleteToken();
    _fcmToken = null;
    _isTokenRegistered = false;
    debugPrint('🔔 FCM token deleted locally');
  }

  /// Delete all FCM tokens for this user (logout from all devices)
  Future<void> deleteAllTokens() async {
    try {
      // Get all tokens for the current user
      final response = await _apiService.get('/fcm-tokens');
      final docs = response.data['docs'] as List?;
      
      if (docs != null) {
        for (final doc in docs) {
          await _apiService.delete('/fcm-tokens/${doc['id']}');
        }
      }
      debugPrint('🔔 All FCM tokens removed from server');
    } catch (e) {
      debugPrint('🔔 Error removing all FCM tokens: $e');
    }
    
    await _messaging.deleteToken();
    _fcmToken = null;
    _isTokenRegistered = false;
    debugPrint('🔔 FCM token deleted locally');
  }
}
