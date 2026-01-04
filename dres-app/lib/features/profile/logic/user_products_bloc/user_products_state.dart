import 'package:equatable/equatable.dart';
import 'package:dres/features/profile/data/models/product_style_model.dart';

enum UserProductsStatus {
  initial,
  loading,
  success,
  loadingMore,
  error,
}

class UserProductsState extends Equatable {
  final UserProductsStatus status;
  final List<ProductStyleModel> products;
  final int totalDocs;
  final bool hasMore;
  final int currentPage;
  final String? errorMessage;

  const UserProductsState({
    this.status = UserProductsStatus.initial,
    this.products = const [],
    this.totalDocs = 0,
    this.hasMore = false,
    this.currentPage = 1,
    this.errorMessage,
  });

  UserProductsState copyWith({
    UserProductsStatus? status,
    List<ProductStyleModel>? products,
    int? totalDocs,
    bool? hasMore,
    int? currentPage,
    String? errorMessage,
  }) {
    return UserProductsState(
      status: status ?? this.status,
      products: products ?? this.products,
      totalDocs: totalDocs ?? this.totalDocs,
      hasMore: hasMore ?? this.hasMore,
      currentPage: currentPage ?? this.currentPage,
      errorMessage: errorMessage ?? this.errorMessage,
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
      ];
}
