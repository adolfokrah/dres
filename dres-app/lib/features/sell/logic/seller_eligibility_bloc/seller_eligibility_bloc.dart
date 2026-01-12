import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dres/features/sell/data/models/seller_eligibility_model.dart';
import 'package:dres/features/sell/data/repositories/seller_eligibility_repository.dart';

part 'seller_eligibility_event.dart';
part 'seller_eligibility_state.dart';

class SellerEligibilityBloc
    extends Bloc<SellerEligibilityEvent, SellerEligibilityState> {
  final SellerEligibilityRepository _repository;

  SellerEligibilityBloc({
    required SellerEligibilityRepository repository,
  })  : _repository = repository,
        super(const SellerEligibilityState()) {
    on<SellerEligibilityFetchRequested>(_onFetchRequested);
    on<SellerEligibilityRefreshRequested>(_onRefreshRequested);
  }

  Future<void> _onFetchRequested(
    SellerEligibilityFetchRequested event,
    Emitter<SellerEligibilityState> emit,
  ) async {
    emit(state.copyWith(status: SellerEligibilityStatus.loading));

    try {
      final eligibility = await _repository.getSellerEligibility();
      emit(state.copyWith(
        status: SellerEligibilityStatus.loaded,
        eligibility: eligibility,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: SellerEligibilityStatus.error,
        error: e.toString(),
      ));
    }
  }

  Future<void> _onRefreshRequested(
    SellerEligibilityRefreshRequested event,
    Emitter<SellerEligibilityState> emit,
  ) async {
    // Don't show loading state on refresh, just update data
    try {
      final eligibility = await _repository.getSellerEligibility();
      emit(state.copyWith(
        status: SellerEligibilityStatus.loaded,
        eligibility: eligibility,
      ));
    } catch (e) {
      // Keep existing data on refresh error
      emit(state.copyWith(error: e.toString()));
    }
  }
}
