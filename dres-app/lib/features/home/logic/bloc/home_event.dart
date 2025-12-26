import 'package:equatable/equatable.dart';

abstract class HomeEvent extends Equatable {
  const HomeEvent();

  @override
  List<Object?> get props => [];
}

/// Event to fetch home page data
class FetchHomePage extends HomeEvent {
  final String locale;

  const FetchHomePage({this.locale = 'en'});

  @override
  List<Object?> get props => [locale];
}

/// Event to refresh home page data
class RefreshHomePage extends HomeEvent {
  final String locale;

  const RefreshHomePage({this.locale = 'en'});

  @override
  List<Object?> get props => [locale];
}
