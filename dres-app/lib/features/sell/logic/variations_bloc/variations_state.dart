import 'package:equatable/equatable.dart';
import 'package:dres/features/sell/data/models/variation_model.dart';

enum VariationsStatus {
  initial,
  loading,
  loaded,
  creating,
  createSuccess,
  deleting,
  deleteSuccess,
  failure,
}

class VariationsState extends Equatable {
  final VariationsStatus status;
  final String? styleId;
  final List<VariationModel> variations;
  final String? errorMessage;
  final String? createdVariationId;

  const VariationsState({
    this.status = VariationsStatus.initial,
    this.styleId,
    this.variations = const [],
    this.errorMessage,
    this.createdVariationId,
  });

  VariationsState copyWith({
    VariationsStatus? status,
    String? styleId,
    List<VariationModel>? variations,
    String? errorMessage,
    String? createdVariationId,
  }) {
    return VariationsState(
      status: status ?? this.status,
      styleId: styleId ?? this.styleId,
      variations: variations ?? this.variations,
      errorMessage: errorMessage,
      createdVariationId: createdVariationId,
    );
  }

  @override
  List<Object?> get props => [
        status,
        styleId,
        variations,
        errorMessage,
        createdVariationId,
      ];
}
