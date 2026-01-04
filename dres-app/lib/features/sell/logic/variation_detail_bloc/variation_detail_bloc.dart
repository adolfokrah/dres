import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dres/core/services/api_exception.dart';
import 'package:dres/features/sell/data/models/attribute_model.dart';
import 'package:dres/features/sell/data/repositories/sell_repository.dart';
import 'package:dres/features/sell/logic/variation_detail_bloc/variation_detail_event.dart';
import 'package:dres/features/sell/logic/variation_detail_bloc/variation_detail_state.dart';

export 'variation_detail_event.dart';
export 'variation_detail_state.dart';

class VariationDetailBloc
    extends Bloc<VariationDetailEvent, VariationDetailState> {
  final SellRepository _sellRepository;

  VariationDetailBloc({required SellRepository sellRepository})
    : _sellRepository = sellRepository,
      super(const VariationDetailState()) {
    on<VariationDetailLoadRequested>(_onLoadRequested);
    on<VariationUpdateRequested>(_onUpdateRequested);
    on<VariationArchiveRequested>(_onVariationArchiveRequested);
    on<VariationImageRemoveRequested>(_onImageRemoveRequested);
    on<SkuCreateRequested>(_onSkuCreateRequested);
    on<SkuUpdateRequested>(_onSkuUpdateRequested);
    on<SkuDeleteRequested>(_onSkuDeleteRequested);
    on<SkuArchiveRequested>(_onSkuArchiveRequested);
  }

  Future<void> _onLoadRequested(
    VariationDetailLoadRequested event,
    Emitter<VariationDetailState> emit,
  ) async {
    emit(
      state.copyWith(
        status: VariationDetailStatus.loading,
        variationId: event.variationId,
      ),
    );

    try {
      final variation = await _sellRepository.getVariationDetails(
        event.variationId,
      );
      final skus = await _sellRepository.getVariationSkus(event.variationId);

      // Fetch attributes for the category if provided
      List<AttributeModel> attributes = [];
      String? categoryId = event.categoryId ?? variation.style?.category;

      // If no category ID, try to fetch from style details
      if ((categoryId == null || categoryId.isEmpty) &&
          variation.styleId.isNotEmpty) {
        try {
          final styleDetails = await _sellRepository.getStyleDetails(
            variation.styleId,
          );
          categoryId = styleDetails.categoryId;
        } catch (e) {
          // Ignore - will proceed without category
        }
      }

      if (categoryId != null && categoryId.isNotEmpty) {
        final attributesResponse = await _sellRepository.getCategoryAttributes(
          categoryId,
        );
        attributes = attributesResponse.attributes;
      }

      emit(
        state.copyWith(
          status: VariationDetailStatus.loaded,
          variation: variation,
          skus: skus,
          availableAttributes: attributes,
        ),
      );
    } catch (e) {
      emit(
        state.copyWith(
          status: VariationDetailStatus.failure,
          errorMessage: getErrorMessage(e),
        ),
      );
    }
  }

  Future<void> _onUpdateRequested(
    VariationUpdateRequested event,
    Emitter<VariationDetailState> emit,
  ) async {
    emit(state.copyWith(status: VariationDetailStatus.updating));

    try {
      // Upload new images first and collect their IDs
      final List<String> uploadedImageIds = [];
      for (final image in event.newImages) {
        final mediaId = await _sellRepository.uploadImage(image);
        uploadedImageIds.add(mediaId);
      }

      // Combine existing image IDs with newly uploaded ones
      final allImageIds = [...event.existingImageIds, ...uploadedImageIds];

      // Convert variants to the format expected by the API
      final variants = event.variants
          .map((v) => {'variant': v.attributeId, 'value': v.valueId})
          .toList();

      await _sellRepository.updateVariation(
        variationId: event.variationId,
        variants: variants,
        imageIds: allImageIds,
      );

      // Refetch variation details after update
      final variation = await _sellRepository.getVariationDetails(
        event.variationId,
      );
      final skus = await _sellRepository.getVariationSkus(event.variationId);

      emit(
        state.copyWith(
          status: VariationDetailStatus.updateSuccess,
          variation: variation,
          skus: skus,
        ),
      );
    } catch (e) {
      emit(
        state.copyWith(
          status: VariationDetailStatus.failure,
          errorMessage: getErrorMessage(e),
        ),
      );
    }
  }

  Future<void> _onImageRemoveRequested(
    VariationImageRemoveRequested event,
    Emitter<VariationDetailState> emit,
  ) async {
    emit(state.copyWith(status: VariationDetailStatus.imageRemoving));

    try {
      // Get current images and remove the one at the specified index
      final currentImages = List<String>.from(state.variation?.imageIds ?? []);
      if (event.imageIndex >= 0 && event.imageIndex < currentImages.length) {
        currentImages.removeAt(event.imageIndex);
      }

      // Update variation with the new image list
      await _sellRepository.removeVariationImage(
        variationId: event.variationId,
        imageIds: currentImages,
      );

      // Refresh variation details
      final variation = await _sellRepository.getVariationDetails(
        event.variationId,
      );

      emit(
        state.copyWith(
          status: VariationDetailStatus.imageRemoveSuccess,
          variation: variation,
        ),
      );
    } catch (e) {
      emit(
        state.copyWith(
          status: VariationDetailStatus.failure,
          errorMessage: getErrorMessage(e),
        ),
      );
    }
  }

  Future<void> _onSkuCreateRequested(
    SkuCreateRequested event,
    Emitter<VariationDetailState> emit,
  ) async {
    emit(state.copyWith(status: VariationDetailStatus.skuCreating));

    try {
      await _sellRepository.createSku(
        variationId: event.variationId,
        attributeId: event.attributeId,
        attributeOptionId: event.attributeOptionId,
        price: event.price,
        stock: event.stock,
      );

      // Refresh variation details and SKUs list
      final variation = await _sellRepository.getVariationDetails(
        event.variationId,
      );
      final skus = await _sellRepository.getVariationSkus(event.variationId);

      emit(
        state.copyWith(
          status: VariationDetailStatus.skuCreateSuccess,
          variation: variation,
          skus: skus,
        ),
      );
    } catch (e) {
      emit(
        state.copyWith(
          status: VariationDetailStatus.failure,
          errorMessage: getErrorMessage(e),
        ),
      );
    }
  }

  Future<void> _onSkuDeleteRequested(
    SkuDeleteRequested event,
    Emitter<VariationDetailState> emit,
  ) async {
    emit(state.copyWith(status: VariationDetailStatus.skuDeleting));

    try {
      await _sellRepository.deleteSku(event.skuId);

      // Remove from local list
      final updatedSkus = state.skus.where((s) => s.id != event.skuId).toList();

      emit(
        state.copyWith(
          status: VariationDetailStatus.skuDeleteSuccess,
          skus: updatedSkus,
        ),
      );
    } catch (e) {
      emit(
        state.copyWith(
          status: VariationDetailStatus.failure,
          errorMessage: getErrorMessage(e),
        ),
      );
    }
  }

  Future<void> _onSkuUpdateRequested(
    SkuUpdateRequested event,
    Emitter<VariationDetailState> emit,
  ) async {
    emit(state.copyWith(status: VariationDetailStatus.skuUpdating));

    try {
      await _sellRepository.updateSku(
        skuId: event.skuId,
        attributeId: event.attributeId,
        attributeOptionId: event.attributeOptionId,
        price: event.price,
        compareAtPrice: event.compareAtPrice,
        stock: event.stock,
      );

      // Refresh SKUs list
      if (state.variationId != null) {
        final skus = await _sellRepository.getVariationSkus(state.variationId!);
        emit(
          state.copyWith(
            status: VariationDetailStatus.skuUpdateSuccess,
            skus: skus,
          ),
        );
      } else {
        emit(state.copyWith(status: VariationDetailStatus.skuUpdateSuccess));
      }
    } catch (e) {
      emit(
        state.copyWith(
          status: VariationDetailStatus.failure,
          errorMessage: getErrorMessage(e),
        ),
      );
    }
  }

  Future<void> _onVariationArchiveRequested(
    VariationArchiveRequested event,
    Emitter<VariationDetailState> emit,
  ) async {
    emit(state.copyWith(status: VariationDetailStatus.archiving));

    try {
      await _sellRepository.archiveVariation(event.variationId);
      emit(state.copyWith(status: VariationDetailStatus.archiveSuccess));
    } catch (e) {
      emit(
        state.copyWith(
          status: VariationDetailStatus.failure,
          errorMessage: getErrorMessage(e),
        ),
      );
    }
  }

  Future<void> _onSkuArchiveRequested(
    SkuArchiveRequested event,
    Emitter<VariationDetailState> emit,
  ) async {
    emit(state.copyWith(status: VariationDetailStatus.skuArchiving));

    try {
      await _sellRepository.archiveSku(event.skuId);

      // Refresh SKUs list
      if (state.variationId != null) {
        final skus = await _sellRepository.getVariationSkus(state.variationId!);
        emit(
          state.copyWith(
            status: VariationDetailStatus.skuArchiveSuccess,
            skus: skus,
          ),
        );
      } else {
        emit(state.copyWith(status: VariationDetailStatus.skuArchiveSuccess));
      }
    } catch (e) {
      emit(
        state.copyWith(
          status: VariationDetailStatus.failure,
          errorMessage: getErrorMessage(e),
        ),
      );
    }
  }
}
