part of 'saved_searches_bloc.dart';

enum SavedSearchesStatus { initial, loading, success, failure }

class SavedSearchesState extends Equatable {
  const SavedSearchesState({
    this.status = SavedSearchesStatus.initial,
    this.searches = const [],
    this.errorMessage,
    this.isRefreshing = false,
  });

  final SavedSearchesStatus status;
  final List<SavedSearchModel> searches;
  final String? errorMessage;
  final bool isRefreshing;

  SavedSearchesState copyWith({
    SavedSearchesStatus? status,
    List<SavedSearchModel>? searches,
    String? errorMessage,
    bool? isRefreshing,
  }) {
    return SavedSearchesState(
      status: status ?? this.status,
      searches: searches ?? this.searches,
      errorMessage: errorMessage,
      isRefreshing: isRefreshing ?? this.isRefreshing,
    );
  }

  @override
  List<Object?> get props => [status, searches, errorMessage, isRefreshing];
}