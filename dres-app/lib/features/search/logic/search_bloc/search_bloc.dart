import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dres/features/search/data/repositories/search_repository.dart';
import 'package:dres/features/search/logic/search_bloc/search_event.dart';
import 'package:dres/features/search/logic/search_bloc/search_state.dart';

class SearchBloc extends Bloc<SearchEvent, SearchState> {
  final SearchRepository _searchRepository;
  Timer? _debounceTimer;

  SearchBloc(this._searchRepository) : super(const SearchState()) {
    on<SearchQueryChanged>(_onQueryChanged);
    on<SearchQueryCleared>(_onQueryCleared);
    on<SearchTabChanged>(_onTabChanged);
  }

  Future<void> _onQueryChanged(
    SearchQueryChanged event,
    Emitter<SearchState> emit,
  ) async {
    final query = event.query.trim();

    emit(state.copyWith(query: query));

    if (query.isEmpty) {
      emit(state.copyWith(
        itemResults: [],
        brandResults: [],
        sellerResults: [],
        status: SearchStatus.success,
      ));
      return;
    }

    // Debounce search
    _debounceTimer?.cancel();

    final completer = Completer<void>();
    _debounceTimer = Timer(const Duration(milliseconds: 300), () async {
      await _performSearch(emit, query);
      completer.complete();
    });

    await completer.future;
  }

  Future<void> _performSearch(Emitter<SearchState> emit, String query) async {
    emit(state.copyWith(status: SearchStatus.loading));

    try {
      final response = await _searchRepository.search(query);
      emit(state.copyWith(
        itemResults: response.items,
        brandResults: response.brands,
        sellerResults: response.sellers,
        status: SearchStatus.success,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: SearchStatus.failure,
        errorMessage: 'Search failed. Please try again.',
      ));
    }
  }

  void _onQueryCleared(
    SearchQueryCleared event,
    Emitter<SearchState> emit,
  ) {
    _debounceTimer?.cancel();
    emit(state.copyWith(
      query: '',
      itemResults: [],
      brandResults: [],
      sellerResults: [],
      status: SearchStatus.success,
    ));
  }

  void _onTabChanged(
    SearchTabChanged event,
    Emitter<SearchState> emit,
  ) {
    emit(state.copyWith(currentTab: event.tabIndex));
  }

  @override
  Future<void> close() {
    _debounceTimer?.cancel();
    return super.close();
  }
}
