import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/app_button.dart';
import 'package:dres/features/follows/logic/follows_bloc/follows_bloc.dart';
import 'package:dres/features/auth/logic/auth_bloc/auth_bloc.dart';
import 'package:dres/l10n/app_localizations.dart';

/// A follow/unfollow button widget with optimistic updates.
/// 
/// Shows "Follow" when not following, "Following" when following.
/// Automatically hides when the user is viewing their own profile.
class FollowButton extends StatefulWidget {
  /// The user ID to follow/unfollow
  final String userId;
  
  /// Optional callback when follow state changes
  final ValueChanged<bool>? onChanged;
  
  /// Whether to show as outlined button (default: false, shows filled)
  final bool outlined;

  const FollowButton({
    super.key,
    required this.userId,
    this.onChanged,
    this.outlined = false,
  });

  @override
  State<FollowButton> createState() => _FollowButtonState();
}

class _FollowButtonState extends State<FollowButton> {
  @override
  void initState() {
    super.initState();
    // Check follow status when widget mounts
    _checkFollowStatus();
  }

  void _checkFollowStatus() {
    final currentUserId = getIt<AuthBloc>().state.user?.id;
    if (currentUserId != null && currentUserId != widget.userId) {
      getIt<FollowsBloc>().add(FollowsCheckRequested(userId: widget.userId));
    }
  }

  void _toggleFollow(BuildContext context, bool isCurrentlyFollowing) {
    // Check if user is logged in
    final authState = getIt<AuthBloc>().state;
    if (authState.user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please log in to follow users'),
          duration: Duration(seconds: 2),
        ),
      );
      context.push('/auth');
      return;
    }

    // Can't follow yourself
    if (authState.user!.id == widget.userId) {
      return;
    }

    // Dispatch toggle event
    getIt<FollowsBloc>().add(FollowsToggleRequested(
      userId: widget.userId,
      isCurrentlyFollowing: isCurrentlyFollowing,
    ));

    widget.onChanged?.call(!isCurrentlyFollowing);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    
    return BlocBuilder<AuthBloc, AuthState>(
      bloc: getIt<AuthBloc>(),
      builder: (context, authState) {
        // Don't show button if user is viewing their own profile
        if (authState.user?.id == widget.userId) {
          return const SizedBox.shrink();
        }
        
        return BlocBuilder<FollowsBloc, FollowsState>(
          bloc: getIt<FollowsBloc>(),
          builder: (context, followsState) {
            final isFollowing = followsState.isFollowing(widget.userId);

            if (widget.outlined) {
              return AppButton.outlined(
                text: isFollowing ? l10n.following : l10n.follow,
                onPressed: () => _toggleFollow(context, isFollowing),
              );
            }

            // Use outlined style when following, filled when not
            if (isFollowing) {
              return AppButton.outlined(
                text: l10n.following,
                textColor: AppColors.primary,
                borderColor: AppColors.primary,
                onPressed: () => _toggleFollow(context, isFollowing),
              );
            }

            return AppButton.filled(
              text: l10n.follow,
              backgroundColor: AppColors.primary,
              textColor: AppColors.textOnPrimary,
              onPressed: () => _toggleFollow(context, isFollowing),
            );
          },
        );
      },
    );
  }
}

/// A compact follow button for use in lists
class FollowButtonCompact extends StatefulWidget {
  final String userId;
  final ValueChanged<bool>? onChanged;

  const FollowButtonCompact({
    super.key,
    required this.userId,
    this.onChanged,
  });

  @override
  State<FollowButtonCompact> createState() => _FollowButtonCompactState();
}

class _FollowButtonCompactState extends State<FollowButtonCompact> {
  @override
  void initState() {
    super.initState();
    _checkFollowStatus();
  }

  void _checkFollowStatus() {
    final currentUserId = getIt<AuthBloc>().state.user?.id;
    if (currentUserId != null && currentUserId != widget.userId) {
      getIt<FollowsBloc>().add(FollowsCheckRequested(userId: widget.userId));
    }
  }

  void _toggleFollow(BuildContext context, bool isCurrentlyFollowing) {
    final authState = getIt<AuthBloc>().state;
    if (authState.user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please log in to follow users'),
          duration: Duration(seconds: 2),
        ),
      );
      context.push('/auth');
      return;
    }

    if (authState.user!.id == widget.userId) {
      return;
    }

    getIt<FollowsBloc>().add(FollowsToggleRequested(
      userId: widget.userId,
      isCurrentlyFollowing: isCurrentlyFollowing,
    ));

    widget.onChanged?.call(!isCurrentlyFollowing);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    
    return BlocBuilder<AuthBloc, AuthState>(
      bloc: getIt<AuthBloc>(),
      builder: (context, authState) {
        if (authState.user?.id == widget.userId) {
          return const SizedBox.shrink();
        }
        
        return BlocBuilder<FollowsBloc, FollowsState>(
          bloc: getIt<FollowsBloc>(),
          builder: (context, followsState) {
            final isFollowing = followsState.isFollowing(widget.userId);

            return TextButton(
              onPressed: () => _toggleFollow(context, isFollowing),
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                backgroundColor: isFollowing ? Colors.transparent : AppColors.primary,
                side: isFollowing 
                    ? const BorderSide(color: AppColors.primary)
                    : null,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
              child: Text(
                isFollowing ? l10n.following : l10n.follow,
                style: AppTypography.bodyM.copyWith(
                  color: isFollowing ? AppColors.primary : AppColors.textOnPrimary,
                  fontWeight: FontWeight.w500,
                ),
              ),
            );
          },
        );
      },
    );
  }
}
