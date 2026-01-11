import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dres/features/sell/data/repositories/style_stats_repository.dart';

part 'style_stats_event.dart';
part 'style_stats_state.dart';

class StyleStatsBloc extends Bloc<StyleStatsEvent, StyleStatsState> {
  final StyleStatsRepository _styleStatsRepository;

  StyleStatsBloc({required StyleStatsRepository styleStatsRepository})
      : _styleStatsRepository = styleStatsRepository,
        super(const StyleStatsState()) {
    on<StyleStatsLoadRequested>(_onLoadRequested);
    on<StyleStatsRefreshRequested>(_onRefreshRequested);
  }

  Future<void> _onLoadRequested(
    StyleStatsLoadRequested event,
    Emitter<StyleStatsState> emit,
  ) async {
    emit(state.copyWith(
      status: StyleStatsStatus.loading,
      styleId: event.styleId,
    ));

    try {
      final stats = await _styleStatsRepository.getStyleStats(event.styleId);
      emit(state.copyWith(
        status: StyleStatsStatus.success,
        stats: stats,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: StyleStatsStatus.failure,
        errorMessage: e.toString(),
      ));
    }
  }

  Future<void> _onRefreshRequested(
    StyleStatsRefreshRequested event,
    Emitter<StyleStatsState> emit,
  ) async {
    final styleId = state.styleId;
    if (styleId == null) return;

    // Don't show loading, just refresh in background
    try {
      final stats = await _styleStatsRepository.getStyleStats(styleId);
      emit(state.copyWith(
        status: StyleStatsStatus.success,
        stats: stats,
      ));
    } catch (e) {
      // Keep existing data on refresh failure
    }
  }
}
