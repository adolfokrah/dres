import 'package:flutter/foundation.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dres/core/services/api_exception.dart';
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
    debugPrint('🏠 HomeBloc: FetchHomePage called with slug=${event.slug}');

    // Don't reload if already loaded with the same slug
    if (state.status == HomeStatus.success &&
        state.page != null &&
        state.currentSlug == event.slug) {
      debugPrint('🏠 HomeBloc: Already loaded, skipping');
      return;
    }

    emit(state.copyWithLoading());
    debugPrint('🏠 HomeBloc: Emitted loading state');

    try {
      final page = await _homeRepository.fetchHomePage(
        slug: event.slug,
        locale: event.locale,
      );
      debugPrint('🏠 HomeBloc: Got page with ${page.layout.length} blocks');
      emit(state.copyWithSuccess(page, slug: event.slug));
      debugPrint('🏠 HomeBloc: Emitted success state');
    } catch (e, stackTrace) {
      debugPrint('🏠 HomeBloc: Error fetching home page: $e');
      debugPrint('🏠 HomeBloc: Stack trace: $stackTrace');
      emit(state.copyWithFailure(getErrorMessage(e)));
    }
  }

  Future<void> _onRefreshHomePage(
    RefreshHomePage event,
    Emitter<HomeState> emit,
  ) async {
    emit(state.copyWithLoading());

    try {
      final page = await _homeRepository.fetchHomePage(
        slug: event.slug,
        locale: event.locale,
      );
      emit(state.copyWithSuccess(page, slug: event.slug));
    } catch (e) {
      emit(state.copyWithFailure(getErrorMessage(e)));
    }
  }
}
