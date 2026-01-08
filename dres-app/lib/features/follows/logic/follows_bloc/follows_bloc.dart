import 'package:flutter/foundation.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:dres/features/follows/data/repositories/follows_repository.dart';
import 'package:dres/features/profile/data/repositories/community_repository.dart';
import 'package:dres/features/profile/data/models/follow_user_model.dart' as community;

part 'follows_event.dart';
part 'follows_state.dart';

class FollowsBloc extends Bloc<FollowsEvent, FollowsState> {
  final FollowsRepository _followsRepository;
  final CommunityRepository _communityRepository;
  static const int _pageSize = 10;

  FollowsBloc({
    required FollowsRepository followsRepository,
    required CommunityRepository communityRepository,
  })  : _followsRepository = followsRepository,
        _communityRepository = communityRepository,
        super(const FollowsState()) {
    on<FollowsCheckRequested>(_onCheckRequested);
    on<FollowsToggleRequested>(_onToggleRequested);
    on<FollowsCountsRequested>(_onCountsRequested);
    on<MyFollowCountsInitRequested>(_onMyFollowCountsInitRequested);
    on<FollowsClearRequested>(_onClearRequested);
    // Community events
    on<CommunityFetchRequested>(_onCommunityFetchRequested);
    on<CommunityLoadMoreRequested>(_onCommunityLoadMoreRequested);
    on<CommunityRefreshRequested>(_onCommunityRefreshRequested);
    on<CommunityFilterChanged>(_onCommunityFilterChanged);
  }

  Future<void> _onCheckRequested(
    FollowsCheckRequested event,
    Emitter<FollowsState> emit,
  ) async {
    try {
      final response = await _followsRepository.checkFollowing(event.userId);
      
      final updatedStatus = Map<String, bool>.from(state.followingStatus);
      updatedStatus[event.userId] = response.isFollowing;
      
      emit(state.copyWith(
        status: FollowsStatus.success,
        followingStatus: updatedStatus,
      ));
    } catch (e) {
      debugPrint('Error checking follow status: $e');
      // Don't emit error state, just keep current state
    }
  }

  Future<void> _onToggleRequested(
    FollowsToggleRequested event,
    Emitter<FollowsState> emit,
  ) async {
    final newFollowingState = !event.isCurrentlyFollowing;
    
    // Optimistic update for follow status
    final optimisticStatus = Map<String, bool>.from(state.followingStatus);
    optimisticStatus[event.userId] = newFollowingState;
    
    // Optimistically update target user's follower count
    final optimisticCounts = Map<String, FollowCounts>.from(state.followCounts);
    final currentCounts = state.followCounts[event.userId];
    if (currentCounts != null) {
      optimisticCounts[event.userId] = FollowCounts(
        followers: currentCounts.followers + (newFollowingState ? 1 : -1),
        following: currentCounts.following,
      );
    }
    
    // Optimistically update MY following count
    final newMyFollowingCount = state.myFollowingCount + (newFollowingState ? 1 : -1);
    
    // Optimistically update community list
    List<community.FollowUserModel> updatedCommunityUsers = List.from(state.communityUsers);
    if (state.communityFilter == 'following') {
      if (newFollowingState && event.userName != null) {
        // Add user to following list
        updatedCommunityUsers.insert(0, community.FollowUserModel(
          id: event.userId,
          name: event.userName!,
          username: event.userUsername,
          avatar: event.userAvatar,
          followedAt: DateTime.now(),
        ));
      } else if (!newFollowingState) {
        // Remove user from following list
        updatedCommunityUsers.removeWhere((u) => u.id == event.userId);
      }
    }
    
    emit(state.copyWith(
      followingStatus: optimisticStatus,
      followCounts: optimisticCounts,
      myFollowingCount: newMyFollowingCount < 0 ? 0 : newMyFollowingCount,
      communityUsers: updatedCommunityUsers,
    ));

    try {
      if (newFollowingState) {
        // Follow
        await _followsRepository.followUser(event.userId);
        debugPrint('Successfully followed user ${event.userId}');
      } else {
        // Unfollow
        await _followsRepository.unfollowUser(event.userId);
        debugPrint('Successfully unfollowed user ${event.userId}');
      }
      
      // Refresh counts after successful operation
      try {
        final counts = await _followsRepository.getFollowCounts(event.userId);
        final updatedCounts = Map<String, FollowCounts>.from(state.followCounts);
        updatedCounts[event.userId] = FollowCounts(
          followers: counts.followers,
          following: counts.following,
        );
        emit(state.copyWith(followCounts: updatedCounts));
      } catch (_) {
        // Ignore count refresh errors
      }
    } catch (e) {
      debugPrint('Error toggling follow: $e');
      
      // Revert optimistic update on error
      final revertedStatus = Map<String, bool>.from(state.followingStatus);
      revertedStatus[event.userId] = event.isCurrentlyFollowing;
      
      // Revert counts
      final revertedCounts = Map<String, FollowCounts>.from(state.followCounts);
      if (currentCounts != null) {
        revertedCounts[event.userId] = currentCounts;
      }
      
      // Revert my following count
      final revertedMyFollowingCount = state.myFollowingCount + (newFollowingState ? -1 : 1);
      
      emit(state.copyWith(
        status: FollowsStatus.error,
        errorMessage: 'Failed to ${newFollowingState ? 'follow' : 'unfollow'} user',
        followingStatus: revertedStatus,
        followCounts: revertedCounts,
        myFollowingCount: revertedMyFollowingCount < 0 ? 0 : revertedMyFollowingCount,
      ));
    }
  }
  
