import 'package:equatable/equatable.dart';
import 'package:dres/features/favorites/data/models/favorite_item_model.dart';

enum FavoritesStatus { initial, loading, success, error }

class FavoritesState extends Equatable {
  final FavoritesStatus status;
  final List<FavoriteItemModel> items;
  final String? error;
  final bool hasMore;
  final int currentPage;
  final int totalDocs;
  
  /// Set of variation IDs that are currently favorited (for optimistic UI updates)
  final Set<String> favoritedVariationIds;

  const FavoritesState({
    this.status = FavoritesStatus.initial,
    this.items = const [],
    this.error,
    this.hasMore = true,
    this.currentPage = 1,
    this.totalDocs = 0,
    this.favoritedVariationIds = const {},
  });

  FavoritesState copyWith({
    FavoritesStatus? status,
    List<FavoriteItemModel>? items,
    String? error,
    bool? hasMore,
    int? currentPage,
    int? totalDocs,
    Set<String>? favoritedVariationIds,
  }) {
    return FavoritesState(
      status: status ?? this.status,
      items: items ?? this.items,
      error: error,
      hasMore: hasMore ?? this.hasMore,
      currentPage: currentPage ?? this.currentPage,
      totalDocs: totalDocs ?? this.totalDocs,
      favoritedVariationIds: favoritedVariationIds ?? this.favoritedVariationIds,
    );
  }

  /// Get display count string (e.g., "999+ items" or "5 items")
  String get itemCountDisplay {
    if (totalDocs > 999) {
      return '999+ items';
    } else if (totalDocs == 1) {
      return '1 item';
    } else {
      return '$totalDocs items';
    }
  }

  /// Check if a variation is favorited (uses optimistic set)
  bool isFavorited(String variationId) {
    return favoritedVariationIds.contains(variationId);
  }

  /// Get favorite ID for a variation
  String? getFavoriteId(String variationId) {
    try {
      return items.firstWhere((item) => item.id == variationId).favoriteId;
    } catch (_) {
      return null;
    }
  }

  @override
  List<Object?> get props => [
        status,
        items,
        error,
        hasMore,
        currentPage,
        totalDocs,
        favoritedVariationIds,
      ];
}
