import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dres/features/home/data/repositories/home_repository.dart';
import 'package:dres/features/home/logic/bloc/home_event.dart';
import 'package:dres/features/home/logic/bloc/home_state.dart';

class HomeBloc extends Bloc<HomeEvent, HomeState> {
  final HomeRepository _homeRepository;

  HomeBloc(this._homeRepository) : super(HomeState.initial()) {
    on<FetchHomePage>(_onFetchHomePage);
    on<RefreshHomePage>(_onRefreshHomePage);
  }

  Future<void> _onFetchHomePage(
    FetchHomePage event,
    Emitter<HomeState> emit,
  ) async {
    // Don't reload if already loaded
    if (state.status == HomeStatus.success && state.page != null) {
      return;
    }

    emit(state.copyWithLoading());

    try {
      final page = await _homeRepository.fetchHomePage(locale: event.locale);
      emit(state.copyWithSuccess(page));
    } catch (e) {
      emit(state.copyWithFailure(e.toString()));
    }
  }

  Future<void> _onRefreshHomePage(
    RefreshHomePage event,
    Emitter<HomeState> emit,
  ) async {
    emit(state.copyWithLoading());

    try {
      final page = await _homeRepository.fetchHomePage(locale: event.locale);
      emit(state.copyWithSuccess(page));
    } catch (e) {
      emit(state.copyWithFailure(e.toString()));
    }
  }
}
