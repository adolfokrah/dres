import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dres/features/sell/data/repositories/sell_repository.dart';
import 'package:dres/features/sell/logic/variations_bloc/variations_event.dart';
import 'package:dres/features/sell/logic/variations_bloc/variations_state.dart';

export 'variations_event.dart';
export 'variations_state.dart';

class VariationsBloc extends Bloc<VariationsEvent, VariationsState> {
  final SellRepository _sellRepository;

  VariationsBloc({required SellRepository sellRepository})
    : _sellRepository = sellRepository,
      super(const VariationsState()) {
    on<VariationsLoadRequested>(_onLoadRequested);
    on<VariationsRefreshRequested>(_onRefreshRequested);
    on<VariationCreateRequested>(_onCreateRequested);
    on<VariationDeleteRequested>(_onDeleteRequested);
  }

  Future<void> _onLoadRequested(
    VariationsLoadRequested event,
    Emitter<VariationsState> emit,
  ) async {
    emit(
      state.copyWith(status: VariationsStatus.loading, styleId: event.styleId),
    );

    try {
      final response = await _sellRepository.getStyleVariations(event.styleId);
      emit(
        state.copyWith(
          status: VariationsStatus.loaded,
          variations: response.variations,
        ),
      );
    } catch (e) {
      emit(
        state.copyWith(
          status: VariationsStatus.failure,
          errorMessage: e.toString(),
        ),
      );
    }
  }

  Future<void> _onRefreshRequested(
    VariationsRefreshRequested event,
    Emitter<VariationsState> emit,
  ) async {
    if (state.styleId == null) return;

    try {
      final response = await _sellRepository.getStyleVariations(state.styleId!);
      emit(
        state.copyWith(
          status: VariationsStatus.loaded,
          variations: response.variations,
        ),
      );
    } catch (e) {
      emit(
        state.copyWith(
          status: VariationsStatus.failure,
          errorMessage: e.toString(),
        ),
      );
    }
  }

  Future<void> _onCreateRequested(
    VariationCreateRequested event,
    Emitter<VariationsState> emit,
  ) async {
    emit(state.copyWith(status: VariationsStatus.creating));

    try {
      final request = CreateVariationRequest(
        styleId: event.styleId,
        variants: event.variants,
      );

      final response = await _sellRepository.createVariation(request);

      // Refresh variations list
      final updatedVariations = await _sellRepository.getStyleVariations(
        event.styleId,
      );

      emit(
        state.copyWith(
          status: VariationsStatus.createSuccess,
          variations: updatedVariations.variations,
          createdVariationId: response.id,
        ),
      );
    } catch (e) {
      emit(
        state.copyWith(
          status: VariationsStatus.failure,
          errorMessage: e.toString(),
        ),
      );
    }
  }

  Future<void> _onDeleteRequested(
    VariationDeleteRequested event,
    Emitter<VariationsState> emit,
  ) async {
    emit(state.copyWith(status: VariationsStatus.deleting));

    try {
      await _sellRepository.deleteVariation(event.variationId);

      // Remove from local list
      final updatedVariations = state.variations
          .where((v) => v.id != event.variationId)
          .toList();

      emit(
        state.copyWith(
          status: VariationsStatus.deleteSuccess,
          variations: updatedVariations,
        ),
      );
    } catch (e) {
      emit(
        state.copyWith(
          status: VariationsStatus.failure,
          errorMessage: e.toString(),
        ),
      );
    }
  }
}
