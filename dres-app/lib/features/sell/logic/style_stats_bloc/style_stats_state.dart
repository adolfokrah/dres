part of 'style_stats_bloc.dart';

enum StyleStatsStatus { initial, loading, success, failure }

class StyleStatsState extends Equatable {
  final StyleStatsStatus status;
  final StyleStatsModel? stats;
  final String? errorMessage;
  final String? styleId;

  const StyleStatsState({
    this.status = StyleStatsStatus.initial,
    this.stats,
    this.errorMessage,
    this.styleId,
  });

  StyleStatsState copyWith({
    StyleStatsStatus? status,
    StyleStatsModel? stats,
    String? errorMessage,
    String? styleId,
  }) {
    return StyleStatsState(
      status: status ?? this.status,
      stats: stats ?? this.stats,
      errorMessage: errorMessage ?? this.errorMessage,
      styleId: styleId ?? this.styleId,
    );
  }

  @override
  List<Object?> get props => [status, stats, errorMessage, styleId];
}
