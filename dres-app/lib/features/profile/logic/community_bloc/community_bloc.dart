import 'package:flutter/foundation.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dres/features/profile/data/repositories/community_repository.dart';
import 'community_event.dart';
import 'community_state.dart';

export 'community_event.dart';
export 'community_state.dart';

class CommunityBloc extends Bloc<CommunityEvent, CommunityState> {
  final CommunityRepository _communityRepository;
  static const int _pageSize = 10;

  CommunityBloc({
    required CommunityRepository communityRepository,
  })  : _communityRepository = communityRepository,
        super(const CommunityState()) {
    on<CommunityFetchRequested>(_onFetchRequested);
    on<CommunityLoadMoreRequested>(_onLoadMoreRequested);
    on<CommunityRefreshRequested>(_onRefreshRequested);
    on<CommunityFilterChanged>(_onFilterChanged);
  }

  Future<void> _onFetchRequested(
    CommunityFetchRequested event,
    Emitter<CommunityState> emit,
  ) async {
    emit(state.copyWith(
      status: CommunityStatus.loading,
      userId: event.userId,
      filter: event.filter,
      currentPage: 1,
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
        status: CommunityStatus.success,
        users: response.users,
        hasMore: response.hasNextPage,
        currentPage: response.page,
      ));
    } catch (e, stackTrace) {
      debugPrint('👥 Error fetching community: $e');
      debugPrint('👥 Stack trace: $stackTrace');
      emit(state.copyWith(
        status: CommunityStatus.error,
        error: e.toString(),
      ));
    }
  }

  Future<void> _onLoadMoreRequested(
    CommunityLoadMoreRequested event,
    Emitter<CommunityState> emit,
  ) async {
    if (!state.hasMore || state.status == CommunityStatus.loading) return;
    if (state.userId == null) return;

    try {
      final nextPage = state.currentPage + 1;
      final response = await _communityRepository.getUserFollows(
        userId: state.userId!,
        filter: state.filter,
        page: nextPage,
        limit: _pageSize,
      );

      emit(state.copyWith(
        users: [...state.users, ...response.users],
        hasMore: response.hasNextPage,
        currentPage: response.page,
      ));
    } catch (e) {
      debugPrint('👥 Error loading more community: $e');
    }
  }

  Future<void> _onFilterChanged(
    CommunityFilterChanged event,
    Emitter<CommunityState> emit,
  ) async {
    if (state.userId == null) return;
    add(CommunityFetchRequested(userId: state.userId!, filter: event.filter));
  }

  Future<void> _onRefreshRequested(
    CommunityRefreshRequested event,
    Emitter<CommunityState> emit,
  ) async {
    if (state.userId == null) return;
    add(CommunityFetchRequested(userId: state.userId!, filter: state.filter));
  }
}
