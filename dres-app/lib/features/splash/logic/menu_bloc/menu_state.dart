import 'package:equatable/equatable.dart';
import 'package:dres/core/models/menu_model.dart';

enum MenuStatus { initial, loading, success, failure }

class MenuState extends Equatable {
  final MenuStatus status;
  final MenuModel? menu;
  final String? errorMessage;

  const MenuState({
    required this.status,
    this.menu,
    this.errorMessage,
  });

  factory MenuState.initial() {
    return const MenuState(status: MenuStatus.initial);
  }

  MenuState copyWith({
    MenuStatus? status,
    MenuModel? menu,
    String? errorMessage,
  }) {
    return MenuState(
      status: status ?? this.status,
      menu: menu ?? this.menu,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }

  MenuState copyWithLoading() {
    return MenuState(
      status: MenuStatus.loading,
      menu: menu,
      errorMessage: null,
    );
  }

  MenuState copyWithSuccess(MenuModel menu) {
    return MenuState(
      status: MenuStatus.success,
      menu: menu,
      errorMessage: null,
    );
  }

  MenuState copyWithFailure(String message) {
    return MenuState(
      status: MenuStatus.failure,
      menu: menu,
      errorMessage: message,
    );
  }

  @override
  List<Object?> get props => [status, menu, errorMessage];
}
