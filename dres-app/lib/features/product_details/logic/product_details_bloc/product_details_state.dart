import 'package:equatable/equatable.dart';
import 'package:dres/features/product_details/data/models/product_details_model.dart';

enum ProductDetailsStatus { initial, loading, success, failure }

class ProductDetailsState extends Equatable {
  final ProductDetailsStatus status;
  final ProductDetailsModel? productData;
  final String? selectedSkuId;
  final String? errorMessage;

  const ProductDetailsState({
    this.status = ProductDetailsStatus.initial,
    this.productData,
    this.selectedSkuId,
    this.errorMessage,
  });

  // Convenience getters
  VariationDetailsModel? get variation => productData?.variation;
  List<RelatedVariationModel> get relatedVariations => productData?.relatedVariations ?? [];

  ProductDetailsState copyWith({
    ProductDetailsStatus? status,
    ProductDetailsModel? productData,
    String? selectedSkuId,
    String? errorMessage,
  }) {
    return ProductDetailsState(
      status: status ?? this.status,
      productData: productData ?? this.productData,
      selectedSkuId: selectedSkuId ?? this.selectedSkuId,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }

  @override
  List<Object?> get props => [status, productData, selectedSkuId, errorMessage];
}
