import 'package:equatable/equatable.dart';
import 'package:dres/core/models/brand_model.dart';

enum BrandsStatus { initial, loading, success, failure }

class BrandsState extends Equatable {
  final BrandsStatus status;
  final List<BrandModel> brands;
  final String? errorMessage;

  const BrandsState({
    this.status = BrandsStatus.initial,
    this.brands = const [],
    this.errorMessage,
  });

  BrandsState copyWith({
    BrandsStatus? status,
    List<BrandModel>? brands,
    String? errorMessage,
  }) {
    return BrandsState(
      status: status ?? this.status,
      brands: brands ?? this.brands,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }

  @override
  List<Object?> get props => [status, brands, errorMessage];
}
