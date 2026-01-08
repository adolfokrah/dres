import 'package:equatable/equatable.dart';
import 'package:dres/features/home/data/models/page_model.dart';

enum HomeStatus { initial, loading, success, failure }

class HomeState extends Equatable {
  final HomeStatus status;
  final PageModel? page;
  final String? errorMessage;
  final String? currentSlug;
  final DateTime? lastRefresh; // Force rebuild on refresh

  const HomeState({
    this.status = HomeStatus.initial,
    this.page,
    this.errorMessage,
    this.currentSlug,
    this.lastRefresh,
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
      currentSlug: currentSlug,
      lastRefresh: lastRefresh,
    );
  }

  /// Success state
  HomeState copyWithSuccess(PageModel page, {String? slug}) {
    return HomeState(
      status: HomeStatus.success,
      page: page,
      errorMessage: null,
      currentSlug: slug ?? currentSlug,
      lastRefresh: DateTime.now(), // Update timestamp to force rebuild
    );
  }

  /// Failure state
  HomeState copyWithFailure(String message) {
    return HomeState(
      status: HomeStatus.failure,
      page: page,
      errorMessage: message,
      currentSlug: currentSlug,
      lastRefresh: lastRefresh,
    );
  }

  @override
  List<Object?> get props => [status, page, errorMessage, currentSlug, lastRefresh];
}
