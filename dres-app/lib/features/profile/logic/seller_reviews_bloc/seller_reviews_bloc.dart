import 'package:flutter/foundation.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dres/features/profile/data/repositories/seller_reviews_repository.dart';
import 'seller_reviews_event.dart';
import 'seller_reviews_state.dart';

export 'seller_reviews_event.dart';
export 'seller_reviews_state.dart';

class SellerReviewsBloc extends Bloc<SellerReviewsEvent, SellerReviewsState> {
  final SellerReviewsRepository _sellerReviewsRepository;
  static const int _pageSize = 10;

  SellerReviewsBloc({
    required SellerReviewsRepository sellerReviewsRepository,
  })  : _sellerReviewsRepository = sellerReviewsRepository,
        super(const SellerReviewsState()) {
    on<SellerReviewsFetchRequested>(_onFetchRequested);
    on<SellerReviewsLoadMoreRequested>(_onLoadMoreRequested);
    on<SellerReviewsRefreshRequested>(_onRefreshRequested);
  }

  Future<void> _onFetchRequested(
    SellerReviewsFetchRequested event,
    Emitter<SellerReviewsState> emit,
  ) async {
    emit(state.copyWith(
      status: SellerReviewsStatus.loading,
      sellerId: event.sellerId,
      currentPage: 1,
    ));

    try {
      debugPrint('⭐ Fetching seller reviews for: ${event.sellerId}');
      final response = await _sellerReviewsRepository.getSellerReviews(
        sellerId: event.sellerId,
        page: 1,
        limit: _pageSize,
      );
      debugPrint('⭐ Fetched ${response.reviews.length} reviews');

      emit(state.copyWith(
        status: SellerReviewsStatus.success,
        reviews: response.reviews,
        hasMore: response.hasNextPage,
        currentPage: response.page,
        averageRating: response.averageRating,
        totalReviews: response.totalReviews,
      ));
    } catch (e, stackTrace) {
      debugPrint('⭐ Error fetching seller reviews: $e');
      debugPrint('⭐ Stack trace: $stackTrace');
      emit(state.copyWith(
        status: SellerReviewsStatus.error,
        error: e.toString(),
      ));
    }
  }

  Future<void> _onLoadMoreRequested(
    SellerReviewsLoadMoreRequested event,
    Emitter<SellerReviewsState> emit,
  ) async {
    if (!state.hasMore || state.status == SellerReviewsStatus.loading) return;
    if (state.sellerId == null) return;

    try {
      final nextPage = state.currentPage + 1;
      final response = await _sellerReviewsRepository.getSellerReviews(
        sellerId: state.sellerId!,
        page: nextPage,
        limit: _pageSize,
      );

      emit(state.copyWith(
        reviews: [...state.reviews, ...response.reviews],
        hasMore: response.hasNextPage,
        currentPage: response.page,
      ));
    } catch (e) {
      debugPrint('⭐ Error loading more reviews: $e');
    }
  }

  Future<void> _onRefreshRequested(
    SellerReviewsRefreshRequested event,
    Emitter<SellerReviewsState> emit,
  ) async {
    if (state.sellerId == null) return;
    add(SellerReviewsFetchRequested(sellerId: state.sellerId!));
  }
}
