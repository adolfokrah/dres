import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dres/core/services/api_exception.dart';
import 'package:dres/features/profile/data/repositories/user_products_repository.dart';
import 'package:dres/features/profile/logic/user_products_bloc/user_products_event.dart';
import 'package:dres/features/profile/logic/user_products_bloc/user_products_state.dart';

export 'user_products_event.dart';
export 'user_products_state.dart';

class UserProductsBloc extends Bloc<UserProductsEvent, UserProductsState> {
  final UserProductsRepository _userProductsRepository;

  UserProductsBloc({required UserProductsRepository userProductsRepository})
      : _userProductsRepository = userProductsRepository,
        super(const UserProductsState()) {
    on<UserProductsFetchRequested>(_onFetchRequested);
    on<UserProductsRefreshRequested>(_onRefreshRequested);
    on<UserProductsLoadMoreRequested>(_onLoadMoreRequested);
    on<UserProductsArchiveRequested>(_onArchiveRequested);
  }

  Future<void> _onFetchRequested(
    UserProductsFetchRequested event,
    Emitter<UserProductsState> emit,
  ) async {
    emit(state.copyWith(status: UserProductsStatus.loading));

    try {
      final response = await _userProductsRepository.getMyProducts(page: 1);
      emit(state.copyWith(
        status: UserProductsStatus.success,
        products: response.products,
        totalDocs: response.totalDocs,
        hasMore: response.hasNextPage,
        currentPage: 1,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: UserProductsStatus.error,
        errorMessage: getErrorMessage(e),
      ));
    }
  }

  Future<void> _onRefreshRequested(
    UserProductsRefreshRequested event,
    Emitter<UserProductsState> emit,
  ) async {
    try {
      final response = await _userProductsRepository.getMyProducts(page: 1);
      emit(state.copyWith(
        status: UserProductsStatus.success,
        products: response.products,
        totalDocs: response.totalDocs,
        hasMore: response.hasNextPage,
        currentPage: 1,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: UserProductsStatus.error,
        errorMessage: getErrorMessage(e),
      ));
    }
  }

  Future<void> _onLoadMoreRequested(
    UserProductsLoadMoreRequested event,
    Emitter<UserProductsState> emit,
  ) async {
    if (!state.hasMore || state.status == UserProductsStatus.loadingMore) {
      return;
    }

    emit(state.copyWith(status: UserProductsStatus.loadingMore));

    try {
      final nextPage = state.currentPage + 1;
      final response = await _userProductsRepository.getMyProducts(page: nextPage);
      emit(state.copyWith(
        status: UserProductsStatus.success,
        products: [...state.products, ...response.products],
        hasMore: response.hasNextPage,
        currentPage: nextPage,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: UserProductsStatus.error,
        errorMessage: getErrorMessage(e),
      ));
    }
  }

  Future<void> _onArchiveRequested(
    UserProductsArchiveRequested event,
    Emitter<UserProductsState> emit,
  ) async {
    try {
      await _userProductsRepository.archiveProduct(event.styleId);

      // Remove the archived product from the list
      final updatedProducts = state.products
          .where((product) => product.id != event.styleId)
          .toList();

      emit(state.copyWith(
        products: updatedProducts,
        totalDocs: state.totalDocs - 1,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: UserProductsStatus.error,
        errorMessage: getErrorMessage(e),
      ));
    }
  }
}
