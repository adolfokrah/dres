part of 'follows_bloc.dart';

enum FollowsStatus { initial, loading, success, error }
enum CommunityStatus { initial, loading, success, error }

class FollowsState extends Equatable {
  final FollowsStatus status;
  final String? errorMessage;
  
  /// Map of userId -> isFollowing (for optimistic updates)
  final Map<String, bool> followingStatus;
  
  /// Map of userId -> FollowCounts
  final Map<String, FollowCounts> followCounts;
  
  /// Current user's follower/following counts (for ProfileStatsCard)
  final int myFollowersCount;
  final int myFollowingCount;

  // ============ Community State ============
  final CommunityStatus communityStatus;
  final List<community.FollowUserModel> communityUsers;
  final String? communityUserId;
  final String communityFilter; // 'followers' or 'following'
  final String? communityError;
  final bool communityHasMore;
  final int communityPage;

  const FollowsState({
    this.status = FollowsStatus.initial,
    this.errorMessage,
    this.followingStatus = const {},
    this.followCounts = const {},
    this.myFollowersCount = 0,
    this.myFollowingCount = 0,
    // Community defaults
    this.communityStatus = CommunityStatus.initial,
    this.communityUsers = const [],
    this.communityUserId,
    this.communityFilter = 'followers',
    this.communityError,
    this.communityHasMore = true,
    this.communityPage = 1,
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
    int? myFollowersCount,
    int? myFollowingCount,
    // Community
    CommunityStatus? communityStatus,
    List<community.FollowUserModel>? communityUsers,
    String? communityUserId,
    String? communityFilter,
    String? communityError,
    bool? communityHasMore,
    int? communityPage,
  }) {
    return FollowsState(
      status: status ?? this.status,
      errorMessage: errorMessage,
      followingStatus: followingStatus ?? this.followingStatus,
      followCounts: followCounts ?? this.followCounts,
      myFollowersCount: myFollowersCount ?? this.myFollowersCount,
      myFollowingCount: myFollowingCount ?? this.myFollowingCount,
      // Community
      communityStatus: communityStatus ?? this.communityStatus,
      communityUsers: communityUsers ?? this.communityUsers,
      communityUserId: communityUserId ?? this.communityUserId,
      communityFilter: communityFilter ?? this.communityFilter,
      communityError: communityError,
      communityHasMore: communityHasMore ?? this.communityHasMore,
      communityPage: communityPage ?? this.communityPage,
    );
  }

  @override
  List<Object?> get props => [
    status, 
    errorMessage, 
    followingStatus, 
    followCounts,
    myFollowersCount,
    myFollowingCount,
    communityStatus,
    communityUsers,
    communityUserId,
    communityFilter,
    communityError,
    communityHasMore,
    communityPage,
  ];
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
