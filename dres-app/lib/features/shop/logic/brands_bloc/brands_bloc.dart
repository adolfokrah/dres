import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dres/core/services/api_exception.dart';
import 'package:dres/features/shop/data/repositories/brands_repository.dart';
import 'package:dres/features/shop/logic/brands_bloc/brands_event.dart';
import 'package:dres/features/shop/logic/brands_bloc/brands_state.dart';

class BrandsBloc extends Bloc<BrandsEvent, BrandsState> {
  final BrandsRepository _repository;

  BrandsBloc(this._repository) : super(const BrandsState()) {
    on<FetchBrands>(_onFetchBrands);
  }

  Future<void> _onFetchBrands(
    FetchBrands event,
    Emitter<BrandsState> emit,
  ) async {
    emit(state.copyWith(status: BrandsStatus.loading));

    try {
      final brands = await _repository.fetchBrands(
        departmentId: event.departmentId,
      );

      emit(state.copyWith(
        status: BrandsStatus.success,
        brands: brands,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: BrandsStatus.failure,
        errorMessage: getErrorMessage(e),
      ));
    }
  }
}
