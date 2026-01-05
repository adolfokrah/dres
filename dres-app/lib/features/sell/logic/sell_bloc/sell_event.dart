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

/// Archive a style (hide from seller's view)
class SellArchiveStyleRequested extends SellEvent {
  final String styleId;

  const SellArchiveStyleRequested({required this.styleId});

  @override
  List<Object?> get props => [styleId];
}
