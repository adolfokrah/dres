import 'package:flutter/foundation.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dres/features/favorites/data/repositories/favorites_repository.dart';
import 'favorites_event.dart';
import 'favorites_state.dart';

export 'favorites_event.dart';
export 'favorites_state.dart';

class FavoritesBloc extends Bloc<FavoritesEvent, FavoritesState> {
  final FavoritesRepository _favoritesRepository;
  static const int _pageSize = 20;

  FavoritesBloc({
    required FavoritesRepository favoritesRepository,
  })  : _favoritesRepository = favoritesRepository,
        super(const FavoritesState()) {
    on<FavoritesFetchRequested>(_onFetchRequested);
    on<FavoritesLoadMoreRequested>(_onLoadMoreRequested);
    on<FavoritesRefreshRequested>(_onRefreshRequested);
    on<FavoritesItemRemoved>(_onItemRemoved);
    on<FavoritesToggleRequested>(_onToggleRequested);
  }

  Future<void> _onFetchRequested(
    FavoritesFetchRequested event,
    Emitter<FavoritesState> emit,
  ) async {
    emit(state.copyWith(
      status: FavoritesStatus.loading,
      currentPage: 1,
    ));

    try {
      debugPrint('❤️ Fetching favorites...');
      final response = await _favoritesRepository.getMyFavorites(
        page: 1,
        limit: _pageSize,
      );
      debugPrint('❤️ Fetched ${response.docs.length} favorites');

      // Build the set of favorited variation IDs
      final favoritedIds = response.docs.map((item) => item.id).toSet();

      emit(state.copyWith(
        status: FavoritesStatus.success,
        items: response.docs,
        hasMore: response.hasNextPage,
        currentPage: response.page,
        totalDocs: response.totalDocs,
        favoritedVariationIds: favoritedIds,
      ));
    } catch (e, stackTrace) {
      debugPrint('❤️ Error fetching favorites: $e');
      debugPrint('❤️ Stack trace: $stackTrace');
      emit(state.copyWith(
        status: FavoritesStatus.error,
        error: e.toString(),
      ));
    }
  }

  Future<void> _onLoadMoreRequested(
    FavoritesLoadMoreRequested event,
    Emitter<FavoritesState> emit,
  ) async {
    if (!state.hasMore || state.status == FavoritesStatus.loading) return;

    try {
      final nextPage = state.currentPage + 1;
      final response = await _favoritesRepository.getMyFavorites(
        page: nextPage,
        limit: _pageSize,
      );

      // Add new favorited IDs to the set
      final newFavoritedIds = {...state.favoritedVariationIds};
      for (final item in response.docs) {
        newFavoritedIds.add(item.id);
      }

      emit(state.copyWith(
        items: [...state.items, ...response.docs],
        hasMore: response.hasNextPage,
        currentPage: response.page,
        favoritedVariationIds: newFavoritedIds,
      ));
    } catch (e) {
      debugPrint('❤️ Error loading more favorites: $e');
    }
  }

  Future<void> _onRefreshRequested(
    FavoritesRefreshRequested event,
    Emitter<FavoritesState> emit,
  ) async {
    add(const FavoritesFetchRequested());
  }

  Future<void> _onItemRemoved(
    FavoritesItemRemoved event,
    Emitter<FavoritesState> emit,
  ) async {
    // Store previous state for rollback
    final previousItems = state.items;
    final previousFavoritedIds = state.favoritedVariationIds;
    final previousTotalDocs = state.totalDocs;

    // Optimistically remove from list and set
    final updatedItems = state.items
        .where((item) => item.id != event.variationId)
        .toList();
    final updatedFavoritedIds = {...state.favoritedVariationIds}
      ..remove(event.variationId);
    
    emit(state.copyWith(
      items: updatedItems,
      totalDocs: state.totalDocs > 0 ? state.totalDocs - 1 : 0,
      favoritedVariationIds: updatedFavoritedIds,
    ));

    try {
      await _favoritesRepository.removeFromFavorites(event.variationId);
      debugPrint('❤️ Successfully removed favorite for variation ${event.variationId}');
    } catch (e) {
      debugPrint('❤️ Error removing favorite: $e');
      // Revert on error
      emit(state.copyWith(
        items: previousItems,
        totalDocs: previousTotalDocs,
        favoritedVariationIds: previousFavoritedIds,
      ));
    }
  }

  Future<void> _onToggleRequested(
    FavoritesToggleRequested event,
    Emitter<FavoritesState> emit,
  ) async {
    if (event.isFavorited) {
      // Remove from favorites
      add(FavoritesItemRemoved(
        favoriteId: '',
        variationId: event.variationId,
      ));
    } else {
      // Store previous state for rollback
      final previousFavoritedIds = state.favoritedVariationIds;
      final previousTotalDocs = state.totalDocs;

      // Optimistically add to favorited set
      final updatedFavoritedIds = {...state.favoritedVariationIds}
        ..add(event.variationId);
      
      emit(state.copyWith(
        totalDocs: state.totalDocs + 1,
        favoritedVariationIds: updatedFavoritedIds,
      ));

      try {
        await _favoritesRepository.addToFavorites(event.variationId);
        debugPrint('❤️ Successfully added favorite for variation ${event.variationId}');
        // Refresh to get the full item data (but don't wait for it)
        add(const FavoritesRefreshRequested());
      } catch (e) {
        debugPrint('❤️ Error adding favorite: $e');
        // Revert on error
        emit(state.copyWith(
          totalDocs: previousTotalDocs,
          favoritedVariationIds: previousFavoritedIds,
        ));
      }
    }
  }
}
