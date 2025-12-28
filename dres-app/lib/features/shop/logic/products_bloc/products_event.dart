import 'package:equatable/equatable.dart';

abstract class ProductsEvent extends Equatable {
  const ProductsEvent();

  @override
  List<Object?> get props => [];
}

class FetchProducts extends ProductsEvent {
  final String? departmentId;
  final String? categoryId;
  final String? collectionId;
  final String? brandId;
  final String? filterType;
  final int page;

  const FetchProducts({
    this.departmentId,
    this.categoryId,
    this.collectionId,
    this.brandId,
    this.filterType,
    this.page = 1,
  });

  @override
  List<Object?> get props => [departmentId, categoryId, collectionId, brandId, filterType, page];
}

class LoadMoreProducts extends ProductsEvent {
  const LoadMoreProducts();
}

class RefreshProducts extends ProductsEvent {
  const RefreshProducts();
}
