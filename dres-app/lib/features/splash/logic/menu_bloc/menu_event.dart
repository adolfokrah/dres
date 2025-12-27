import 'package:equatable/equatable.dart';

abstract class MenuEvent extends Equatable {
  const MenuEvent();

  @override
  List<Object?> get props => [];
}

/// Event to fetch menu data
class FetchMenu extends MenuEvent {
  const FetchMenu();
}
