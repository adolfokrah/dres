import 'package:equatable/equatable.dart';
import 'package:dres/features/profile/data/models/seller_product_model.dart';

enum SellerProductsStatus {
  initial,
  loading,
  success,
  loadingMore,
  error,
}

class SellerProductsState extends Equatable {
  final SellerProductsStatus status;
  final List<SellerProductModel> products;
  final int totalDocs;
  final bool hasMore;
  final int currentPage;
  final String? errorMessage;
  final String? currentSellerId;

  const SellerProductsState({
    this.status = SellerProductsStatus.initial,
    this.products = const [],
    this.totalDocs = 0,
    this.hasMore = false,
    this.currentPage = 1,
    this.errorMessage,
    this.currentSellerId,
  });

  SellerProductsState copyWith({
    SellerProductsStatus? status,
    List<SellerProductModel>? products,
    int? totalDocs,
    bool? hasMore,
    int? currentPage,
    String? errorMessage,
    String? currentSellerId,
  }) {
    return SellerProductsState(
      status: status ?? this.status,
      products: products ?? this.products,
      totalDocs: totalDocs ?? this.totalDocs,
      hasMore: hasMore ?? this.hasMore,
      currentPage: currentPage ?? this.currentPage,
      errorMessage: errorMessage ?? this.errorMessage,
      currentSellerId: currentSellerId ?? this.currentSellerId,
    );
  }

  @override
  List<Object?> get props => [
        status,
        products,
        totalDocs,
        hasMore,
        currentPage,
        errorMessage,
        currentSellerId,
      ];
}
