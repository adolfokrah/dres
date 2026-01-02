import 'package:flutter/foundation.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:dres/features/follows/data/repositories/follows_repository.dart';

part 'follows_event.dart';
part 'follows_state.dart';

class FollowsBloc extends Bloc<FollowsEvent, FollowsState> {
  final FollowsRepository _followsRepository;

  FollowsBloc({required FollowsRepository followsRepository})
      : _followsRepository = followsRepository,
        super(const FollowsState()) {
    on<FollowsCheckRequested>(_onCheckRequested);
    on<FollowsToggleRequested>(_onToggleRequested);
    on<FollowsCountsRequested>(_onCountsRequested);
    on<FollowsClearRequested>(_onClearRequested);
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
    
    // Optimistic update
    final optimisticStatus = Map<String, bool>.from(state.followingStatus);
    optimisticStatus[event.userId] = newFollowingState;
    
    // Also optimistically update counts
    final optimisticCounts = Map<String, FollowCounts>.from(state.followCounts);
    final currentCounts = state.followCounts[event.userId];
    if (currentCounts != null) {
      optimisticCounts[event.userId] = FollowCounts(
        followers: currentCounts.followers + (newFollowingState ? 1 : -1),
        following: currentCounts.following,
      );
    }
    
    emit(state.copyWith(
      followingStatus: optimisticStatus,
      followCounts: optimisticCounts,
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
      
      emit(state.copyWith(
        status: FollowsStatus.error,
        errorMessage: 'Failed to ${newFollowingState ? 'follow' : 'unfollow'} user',
        followingStatus: revertedStatus,
        followCounts: revertedCounts,
      ));
    }
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
}
