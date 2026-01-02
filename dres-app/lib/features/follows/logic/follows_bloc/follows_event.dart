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

  const FollowsToggleRequested({
    required this.userId,
    required this.isCurrentlyFollowing,
  });

  @override
  List<Object?> get props => [userId, isCurrentlyFollowing];
}

/// Get follow counts for a user
class FollowsCountsRequested extends FollowsEvent {
  final String userId;

  const FollowsCountsRequested({required this.userId});

  @override
  List<Object?> get props => [userId];
}

/// Clear follow state (e.g., on logout)
class FollowsClearRequested extends FollowsEvent {
  const FollowsClearRequested();
}
