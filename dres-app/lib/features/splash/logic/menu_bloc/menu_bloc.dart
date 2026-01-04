import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dres/core/services/api_exception.dart';
import 'package:dres/features/splash/data/repositories/menu_repository.dart';
import 'package:dres/features/splash/logic/menu_bloc/menu_event.dart';
import 'package:dres/features/splash/logic/menu_bloc/menu_state.dart';

class MenuBloc extends Bloc<MenuEvent, MenuState> {
  final MenuRepository _menuRepository;

  MenuBloc(this._menuRepository) : super(MenuState.initial()) {
    on<FetchMenu>(_onFetchMenu);
  }

  Future<void> _onFetchMenu(
    FetchMenu event,
    Emitter<MenuState> emit,
  ) async {
    // Don't reload if already loaded
    if (state.status == MenuStatus.success && state.menu != null) {
      return;
    }

    emit(state.copyWithLoading());

    try {
      final menu = await _menuRepository.fetchMenu();
      emit(state.copyWithSuccess(menu));
    } catch (e) {
      emit(state.copyWithFailure(getErrorMessage(e)));
    }
  }
}
