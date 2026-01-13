part of 'saved_searches_bloc.dart';

abstract class SavedSearchesEvent extends Equatable {
  const SavedSearchesEvent();

  @override
  List<Object?> get props => [];
}

class SavedSearchesFetchRequested extends SavedSearchesEvent {
  const SavedSearchesFetchRequested();
}

class SavedSearchSaveRequested extends SavedSearchesEvent {
  final String? name;
  final Map<String, dynamic> searchData;

  const SavedSearchSaveRequested({
    this.name,
    required this.searchData,
  });

  @override
  List<Object?> get props => [name, searchData];
}

class SavedSearchDeleteRequested extends SavedSearchesEvent {
  final String searchId;

  const SavedSearchDeleteRequested(this.searchId);

  @override
  List<Object?> get props => [searchId];
}

class SavedSearchActiveToggled extends SavedSearchesEvent {
  final String searchId;
  final bool isActive;

  const SavedSearchActiveToggled({
    required this.searchId,
    required this.isActive,
  });

  @override
  List<Object?> get props => [searchId, isActive];
}

class SavedSearchesRefreshRequested extends SavedSearchesEvent {
  const SavedSearchesRefreshRequested();
}