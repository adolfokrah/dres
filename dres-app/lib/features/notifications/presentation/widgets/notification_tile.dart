import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/features/notifications/data/models/notification_model.dart';

/// Notification tile widget
class NotificationTile extends StatelessWidget {
  final NotificationModel notification;
  final VoidCallback? onTap;

  const NotificationTile({
    super.key,
    required this.notification,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        decoration: const BoxDecoration(
          border: Border(
            bottom: BorderSide(color: AppColors.secondary, width: 1),
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: notification.imageUrl != null
                  ? CachedNetworkImage(
                      imageUrl: notification.imageUrl!,
                      width: 60,
                      height: 60,
                      fit: BoxFit.cover,
                      placeholder: (context, url) => Container(
                        width: 60,
                        height: 60,
                        color: Colors.white,
                      ),
                      errorWidget: (context, url, error) => Container(
                        width: 60,
                        height: 60,
                        color: Colors.white,
                        padding: const EdgeInsets.all(12),
                        child: Image.asset(
                          'assets/images/logo.png',
                          fit: BoxFit.contain,
                        ),
                      ),
                    )
                  : Container(
                      width: 60,
                      height: 60,
                      color: Colors.white,
                      padding: const EdgeInsets.all(12),
                      child: Image.asset(
                        'assets/images/logo.png',
                        fit: BoxFit.contain,
                      ),
                    ),
            ),
            const SizedBox(width: 16),
            
            // Message
            Expanded(
              child: Text(
                notification.message,
                style: AppTypography.bodyM.copyWith(
                  color: AppColors.textPrimary,
                  fontWeight: notification.isRead ? FontWeight.w400 : FontWeight.w700,
                ),
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 16),
            
            // Time ago
            Text(
              notification.timeAgo,
              style: AppTypography.bodyM.copyWith(
                color: AppColors.textPrimary,
                fontWeight: notification.isRead ? FontWeight.w400 : FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
