import 'package:equatable/equatable.dart';
import 'package:dres/features/home/data/models/page_model.dart';

enum HomeStatus { initial, loading, success, failure }

class HomeState extends Equatable {
  final HomeStatus status;
  final PageModel? page;
  final String? errorMessage;

  const HomeState({
    this.status = HomeStatus.initial,
    this.page,
    this.errorMessage,
  });

  /// Initial state
  factory HomeState.initial() {
    return const HomeState(status: HomeStatus.initial);
  }

  /// Loading state
  HomeState copyWithLoading() {
    return HomeState(
      status: HomeStatus.loading,
      page: page,
      errorMessage: null,
    );
  }

  /// Success state
  HomeState copyWithSuccess(PageModel page) {
    return HomeState(
      status: HomeStatus.success,
      page: page,
      errorMessage: null,
    );
  }

  /// Failure state
  HomeState copyWithFailure(String message) {
    return HomeState(
      status: HomeStatus.failure,
      page: page,
      errorMessage: message,
    );
  }

  @override
  List<Object?> get props => [status, page, errorMessage];
}
