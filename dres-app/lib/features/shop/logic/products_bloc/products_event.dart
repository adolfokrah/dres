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
  final Map<String, List<String>>? selectedAttributes;
  final double? minPrice;
  final double? maxPrice;
  final bool updateMinPrice;
  final bool updateMaxPrice;
  final int page;

  const FetchProducts({
    this.departmentId,
    this.categoryId,
    this.collectionId,
    this.brandId,
    this.filterType,
    this.sortBy,
    this.sortPrice,
    this.selectedAttributes,
    this.minPrice,
    this.maxPrice,
    this.updateMinPrice = false,
    this.updateMaxPrice = false,
    this.page = 1,
  });

  @override
  List<Object?> get props => [departmentId, categoryId, collectionId, brandId, filterType, sortBy, sortPrice, selectedAttributes, minPrice, maxPrice, updateMinPrice, updateMaxPrice, page];
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
  final String? sortPrice; // 'asc', 'desc', or null for reset
  
  const ChangePriceSort(this.sortPrice);
  
  @override
  List<Object?> get props => [sortPrice];
}

class ResetProducts extends ProductsEvent {
  const ResetProducts();
}

class ChangeAttributeFilter extends ProductsEvent {
  final String attributeId;
  final List<String> optionIds;
  
  const ChangeAttributeFilter({
    required this.attributeId,
    required this.optionIds,
  });
  
  @override
  List<Object?> get props => [attributeId, optionIds];
}

class ChangePriceRange extends ProductsEvent {
  final double? minPrice;
  final double? maxPrice;
  
  const ChangePriceRange({
    this.minPrice,
    this.maxPrice,
  });
  
  @override
  List<Object?> get props => [minPrice, maxPrice];
}

class RefreshProducts extends ProductsEvent {
  const RefreshProducts();
}
