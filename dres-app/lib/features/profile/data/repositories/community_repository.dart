import 'package:flutter/foundation.dart';
import 'package:dres/core/services/api_service.dart';
import 'package:dres/features/profile/data/models/follow_user_model.dart';

export 'package:dres/features/profile/data/models/follow_user_model.dart';

class CommunityRepository {
  final ApiService _apiService;

  CommunityRepository({required ApiService apiService}) : _apiService = apiService;

  /// Fetch user's followers or following
  /// [userId] - The user ID to get followers/following for
  /// [filter] - 'followers' or 'following'
  Future<UserFollowsResponse> getUserFollows({
    required String userId,
    required String filter,
    int page = 1,
    int limit = 10,
  }) async {
    final queryParams = <String, dynamic>{
      'filter': filter,
      'page': page,
      'limit': limit,
    };

    final response = await _apiService.get(
      '/follows/user-follows/$userId',
      queryParameters: queryParams,
    );
    
    debugPrint('👥 CommunityRepository: Raw response data: ${response.data}');
    
    final result = UserFollowsResponse.fromJson(response.data);
    
    debugPrint('👥 CommunityRepository: Parsed ${result.users.length} users');
    
    return result;
  }
}
