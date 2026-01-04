import 'package:equatable/equatable.dart';

abstract class SellerProductsEvent extends Equatable {
  const SellerProductsEvent();

  @override
  List<Object?> get props => [];
}

/// Fetch seller's products
class SellerProductsFetchRequested extends SellerProductsEvent {
  final String sellerId;

  const SellerProductsFetchRequested({required this.sellerId});

  @override
  List<Object?> get props => [sellerId];
}

/// Load more products (pagination)
class SellerProductsLoadMoreRequested extends SellerProductsEvent {
  final String sellerId;

  const SellerProductsLoadMoreRequested({required this.sellerId});

  @override
  List<Object?> get props => [sellerId];
}
