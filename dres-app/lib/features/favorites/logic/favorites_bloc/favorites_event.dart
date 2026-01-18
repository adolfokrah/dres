import 'package:equatable/equatable.dart';

abstract class FavoritesEvent extends Equatable {
  const FavoritesEvent();

  @override
  List<Object?> get props => [];
}

/// Event to fetch favorites
class FavoritesFetchRequested extends FavoritesEvent {
  const FavoritesFetchRequested();
}

/// Event to load more favorites
class FavoritesLoadMoreRequested extends FavoritesEvent {
  const FavoritesLoadMoreRequested();
}

/// Event to refresh favorites
class FavoritesRefreshRequested extends FavoritesEvent {
  const FavoritesRefreshRequested();
}

/// Event to remove item from favorites
class FavoritesItemRemoved extends FavoritesEvent {
  final String favoriteId;
  final String variationId;

  const FavoritesItemRemoved({
    required this.favoriteId,
    required this.variationId,
  });

  @override
  List<Object?> get props => [favoriteId, variationId];
}

/// Event to toggle favorite (add/remove)
class FavoritesToggleRequested extends FavoritesEvent {
  final String variationId;
  final bool isFavorited;

  const FavoritesToggleRequested({
    required this.variationId,
    required this.isFavorited,
  });

  @override
  List<Object?> get props => [variationId, isFavorited];
}

/// Clear favorites state (e.g., on logout)
class FavoritesClearRequested extends FavoritesEvent {
  const FavoritesClearRequested();
}
