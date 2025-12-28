import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dres/features/shop/data/repositories/products_repository.dart';
import 'package:dres/features/shop/logic/products_bloc/products_event.dart';
import 'package:dres/features/shop/logic/products_bloc/products_state.dart';
import 'package:dres/core/models/variation_model.dart';

class ProductsBloc extends Bloc<ProductsEvent, ProductsState> {
  final ProductsRepository _repository;

  ProductsBloc(this._repository) : super(const ProductsState()) {
    on<FetchProducts>(_onFetchProducts);
    on<LoadMoreProducts>(_onLoadMoreProducts);
    on<RefreshProducts>(_onRefreshProducts);
  }

  Future<void> _onFetchProducts(
    FetchProducts event,
    Emitter<ProductsState> emit,
  ) async {
    emit(state.copyWith(
      status: ProductsStatus.loading,
      departmentId: event.departmentId,
      categoryId: event.categoryId,
      collectionId: event.collectionId,
    ));

    try {
      final result = await _repository.fetchProducts(
        departmentId: event.departmentId,
        categoryId: event.categoryId,
        collectionId: event.collectionId,
        page: event.page,
      );

      emit(state.copyWith(
        status: ProductsStatus.success,
        products: result['variations'] as List<VariationModel>,
        currentPage: result['page'] as int,
        totalPages: result['totalPages'] as int,
        hasNextPage: result['hasNextPage'] as bool,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: ProductsStatus.failure,
        errorMessage: e.toString(),
      ));
    }
  }

  Future<void> _onLoadMoreProducts(
    LoadMoreProducts event,
    Emitter<ProductsState> emit,
  ) async {
    if (!state.hasNextPage || state.status == ProductsStatus.loadingMore) {
      return;
    }

    emit(state.copyWith(status: ProductsStatus.loadingMore));

    try {
      final result = await _repository.fetchProducts(
        departmentId: state.departmentId,
        categoryId: state.categoryId,
        collectionId: state.collectionId,
        page: state.currentPage + 1,
      );

      final newProducts = [
        ...state.products,
        ...result['variations'] as List<VariationModel>,
      ];

      emit(state.copyWith(
        status: ProductsStatus.success,
        products: newProducts,
        currentPage: result['page'] as int,
        totalPages: result['totalPages'] as int,
        hasNextPage: result['hasNextPage'] as bool,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: ProductsStatus.failure,
        errorMessage: e.toString(),
      ));
    }
  }

  Future<void> _onRefreshProducts(
    RefreshProducts event,
    Emitter<ProductsState> emit,
  ) async {
    add(FetchProducts(
      departmentId: state.departmentId,
      categoryId: state.categoryId,
      collectionId: state.collectionId,
      page: 1,
    ));
  }
}
