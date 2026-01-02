/// Follow user model for community list
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

/// User follows response with pagination
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
              ?.map((e) => FollowUserModel.fromJson(e))
              .toList() ??
          [],
      totalDocs: json['totalDocs'] ?? 0,
      totalPages: json['totalPages'] ?? 1,
      page: json['page'] ?? 1,
      limit: json['limit'] ?? 10,
      hasNextPage: json['hasNextPage'] ?? false,
      hasPrevPage: json['hasPrevPage'] ?? false,
    );
  }
}
