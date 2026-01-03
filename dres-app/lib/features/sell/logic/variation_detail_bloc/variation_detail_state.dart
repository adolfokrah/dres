import 'package:equatable/equatable.dart';
import 'package:dres/features/sell/data/models/attribute_model.dart';
import 'package:dres/features/sell/data/models/variation_model.dart';

enum VariationDetailStatus {
  initial,
  loading,
  loaded,
  updating,
  updateSuccess,
  skuCreating,
  skuCreateSuccess,
  skuUpdating,
  skuUpdateSuccess,
  skuDeleting,
  skuDeleteSuccess,
  failure,
}

class VariationDetailState extends Equatable {
  final VariationDetailStatus status;
  final String? variationId;
  final VariationModel? variation;
  final List<SkuModel> skus;
  final List<AttributeModel> availableAttributes;
  final String? errorMessage;

  const VariationDetailState({
    this.status = VariationDetailStatus.initial,
    this.variationId,
    this.variation,
    this.skus = const [],
    this.availableAttributes = const [],
    this.errorMessage,
  });

  /// Get only variation-level attributes
  List<AttributeModel> get variationAttributes =>
      availableAttributes.where((a) => a.isVariationLevel).toList();

  /// Get only SKU-level attributes
  List<AttributeModel> get skuAttributes =>
      availableAttributes.where((a) => a.isSkuLevel).toList();

  VariationDetailState copyWith({
    VariationDetailStatus? status,
    String? variationId,
    VariationModel? variation,
    List<SkuModel>? skus,
    List<AttributeModel>? availableAttributes,
    String? errorMessage,
  }) {
    return VariationDetailState(
      status: status ?? this.status,
      variationId: variationId ?? this.variationId,
      variation: variation ?? this.variation,
      skus: skus ?? this.skus,
      availableAttributes: availableAttributes ?? this.availableAttributes,
      errorMessage: errorMessage,
    );
  }

  @override
  List<Object?> get props => [
        status,
        variationId,
        variation,
        skus,
        availableAttributes,
        errorMessage,
      ];
}
