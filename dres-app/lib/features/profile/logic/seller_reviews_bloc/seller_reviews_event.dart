import 'package:equatable/equatable.dart';

abstract class SellerReviewsEvent extends Equatable {
  const SellerReviewsEvent();

  @override
  List<Object?> get props => [];
}

/// Event to fetch seller reviews
class SellerReviewsFetchRequested extends SellerReviewsEvent {
  final String sellerId;

  const SellerReviewsFetchRequested({required this.sellerId});

  @override
  List<Object?> get props => [sellerId];
}

/// Event to load more reviews
class SellerReviewsLoadMoreRequested extends SellerReviewsEvent {
  const SellerReviewsLoadMoreRequested();
}

/// Event to refresh reviews
class SellerReviewsRefreshRequested extends SellerReviewsEvent {
  const SellerReviewsRefreshRequested();
}
