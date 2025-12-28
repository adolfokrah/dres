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
  final String? sortBy; // 'latest' or 'oldest'
  final String? sortPrice; // 'asc' or 'desc'
  final int page;

  const FetchProducts({
    this.departmentId,
    this.categoryId,
    this.collectionId,
    this.brandId,
    this.filterType,
    this.sortBy,
    this.sortPrice,
    this.page = 1,
  });

  @override
  List<Object?> get props => [departmentId, categoryId, collectionId, brandId, filterType, sortBy, sortPrice, page];
}

class LoadMoreProducts extends ProductsEvent {
  const LoadMoreProducts();
}

class ChangeSortOption extends ProductsEvent {
  final String sortBy; // 'latest' or 'oldest'
  
  const ChangeSortOption(this.sortBy);
  
  @override
  List<Object?> get props => [sortBy];
}

class ChangePriceSort extends ProductsEvent {
  final String sortPrice; // 'asc' or 'desc'
  
  const ChangePriceSort(this.sortPrice);
  
  @override
  List<Object?> get props => [sortPrice];
}

class ResetProducts extends ProductsEvent {
  const ResetProducts();
}

class RefreshProducts extends ProductsEvent {
  const RefreshProducts();
}
