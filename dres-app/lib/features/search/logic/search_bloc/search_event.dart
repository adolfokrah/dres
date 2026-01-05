import 'package:equatable/equatable.dart';

abstract class SearchEvent extends Equatable {
  const SearchEvent();

  @override
  List<Object?> get props => [];
}

/// Search query changed
class SearchQueryChanged extends SearchEvent {
  final String query;

  const SearchQueryChanged(this.query);

  @override
  List<Object?> get props => [query];
}

/// Clear search query
class SearchQueryCleared extends SearchEvent {
  const SearchQueryCleared();
}

/// Switch between Items and Sellers tabs
class SearchTabChanged extends SearchEvent {
  final int tabIndex;

  const SearchTabChanged(this.tabIndex);

  @override
  List<Object?> get props => [tabIndex];
}
