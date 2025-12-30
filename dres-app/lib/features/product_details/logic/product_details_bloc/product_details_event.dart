import 'package:equatable/equatable.dart';

abstract class ProductDetailsEvent extends Equatable {
  const ProductDetailsEvent();

  @override
  List<Object?> get props => [];
}

class FetchProductDetails extends ProductDetailsEvent {
  final String variationId;
  final String? skuId;

  const FetchProductDetails({
    required this.variationId,
    this.skuId,
  });

  @override
  List<Object?> get props => [variationId, skuId];
}

class UpdateSelectedSku extends ProductDetailsEvent {
  final String skuId;

  const UpdateSelectedSku({
    required this.skuId,
  });

  @override
  List<Object?> get props => [skuId];
}

class UpdateBuyerProtection extends ProductDetailsEvent {
  final bool buyerProtection;

  const UpdateBuyerProtection({
    required this.buyerProtection,
  });

  @override
  List<Object?> get props => [buyerProtection];
}
