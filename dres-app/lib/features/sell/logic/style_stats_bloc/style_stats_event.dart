part of 'style_stats_bloc.dart';

abstract class StyleStatsEvent extends Equatable {
  const StyleStatsEvent();

  @override
  List<Object?> get props => [];
}

/// Load stats for a style
class StyleStatsLoadRequested extends StyleStatsEvent {
  final String styleId;

  const StyleStatsLoadRequested({required this.styleId});

  @override
  List<Object?> get props => [styleId];
}

/// Refresh stats
class StyleStatsRefreshRequested extends StyleStatsEvent {
  const StyleStatsRefreshRequested();
}
