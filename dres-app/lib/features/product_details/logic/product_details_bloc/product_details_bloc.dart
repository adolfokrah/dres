import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dres/features/product_details/data/repositories/product_details_repository.dart';
import 'package:dres/features/product_details/logic/product_details_bloc/product_details_event.dart';
import 'package:dres/features/product_details/logic/product_details_bloc/product_details_state.dart';

class ProductDetailsBloc extends Bloc<ProductDetailsEvent, ProductDetailsState> {
  final ProductDetailsRepository _repository;

  ProductDetailsBloc(this._repository) : super(const ProductDetailsState()) {
    on<FetchProductDetails>(_onFetchProductDetails);
  }

  Future<void> _onFetchProductDetails(
    FetchProductDetails event,
    Emitter<ProductDetailsState> emit,
  ) async {
    emit(state.copyWith(
      status: ProductDetailsStatus.loading,
      selectedSkuId: event.skuId,
    ));

    try {
      final result = await _repository.fetchProductDetails(event.variationId);
      
      emit(state.copyWith(
        status: ProductDetailsStatus.success,
        productData: result,
      ));
    } catch (error) {
      emit(state.copyWith(
        status: ProductDetailsStatus.failure,
        errorMessage: error.toString(),
      ));
    }
  }
}
