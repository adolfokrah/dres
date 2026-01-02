part of 'follows_bloc.dart';

enum FollowsStatus { initial, loading, success, error }

class FollowsState extends Equatable {
  final FollowsStatus status;
  final String? errorMessage;
  
  /// Map of userId -> isFollowing (for optimistic updates)
  final Map<String, bool> followingStatus;
  
  /// Map of userId -> FollowCounts
  final Map<String, FollowCounts> followCounts;

  const FollowsState({
    this.status = FollowsStatus.initial,
    this.errorMessage,
    this.followingStatus = const {},
    this.followCounts = const {},
  });

  /// Check if currently following a user
  bool isFollowing(String userId) {
    return followingStatus[userId] ?? false;
  }

  /// Get follow counts for a user
  FollowCounts? getFollowCounts(String userId) {
    return followCounts[userId];
  }

  FollowsState copyWith({
    FollowsStatus? status,
    String? errorMessage,
    Map<String, bool>? followingStatus,
    Map<String, FollowCounts>? followCounts,
  }) {
    return FollowsState(
      status: status ?? this.status,
      errorMessage: errorMessage,
      followingStatus: followingStatus ?? this.followingStatus,
      followCounts: followCounts ?? this.followCounts,
    );
  }

  @override
  List<Object?> get props => [status, errorMessage, followingStatus, followCounts];
}

class FollowCounts extends Equatable {
  final int followers;
  final int following;

  const FollowCounts({
    required this.followers,
    required this.following,
  });

  @override
  List<Object?> get props => [followers, following];
}
