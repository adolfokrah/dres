import 'package:equatable/equatable.dart';
import 'package:dres/features/profile/data/models/seller_review_model.dart';

enum SellerReviewsStatus { initial, loading, success, error }

class SellerReviewsState extends Equatable {
  final SellerReviewsStatus status;
  final List<SellerReviewModel> reviews;
  final String? sellerId;
  final String? error;
  final bool hasMore;
  final int currentPage;
  final double averageRating;
  final int totalReviews;

  const SellerReviewsState({
    this.status = SellerReviewsStatus.initial,
    this.reviews = const [],
    this.sellerId,
    this.error,
    this.hasMore = true,
    this.currentPage = 1,
    this.averageRating = 0,
    this.totalReviews = 0,
  });

  SellerReviewsState copyWith({
    SellerReviewsStatus? status,
    List<SellerReviewModel>? reviews,
    String? sellerId,
    String? error,
    bool? hasMore,
    int? currentPage,
    double? averageRating,
    int? totalReviews,
  }) {
    return SellerReviewsState(
      status: status ?? this.status,
      reviews: reviews ?? this.reviews,
      sellerId: sellerId ?? this.sellerId,
      error: error,
      hasMore: hasMore ?? this.hasMore,
      currentPage: currentPage ?? this.currentPage,
      averageRating: averageRating ?? this.averageRating,
      totalReviews: totalReviews ?? this.totalReviews,
    );
  }

  @override
  List<Object?> get props => [
        status,
        reviews,
        sellerId,
        error,
        hasMore,
        currentPage,
        averageRating,
        totalReviews,
      ];
}
