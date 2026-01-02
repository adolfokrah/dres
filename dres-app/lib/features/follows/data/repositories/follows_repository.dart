import 'package:dres/core/services/api_service.dart';

class FollowsRepository {
  final ApiService _apiService;

  FollowsRepository({required ApiService apiService})
      : _apiService = apiService;

  /// Follow a user
  Future<FollowResponse> followUser(String userId) async {
    final response = await _apiService.post(
      '/follows/follow',
      data: {'userId': userId},
    );
    return FollowResponse.fromJson(response.data);
  }

  /// Unfollow a user
  Future<FollowResponse> unfollowUser(String userId) async {
    final response = await _apiService.post(
      '/follows/unfollow',
      data: {'userId': userId},
    );
    return FollowResponse.fromJson(response.data);
  }

  /// Check if current user is following a specific user
  Future<CheckFollowingResponse> checkFollowing(String userId) async {
    final response = await _apiService.get('/follows/check/$userId');
    return CheckFollowingResponse.fromJson(response.data);
  }

  /// Get follower and following counts for a user
  Future<FollowCountsResponse> getFollowCounts(String userId) async {
    final response = await _apiService.get('/follows/counts/$userId');
    return FollowCountsResponse.fromJson(response.data);
  }

  /// Get followers or following list for a user
  Future<UserFollowsResponse> getUserFollows({
    required String userId,
    required String filter, // 'followers' or 'following'
    int page = 1,
    int limit = 20,
  }) async {
    final response = await _apiService.get(
      '/follows/user-follows/$userId',
      queryParameters: {
        'filter': filter,
        'page': page,
        'limit': limit,
      },
    );
    return UserFollowsResponse.fromJson(response.data);
  }
}

/// Response model for follow/unfollow operations
class FollowResponse {
  final bool success;
  final String message;
  final bool isFollowing;
  final String? followId;

  FollowResponse({
    required this.success,
    required this.message,
    required this.isFollowing,
    this.followId,
  });

  factory FollowResponse.fromJson(Map<String, dynamic> json) {
    return FollowResponse(
      success: json['success'] ?? false,
      message: json['message'] ?? '',
      isFollowing: json['isFollowing'] ?? false,
      followId: json['followId'],
    );
  }
}

/// Response model for checking follow status
class CheckFollowingResponse {
  final bool isFollowing;
  final bool isSelf;

  CheckFollowingResponse({
    required this.isFollowing,
    this.isSelf = false,
  });

  factory CheckFollowingResponse.fromJson(Map<String, dynamic> json) {
    return CheckFollowingResponse(
      isFollowing: json['isFollowing'] ?? false,
      isSelf: json['isSelf'] ?? false,
    );
  }
}

/// Response model for follow counts
class FollowCountsResponse {
  final int followers;
  final int following;

  FollowCountsResponse({
    required this.followers,
    required this.following,
  });

  factory FollowCountsResponse.fromJson(Map<String, dynamic> json) {
    return FollowCountsResponse(
      followers: json['followers'] ?? 0,
      following: json['following'] ?? 0,
    );
  }
}

/// Model for a user in followers/following list
class FollowUserModel {
  final String id;
  final String name;
  final String? username;
  final String? avatar;
  final DateTime followedAt;

  FollowUserModel({
    required this.id,
    required this.name,
    this.username,
    this.avatar,
    required this.followedAt,
  });

  factory FollowUserModel.fromJson(Map<String, dynamic> json) {
    return FollowUserModel(
      id: json['id'] ?? '',
      name: json['name'] ?? 'Unknown',
      username: json['username'],
      avatar: json['avatar'],
      followedAt: json['followedAt'] != null
          ? DateTime.parse(json['followedAt'])
          : DateTime.now(),
    );
  }
}

/// Response model for user follows list
class UserFollowsResponse {
  final List<FollowUserModel> users;
  final int totalDocs;
  final int totalPages;
  final int page;
  final int limit;
  final bool hasNextPage;
  final bool hasPrevPage;

  UserFollowsResponse({
    required this.users,
    required this.totalDocs,
    required this.totalPages,
    required this.page,
    required this.limit,
    required this.hasNextPage,
    required this.hasPrevPage,
  });

  factory UserFollowsResponse.fromJson(Map<String, dynamic> json) {
    return UserFollowsResponse(
      users: (json['users'] as List<dynamic>?)
              ?.map((u) => FollowUserModel.fromJson(u))
              .toList() ??
          [],
      totalDocs: json['totalDocs'] ?? 0,
      totalPages: json['totalPages'] ?? 1,
      page: json['page'] ?? 1,
      limit: json['limit'] ?? 20,
      hasNextPage: json['hasNextPage'] ?? false,
      hasPrevPage: json['hasPrevPage'] ?? false,
    );
  }
}
