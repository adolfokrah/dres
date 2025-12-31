import 'package:flutter/material.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';

/// Profile stats card showing followers, following, reviews
class ProfileStatsCard extends StatelessWidget {
  final int followers;
  final int following;
  final int reviews;
  final VoidCallback? onFollowersTap;
  final VoidCallback? onFollowingTap;
  final VoidCallback? onReviewsTap;

  const ProfileStatsCard({
    super.key,
    this.followers = 0,
    this.following = 0,
    this.reviews = 0,
    this.onFollowersTap,
    this.onFollowingTap,
    this.onReviewsTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.border, width: 1),
      ),
      child: Row(
        children: [
          Expanded(
            child: _StatItem(
              value: followers,
              label: 'Followers',
              onTap: onFollowersTap,
            ),
          ),
          Expanded(
            child: _StatItem(
              value: following,
              label: 'Following',
              onTap: onFollowingTap,
            ),
          ),
          Expanded(
            child: _StatItem(
              value: reviews,
              label: 'Reviews',
              onTap: onReviewsTap,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  final int value;
  final String label;
  final VoidCallback? onTap;

  const _StatItem({
    required this.value,
    required this.label,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Column(
        children: [
          Text(
            value.toString(),
            style: AppTypography.bodyL.copyWith(
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: AppTypography.bodyM.copyWith(
              color: AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }
}
