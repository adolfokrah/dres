import 'package:equatable/equatable.dart';
import 'package:dres/core/models/variation_model.dart';

enum ProductsStatus { initial, loading, success, failure, loadingMore }

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
      ];
}
