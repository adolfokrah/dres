part of 'sell_bloc.dart';

abstract class SellEvent extends Equatable {
  const SellEvent();

  @override
  List<Object?> get props => [];
}

/// Fetch draft styles for the current user
class SellFetchDraftsRequested extends SellEvent {
  const SellFetchDraftsRequested();
}

/// Refresh draft styles
class SellRefreshRequested extends SellEvent {
  const SellRefreshRequested();
}
