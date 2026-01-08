part of 'follows_bloc.dart';

abstract class FollowsEvent extends Equatable {
  const FollowsEvent();

  @override
  List<Object?> get props => [];
}

/// Check if current user is following a specific user
class FollowsCheckRequested extends FollowsEvent {
  final String userId;

  const FollowsCheckRequested({required this.userId});

  @override
  List<Object?> get props => [userId];
}

/// Toggle follow/unfollow with optimistic update
class FollowsToggleRequested extends FollowsEvent {
  final String userId;
  final bool isCurrentlyFollowing;
  /// Optional user info for adding to community list
  final String? userName;
  final String? userUsername;
  final String? userAvatar;

  const FollowsToggleRequested({
    required this.userId,
    required this.isCurrentlyFollowing,
    this.userName,
    this.userUsername,
    this.userAvatar,
  });

  @override
  List<Object?> get props => [userId, isCurrentlyFollowing, userName, userUsername, userAvatar];
}

/// Get follow counts for a user
class FollowsCountsRequested extends FollowsEvent {
  final String userId;

  const FollowsCountsRequested({required this.userId});

  @override
  List<Object?> get props => [userId];
}

/// Initialize current user's follower/following counts
class MyFollowCountsInitRequested extends FollowsEvent {
  final int followersCount;
  final int followingCount;

  const MyFollowCountsInitRequested({
    required this.followersCount,
    required this.followingCount,
  });

  @override
  List<Object?> get props => [followersCount, followingCount];
}

/// Clear follow state (e.g., on logout)
class FollowsClearRequested extends FollowsEvent {
  const FollowsClearRequested();
}

// ============ Community Events ============

/// Event to fetch community (followers/following list)
class CommunityFetchRequested extends FollowsEvent {
  final String userId;
  final String filter; // 'followers' or 'following'

  const CommunityFetchRequested({required this.userId, required this.filter});

  @override
  List<Object?> get props => [userId, filter];
}

/// Event to load more community members
class CommunityLoadMoreRequested extends FollowsEvent {
  const CommunityLoadMoreRequested();
}

/// Event to refresh community
class CommunityRefreshRequested extends FollowsEvent {
  const CommunityRefreshRequested();
}

/// Event to change filter
class CommunityFilterChanged extends FollowsEvent {
  final String filter; // 'followers' or 'following'

  const CommunityFilterChanged({required this.filter});

  @override
  List<Object?> get props => [filter];
}
