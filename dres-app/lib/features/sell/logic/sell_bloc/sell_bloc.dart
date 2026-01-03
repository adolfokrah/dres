import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dres/features/sell/data/repositories/sell_repository.dart';

part 'sell_event.dart';
part 'sell_state.dart';

class SellBloc extends Bloc<SellEvent, SellState> {
  final SellRepository _sellRepository;

  SellBloc({required SellRepository sellRepository})
    : _sellRepository = sellRepository,
      super(const SellState()) {
    on<SellFetchDraftsRequested>(_onFetchDraftsRequested);
    on<SellRefreshRequested>(_onRefreshRequested);
  }

  Future<void> _onFetchDraftsRequested(
    SellFetchDraftsRequested event,
    Emitter<SellState> emit,
  ) async {
    emit(state.copyWith(status: SellStatus.loading));

    try {
      final response = await _sellRepository.getMyDraftStyles();
      emit(
        state.copyWith(
          status: SellStatus.success,
          drafts: response.drafts,
          totalDrafts: response.totalDrafts,
        ),
      );
    } catch (e) {
      emit(
        state.copyWith(status: SellStatus.failure, errorMessage: e.toString()),
      );
    }
  }

  Future<void> _onRefreshRequested(
    SellRefreshRequested event,
    Emitter<SellState> emit,
  ) async {
    try {
      final response = await _sellRepository.getMyDraftStyles();
      emit(
        state.copyWith(
          status: SellStatus.success,
          drafts: response.drafts,
          totalDrafts: response.totalDrafts,
        ),
      );
    } catch (e) {
      emit(
        state.copyWith(status: SellStatus.failure, errorMessage: e.toString()),
      );
    }
  }
}
