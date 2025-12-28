import 'package:equatable/equatable.dart';
import 'package:dres/core/models/variation_model.dart';
import 'package:dres/core/models/attribute_filter_model.dart';

// Helper class for nullable value updates
class NullableValue<T> {
  final T? value;
  const NullableValue(this.value);
}

enum ProductsStatus { initial, loading, loadingMore, success, failure }

class ProductsState extends Equatable {
  final ProductsStatus status;
  final List<VariationModel> products;
  final String? errorMessage;
  final int currentPage;
  final int totalPages;
  final int totalDocs;
  final bool hasNextPage;
  final String? departmentId;
  final String? categoryId;
  final String? collectionId;
  final String? brandId;
  final String? filterType;
  final String? sortBy;
  final String? sortPrice;
  final List<AttributeFilterModel> filters;
  final Map<String, List<String>> selectedAttributes;
  final double? minPrice;
  final double? maxPrice;

  const ProductsState({
    this.status = ProductsStatus.initial,
    this.products = const [],
    this.errorMessage,
    this.currentPage = 1,
    this.totalPages = 0,
    this.totalDocs = 0,
    this.hasNextPage = false,
    this.departmentId,
    this.categoryId,
    this.collectionId,
    this.brandId,
    this.filterType,
    this.sortBy,
    this.sortPrice,
    this.filters = const [],
    this.selectedAttributes = const {},
    this.minPrice,
    this.maxPrice,
  });

  ProductsState copyWith({
    ProductsStatus? status,
    List<VariationModel>? products,
    String? errorMessage,
    int? currentPage,
    int? totalPages,
    int? totalDocs,
    bool? hasNextPage,
    String? departmentId,
    String? categoryId,
    String? collectionId,
    String? brandId,
    String? filterType,
    String? sortBy,
    String? sortPrice,
    List<AttributeFilterModel>? filters,
    Map<String, List<String>>? selectedAttributes,
    NullableValue<double>? minPrice,
    NullableValue<double>? maxPrice,
  }) {
    return ProductsState(
      status: status ?? this.status,
      products: products ?? this.products,
      errorMessage: errorMessage ?? this.errorMessage,
      currentPage: currentPage ?? this.currentPage,
      totalPages: totalPages ?? this.totalPages,
      totalDocs: totalDocs ?? this.totalDocs,
      hasNextPage: hasNextPage ?? this.hasNextPage,
      departmentId: departmentId ?? this.departmentId,
      categoryId: categoryId ?? this.categoryId,
      collectionId: collectionId ?? this.collectionId,
      brandId: brandId ?? this.brandId,
      filterType: filterType ?? this.filterType,
      sortBy: sortBy ?? this.sortBy,
      sortPrice: sortPrice ?? this.sortPrice,
      filters: filters ?? this.filters,
      selectedAttributes: selectedAttributes ?? this.selectedAttributes,
      minPrice: minPrice != null ? minPrice.value : this.minPrice,
      maxPrice: maxPrice != null ? maxPrice.value : this.maxPrice,
    );
  }

  @override
  List<Object?> get props => [
        status,
        products,
        errorMessage,
        currentPage,
        totalPages,
        totalDocs,
        hasNextPage,
        departmentId,
        categoryId,
        collectionId,
        brandId,
        filterType,
        sortBy,
        sortPrice,
        filters,
        selectedAttributes,
        minPrice,
        maxPrice,
      ];
}
