import 'package:flutter/foundation.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dres/core/services/api_exception.dart';
import 'package:dres/features/profile/data/repositories/seller_products_repository.dart';
import 'package:dres/features/profile/logic/seller_products_bloc/seller_products_event.dart';
import 'package:dres/features/profile/logic/seller_products_bloc/seller_products_state.dart';

export 'seller_products_event.dart';
export 'seller_products_state.dart';

class SellerProductsBloc extends Bloc<SellerProductsEvent, SellerProductsState> {
  final SellerProductsRepository _sellerProductsRepository;

  SellerProductsBloc({required SellerProductsRepository sellerProductsRepository})
      : _sellerProductsRepository = sellerProductsRepository,
        super(const SellerProductsState()) {
    on<SellerProductsFetchRequested>(_onFetchRequested);
    on<SellerProductsLoadMoreRequested>(_onLoadMoreRequested);
  }

  Future<void> _onFetchRequested(
    SellerProductsFetchRequested event,
    Emitter<SellerProductsState> emit,
  ) async {
    debugPrint('🛍️ SellerProductsBloc: Fetching products for seller ${event.sellerId}');
    emit(state.copyWith(
      status: SellerProductsStatus.loading,
      currentSellerId: event.sellerId,
    ));

    try {
      final response = await _sellerProductsRepository.getSellerProducts(
        sellerId: event.sellerId,
        page: 1,
      );
      debugPrint('🛍️ SellerProductsBloc: Got ${response.products.length} products');
      emit(state.copyWith(
        status: SellerProductsStatus.success,
        products: response.products,
        totalDocs: response.totalDocs,
        hasMore: response.hasNextPage,
        currentPage: 1,
      ));
    } catch (e) {
      debugPrint('🛍️ SellerProductsBloc: Error fetching products: $e');
      emit(state.copyWith(
        status: SellerProductsStatus.error,
        errorMessage: getErrorMessage(e),
      ));
    }
  }

  Future<void> _onLoadMoreRequested(
    SellerProductsLoadMoreRequested event,
    Emitter<SellerProductsState> emit,
  ) async {
    if (!state.hasMore || state.status == SellerProductsStatus.loadingMore) {
      return;
    }

    emit(state.copyWith(status: SellerProductsStatus.loadingMore));

    try {
      final nextPage = state.currentPage + 1;
      final response = await _sellerProductsRepository.getSellerProducts(
        sellerId: event.sellerId,
        page: nextPage,
      );
      emit(state.copyWith(
        status: SellerProductsStatus.success,
        products: [...state.products, ...response.products],
        hasMore: response.hasNextPage,
        currentPage: nextPage,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: SellerProductsStatus.error,
        errorMessage: getErrorMessage(e),
      ));
    }
  }
}