  void _onMyFollowCountsInitRequested(
    MyFollowCountsInitRequested event,
    Emitter<FollowsState> emit,
  ) {
    emit(state.copyWith(
      myFollowersCount: event.followersCount,
      myFollowingCount: event.followingCount,
    ));
  }

  Future<void> _onCountsRequested(
    FollowsCountsRequested event,
    Emitter<FollowsState> emit,
  ) async {
    try {
      final response = await _followsRepository.getFollowCounts(event.userId);
      
      final updatedCounts = Map<String, FollowCounts>.from(state.followCounts);
      updatedCounts[event.userId] = FollowCounts(
        followers: response.followers,
        following: response.following,
      );
      
      emit(state.copyWith(
        status: FollowsStatus.success,
        followCounts: updatedCounts,
      ));
    } catch (e) {
      debugPrint('Error getting follow counts: $e');
    }
  }

  void _onClearRequested(
    FollowsClearRequested event,
    Emitter<FollowsState> emit,
  ) {
    emit(const FollowsState());
  }

  // ============ Community Methods ============

  Future<void> _onCommunityFetchRequested(
    CommunityFetchRequested event,
    Emitter<FollowsState> emit,
  ) async {
    emit(state.copyWith(
      communityStatus: CommunityStatus.loading,
      communityUserId: event.userId,
      communityFilter: event.filter,
      communityPage: 1,
    ));

    try {
      debugPrint('👥 Fetching community for user ${event.userId} with filter: ${event.filter}');
      final response = await _communityRepository.getUserFollows(
        userId: event.userId,
        filter: event.filter,
        page: 1,
        limit: _pageSize,
      );
      debugPrint('👥 Fetched ${response.users.length} users');

      emit(state.copyWith(
        communityStatus: CommunityStatus.success,
        communityUsers: response.users,
        communityHasMore: response.hasNextPage,
        communityPage: response.page,
      ));
    } catch (e, stackTrace) {
      debugPrint('👥 Error fetching community: $e');
      debugPrint('👥 Stack trace: $stackTrace');
      emit(state.copyWith(
        communityStatus: CommunityStatus.error,
        communityError: e.toString(),
      ));
    }
  }

  Future<void> _onCommunityLoadMoreRequested(
    CommunityLoadMoreRequested event,
    Emitter<FollowsState> emit,
  ) async {
    if (!state.communityHasMore || state.communityStatus == CommunityStatus.loading) return;
    if (state.communityUserId == null) return;

    try {
      final nextPage = state.communityPage + 1;
      final response = await _communityRepository.getUserFollows(
        userId: state.communityUserId!,
        filter: state.communityFilter,
        page: nextPage,
        limit: _pageSize,
      );

      emit(state.copyWith(
        communityUsers: [...state.communityUsers, ...response.users],
        communityHasMore: response.hasNextPage,
        communityPage: response.page,
      ));
    } catch (e) {
      debugPrint('👥 Error loading more community: $e');
    }
  }

  Future<void> _onCommunityFilterChanged(
    CommunityFilterChanged event,
    Emitter<FollowsState> emit,
  ) async {
    if (state.communityUserId == null) return;
    add(CommunityFetchRequested(userId: state.communityUserId!, filter: event.filter));
  }

  Future<void> _onCommunityRefreshRequested(
    CommunityRefreshRequested event,
    Emitter<FollowsState> emit,
  ) async {
    if (state.communityUserId == null) return;
    add(CommunityFetchRequested(userId: state.communityUserId!, filter: state.communityFilter));
  }
}
