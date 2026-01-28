import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dres/core/services/api_exception.dart';
import 'package:dres/features/sell/data/repositories/sell_repository.dart';
import 'package:dres/features/sell/logic/style_details_bloc/style_details_event.dart';
import 'package:dres/features/sell/logic/style_details_bloc/style_details_state.dart';

export 'style_details_event.dart';
export 'style_details_state.dart';

class StyleDetailsBloc extends Bloc<StyleDetailsEvent, StyleDetailsState> {
  final SellRepository _sellRepository;

  StyleDetailsBloc({required SellRepository sellRepository})
    : _sellRepository = sellRepository,
      super(const StyleDetailsState()) {
    on<StyleDetailsCreateRequested>(_onCreateRequested);
    on<StyleDetailsLoadRequested>(_onLoadRequested);
    on<StyleDetailsUpdateRequested>(_onUpdateRequested);
    on<StyleDetailsReset>(_onReset);
    on<StyleDetailsPublishRequested>(_onPublishRequested);
    on<StyleDetailsUnpublishRequested>(_onUnpublishRequested);
  }

  Future<void> _onCreateRequested(
    StyleDetailsCreateRequested event,
    Emitter<StyleDetailsState> emit,
  ) async {
    emit(state.copyWith(status: StyleDetailsStatus.creating));

    try {
      final response = await _sellRepository.createStyle();
      emit(
        state.copyWith(
          status: StyleDetailsStatus.createSuccess,
          styleId: response.id,
        ),
      );
    } catch (e) {
      emit(
        state.copyWith(
          status: StyleDetailsStatus.failure,
          errorMessage: getErrorMessage(e),
        ),
      );
    }
  }

  Future<void> _onLoadRequested(
    StyleDetailsLoadRequested event,
    Emitter<StyleDetailsState> emit,
  ) async {
    emit(
      state.copyWith(
        status: StyleDetailsStatus.loading,
        styleId: event.styleId,
      ),
    );

    try {
      final details = await _sellRepository.getStyleDetails(event.styleId);
      emit(
        state.copyWith(
          status: StyleDetailsStatus.loaded,
          styleDetails: details,
        ),
      );
    } catch (e) {
      emit(
        state.copyWith(
          status: StyleDetailsStatus.failure,
          errorMessage: getErrorMessage(e),
        ),
      );
    }
  }

  Future<void> _onUpdateRequested(
    StyleDetailsUpdateRequested event,
    Emitter<StyleDetailsState> emit,
  ) async {
    emit(state.copyWith(status: StyleDetailsStatus.updating));

    try {
      final request = UpdateStyleDetailsRequest(
        title: event.title,
        description: event.description,
        departmentId: event.departmentId,
        collectionId: event.collectionId,
        categoryId: event.categoryId,
        brandId: event.brandId,
        authenticity: event.authenticity,
      );

      await _sellRepository.updateStyleDetails(
        styleId: event.styleId,
        request: request,
      );

      emit(state.copyWith(status: StyleDetailsStatus.updateSuccess));
    } catch (e) {
      emit(
        state.copyWith(
          status: StyleDetailsStatus.failure,
          errorMessage: getErrorMessage(e),
        ),
      );
    }
  }

  void _onReset(StyleDetailsReset event, Emitter<StyleDetailsState> emit) {
    emit(const StyleDetailsState());
  }

  Future<void> _onPublishRequested(
    StyleDetailsPublishRequested event,
    Emitter<StyleDetailsState> emit,
  ) async {
    emit(state.copyWith(status: StyleDetailsStatus.publishing));

    try {
      await _sellRepository.publishStyle(event.styleId);

      // Reload the style details to get updated status
      final details = await _sellRepository.getStyleDetails(event.styleId);

      emit(state.copyWith(
        status: StyleDetailsStatus.publishSuccess,
        styleDetails: details,
      ));
    } catch (e) {
      emit(
        state.copyWith(
          status: StyleDetailsStatus.failure,
          errorMessage: getErrorMessage(e),
        ),
      );
    }
  }

  Future<void> _onUnpublishRequested(
    StyleDetailsUnpublishRequested event,
    Emitter<StyleDetailsState> emit,
  ) async {
    emit(state.copyWith(status: StyleDetailsStatus.unpublishing));

    try {
      await _sellRepository.unpublishStyle(event.styleId);

      // Reload the style details to get updated status
      final details = await _sellRepository.getStyleDetails(event.styleId);

      emit(state.copyWith(
        status: StyleDetailsStatus.unpublishSuccess,
        styleDetails: details,
      ));
    } catch (e) {
      emit(
        state.copyWith(
          status: StyleDetailsStatus.failure,
          errorMessage: getErrorMessage(e),
        ),
      );
    }
  }
}
