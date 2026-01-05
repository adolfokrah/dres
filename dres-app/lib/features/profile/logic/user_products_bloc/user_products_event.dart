import 'package:equatable/equatable.dart';

abstract class UserProductsEvent extends Equatable {
  const UserProductsEvent();

  @override
  List<Object?> get props => [];
}

/// Fetch user's products
class UserProductsFetchRequested extends UserProductsEvent {
  const UserProductsFetchRequested();
}

/// Refresh products (pull to refresh)
class UserProductsRefreshRequested extends UserProductsEvent {
  const UserProductsRefreshRequested();
}

/// Load more products (pagination)
class UserProductsLoadMoreRequested extends UserProductsEvent {
  const UserProductsLoadMoreRequested();
}

/// Archive a product (hide from seller's view)
class UserProductsArchiveRequested extends UserProductsEvent {
  final String styleId;

  const UserProductsArchiveRequested({required this.styleId});

  @override
  List<Object?> get props => [styleId];
}
