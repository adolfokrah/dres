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
