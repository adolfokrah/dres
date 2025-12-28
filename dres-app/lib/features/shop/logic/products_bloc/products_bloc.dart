import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dres/features/shop/data/repositories/products_repository.dart';
import 'package:dres/features/shop/logic/products_bloc/products_event.dart';
import 'package:dres/features/shop/logic/products_bloc/products_state.dart';
import 'package:dres/core/models/variation_model.dart';
import 'package:dres/core/models/attribute_filter_model.dart';

class ProductsBloc extends Bloc<ProductsEvent, ProductsState> {
  final ProductsRepository _repository;

  ProductsBloc(this._repository) : super(const ProductsState()) {
    on<FetchProducts>(_onFetchProducts);
    on<LoadMoreProducts>(_onLoadMoreProducts);
    on<RefreshProducts>(_onRefreshProducts);
    on<ChangeSortOption>(_onChangeSortOption);
    on<ChangePriceSort>(_onChangePriceSort);
    on<ResetProducts>(_onResetProducts);
    on<ChangeAttributeFilter>(_onChangeAttributeFilter);
    on<ChangePriceRange>(_onChangePriceRange);
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
      brandId: event.brandId,
      filterType: event.filterType,
      sortBy: event.sortBy,
      sortPrice: event.updatePriceSort ? NullableValue(event.sortPrice) : null,
      selectedAttributes: event.selectedAttributes ?? state.selectedAttributes,
      minPrice: event.updateMinPrice ? NullableValue(event.minPrice) : null,
      maxPrice: event.updateMaxPrice ? NullableValue(event.maxPrice) : null,
    ));

    try {
      final result = await _repository.fetchProducts(
        departmentId: event.departmentId,
        categoryId: event.categoryId,
        collectionId: event.collectionId,
        brandId: event.brandId,
        filterType: event.filterType,
        sortBy: event.sortBy,
        sortPrice: event.updatePriceSort ? event.sortPrice : state.sortPrice,
        selectedAttributes: event.selectedAttributes ?? state.selectedAttributes,
        minPrice: event.minPrice ?? state.minPrice,
        maxPrice: event.maxPrice ?? state.maxPrice,
        page: event.page,
      );

      final filters = (result['filters'] as List)
          .map((f) => AttributeFilterModel.fromJson(f as Map<String, dynamic>))
          .toList();

      emit(state.copyWith(
        status: ProductsStatus.success,
        products: result['variations'] as List<VariationModel>,
        currentPage: result['page'] as int,
        totalPages: result['totalPages'] as int,
        totalDocs: result['totalDocs'] as int,
        hasNextPage: result['hasNextPage'] as bool,
        filters: filters,
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
        brandId: state.brandId,
        filterType: state.filterType,
        sortBy: state.sortBy,
        sortPrice: state.sortPrice,
        selectedAttributes: state.selectedAttributes,
        minPrice: state.minPrice,
        maxPrice: state.maxPrice,
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
        totalDocs: result['totalDocs'] as int,
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
      brandId: state.brandId,
      filterType: state.filterType,
      sortBy: state.sortBy,
      sortPrice: state.sortPrice,
      page: 1,
    ));
  }

  Future<void> _onChangeSortOption(
    ChangeSortOption event,
    Emitter<ProductsState> emit,
  ) async {
    add(FetchProducts(
      departmentId: state.departmentId,
      categoryId: state.categoryId,
      collectionId: state.collectionId,
      brandId: state.brandId,
      filterType: state.filterType,
      sortBy: event.sortBy,
      sortPrice: state.sortPrice,
      page: 1,
    ));
  }

  Future<void> _onChangePriceSort(
    ChangePriceSort event,
    Emitter<ProductsState> emit,
  ) async {
    add(FetchProducts(
      departmentId: state.departmentId,
      categoryId: state.categoryId,
      collectionId: state.collectionId,
      brandId: state.brandId,
      filterType: state.filterType,
      sortBy: state.sortBy,
      sortPrice: event.sortPrice,
      selectedAttributes: state.selectedAttributes,
      minPrice: state.minPrice,
      maxPrice: state.maxPrice,
      updatePriceSort: true,
      page: 1,
    ));
  }

  void _onResetProducts(
    ResetProducts event,
    Emitter<ProductsState> emit,
  ) {
    emit(const ProductsState());
  }

  Future<void> _onChangeAttributeFilter(
    ChangeAttributeFilter event,
    Emitter<ProductsState> emit,
  ) async {
    // Update selected attributes
    final newSelectedAttributes = Map<String, List<String>>.from(state.selectedAttributes);
    
    if (event.optionIds.isEmpty) {
      // Remove attribute filter if no options selected
      newSelectedAttributes.remove(event.attributeId);
    } else {
      // Set selected options for this attribute
      newSelectedAttributes[event.attributeId] = event.optionIds;
    }
    
    // Refetch products with updated attribute filters
    add(FetchProducts(
      departmentId: state.departmentId,
      categoryId: state.categoryId,
      collectionId: state.collectionId,
      brandId: state.brandId,
      filterType: state.filterType,
      sortBy: state.sortBy,
      sortPrice: state.sortPrice,
      selectedAttributes: newSelectedAttributes,
      minPrice: state.minPrice,
      maxPrice: state.maxPrice,
      page: 1,
    ));
  }

  Future<void> _onChangePriceRange(
    ChangePriceRange event,
    Emitter<ProductsState> emit,
  ) async {
    // Refetch products with updated price range
    add(FetchProducts(
      departmentId: state.departmentId,
      categoryId: state.categoryId,
      collectionId: state.collectionId,
      brandId: state.brandId,
      filterType: state.filterType,
      sortBy: state.sortBy,
      sortPrice: state.sortPrice,
      selectedAttributes: state.selectedAttributes,
      minPrice: event.minPrice,
      maxPrice: event.maxPrice,
      updateMinPrice: true,
      updateMaxPrice: true,
      page: 1,
    ));
  }
}
