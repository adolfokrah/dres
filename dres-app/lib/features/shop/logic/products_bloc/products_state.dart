import 'package:equatable/equatable.dart';
import 'package:dres/core/models/variation_model.dart';

enum ProductsStatus { initial, loading, success, failure, loadingMore }

class ProductsState extends Equatable {
  final ProductsStatus status;
  final List<VariationModel> products;
  final String? errorMessage;
  final int currentPage;
  final int totalPages;
  final bool hasNextPage;
  final String? departmentId;
  final String? categoryId;
  final String? collectionId;

  const ProductsState({
    this.status = ProductsStatus.initial,
    this.products = const [],
    this.errorMessage,
    this.currentPage = 1,
    this.totalPages = 0,
    this.hasNextPage = false,
    this.departmentId,
    this.categoryId,
    this.collectionId,
  });

  ProductsState copyWith({
    ProductsStatus? status,
    List<VariationModel>? products,
    String? errorMessage,
    int? currentPage,
    int? totalPages,
    bool? hasNextPage,
    String? departmentId,
    String? categoryId,
    String? collectionId,
  }) {
    return ProductsState(
      status: status ?? this.status,
      products: products ?? this.products,
      errorMessage: errorMessage ?? this.errorMessage,
      currentPage: currentPage ?? this.currentPage,
      totalPages: totalPages ?? this.totalPages,
      hasNextPage: hasNextPage ?? this.hasNextPage,
      departmentId: departmentId ?? this.departmentId,
      categoryId: categoryId ?? this.categoryId,
      collectionId: collectionId ?? this.collectionId,
    );
  }

  @override
  List<Object?> get props => [
        status,
        products,
        errorMessage,
        currentPage,
        totalPages,
        hasNextPage,
        departmentId,
        categoryId,
        collectionId,
      ];
}
