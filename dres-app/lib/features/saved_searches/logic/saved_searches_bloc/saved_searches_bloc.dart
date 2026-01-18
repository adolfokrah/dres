import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:dres/features/saved_searches/data/repositories/saved_search_repository.dart';

part 'saved_searches_event.dart';
part 'saved_searches_state.dart';

class SavedSearchesBloc extends Bloc<SavedSearchesEvent, SavedSearchesState> {
  SavedSearchesBloc(this._savedSearchRepository) : super(const SavedSearchesState()) {
    on<SavedSearchesFetchRequested>(_onSavedSearchesFetchRequested);
    on<SavedSearchSaveRequested>(_onSavedSearchSaveRequested);
    on<SavedSearchDeleteRequested>(_onSavedSearchDeleteRequested);
    on<SavedSearchActiveToggled>(_onSavedSearchActiveToggled);
    on<SavedSearchesRefreshRequested>(_onSavedSearchesRefreshRequested);
    on<SavedSearchesClearRequested>(_onSavedSearchesClearRequested);
  }

  final SavedSearchRepository _savedSearchRepository;

  Future<void> _onSavedSearchesFetchRequested(
    SavedSearchesFetchRequested event,
    Emitter<SavedSearchesState> emit,
  ) async {
    emit(state.copyWith(status: SavedSearchesStatus.loading));
    
    try {
      final response = await _savedSearchRepository.getMySavedSearches();
      
      if (response.success) {
        emit(state.copyWith(
          status: SavedSearchesStatus.success,
          searches: response.searches,
        ));
      } else {
        emit(state.copyWith(
          status: SavedSearchesStatus.failure,
          errorMessage: 'Failed to load saved searches',
        ));
      }
    } catch (error) {
      emit(state.copyWith(
        status: SavedSearchesStatus.failure,
        errorMessage: error.toString(),
      ));
    }
  }

  Future<void> _onSavedSearchSaveRequested(
    SavedSearchSaveRequested event,
    Emitter<SavedSearchesState> emit,
  ) async {
    try {
      final request = SaveSearchRequest(
        name: event.name,
        searchData: event.searchData,
      );
      
      final response = await _savedSearchRepository.saveSearch(request);
      
      if (response.success && response.savedSearch != null) {
        final updatedSearches = List<SavedSearchModel>.from(state.searches)
          ..add(response.savedSearch!);
        
        emit(state.copyWith(
          searches: updatedSearches,
          status: SavedSearchesStatus.success,
        ));
      } else {
        emit(state.copyWith(
          status: SavedSearchesStatus.failure,
          errorMessage: response.message ?? 'Failed to save search',
        ));
      }
    } catch (error) {
      emit(state.copyWith(
        status: SavedSearchesStatus.failure,
        errorMessage: error.toString(),
      ));
    }
  }

  Future<void> _onSavedSearchDeleteRequested(
    SavedSearchDeleteRequested event,
    Emitter<SavedSearchesState> emit,
  ) async {
    try {
      await _savedSearchRepository.deleteSavedSearch(event.searchId);
      
      final updatedSearches = state.searches
          .where((search) => search.id != event.searchId)
          .toList();
      
      emit(state.copyWith(
        searches: updatedSearches,
        status: SavedSearchesStatus.success,
      ));
    } catch (error) {
      emit(state.copyWith(
        status: SavedSearchesStatus.failure,
        errorMessage: error.toString(),
      ));
    }
  }

  Future<void> _onSavedSearchActiveToggled(
    SavedSearchActiveToggled event,
    Emitter<SavedSearchesState> emit,
  ) async {
    try {
      await _savedSearchRepository.toggleActive(event.searchId, event.isActive);

      final updatedSearches = state.searches.map((search) {
        if (search.id == event.searchId) {
          return search.copyWith(isActive: event.isActive);
        }
        return search;
      }).toList();

      emit(state.copyWith(
        searches: updatedSearches,
        status: SavedSearchesStatus.success,
      ));
    } catch (error) {
      emit(state.copyWith(
        status: SavedSearchesStatus.failure,
        errorMessage: error.toString(),
      ));
    }
  }

  Future<void> _onSavedSearchesRefreshRequested(
    SavedSearchesRefreshRequested event,
    Emitter<SavedSearchesState> emit,
  ) async {
    emit(state.copyWith(isRefreshing: true));
    
    try {
      final response = await _savedSearchRepository.getMySavedSearches();
      
      if (response.success) {
        emit(state.copyWith(
          status: SavedSearchesStatus.success,
          searches: response.searches,
          isRefreshing: false,
        ));
      } else {
        emit(state.copyWith(
          status: SavedSearchesStatus.failure,
          errorMessage: 'Failed to refresh saved searches',
          isRefreshing: false,
        ));
      }
    } catch (error) {
      emit(state.copyWith(
        status: SavedSearchesStatus.failure,
        errorMessage: error.toString(),
        isRefreshing: false,
      ));
    }
  }

  void _onSavedSearchesClearRequested(
    SavedSearchesClearRequested event,
    Emitter<SavedSearchesState> emit,
  ) {
    emit(const SavedSearchesState());
  }
}