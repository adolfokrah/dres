import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/profile_avatar.dart';

/// A reusable user list item widget for displaying users in lists
/// Used in community lists, search results, etc.
class UserListItem extends StatelessWidget {
  final String id;
  final String name;
  final String? username;
  final String? avatarUrl;
  final String? badge;
  final VoidCallback? onTap;

  const UserListItem({
    super.key,
    required this.id,
    required this.name,
    this.username,
    this.avatarUrl,
    this.badge,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap ?? () => context.push('/sellers/$id'),
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(
            bottom: BorderSide(color: AppColors.secondary, width: 1),
          ),
        ),
        child: Row(
          children: [
            // Avatar
            ProfileAvatar(
              photoUrl: avatarUrl,
              size: 56,
              displayName: name,
            ),
            const SizedBox(width: 15),

            // User info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    username ?? name,
                    style: AppTypography.bodyM.copyWith(
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  if (badge != null) ...[
                    const SizedBox(height: 11),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 5,
                        vertical: 5,
                      ),
                      decoration: BoxDecoration(
                        border: Border.all(color: AppColors.textPrimary, width: 1),
                      ),
                      child: Text(
                        badge!,
                        style: AppTypography.bodyS.copyWith(
                          color: AppColors.textPrimary,
                          fontSize: 10,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),

            // Chevron
            Icon(
              PhosphorIcons.caretRight(),
              size: 16,
              color: AppColors.textPrimary,
            ),
          ],
        ),
      ),
    );
  }
}
