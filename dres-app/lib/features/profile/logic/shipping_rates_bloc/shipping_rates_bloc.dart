import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:dres/features/profile/data/models/shipping_rate_model.dart';
import 'package:dres/features/profile/data/repositories/shipping_rates_repository.dart';
import 'package:dres/features/cart/data/models/location_model.dart';

part 'shipping_rates_event.dart';
part 'shipping_rates_state.dart';

class ShippingRatesBloc extends Bloc<ShippingRatesEvent, ShippingRatesState> {
  final ShippingRatesRepository _repository;

  ShippingRatesBloc({required ShippingRatesRepository repository})
      : _repository = repository,
        super(const ShippingRatesState()) {
    on<ShippingRatesFetchRequested>(_onFetchRequested);
    on<ShippingRatesCitiesFetchRequested>(_onCitiesFetchRequested);
    on<ShippingRateCreateRequested>(_onCreateRequested);
    on<ShippingRateUpdateRequested>(_onUpdateRequested);
    on<ShippingRateDeleteRequested>(_onDeleteRequested);
  }

  Future<void> _onFetchRequested(
    ShippingRatesFetchRequested event,
    Emitter<ShippingRatesState> emit,
  ) async {
    emit(state.copyWith(status: ShippingRatesStatus.loading));

    try {
      final shippingRates = await _repository.getShippingRates();
      emit(state.copyWith(
        status: ShippingRatesStatus.loaded,
        shippingRates: shippingRates,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: ShippingRatesStatus.error,
        errorMessage: e.toString(),
      ));
    }
  }

  Future<void> _onCitiesFetchRequested(
    ShippingRatesCitiesFetchRequested event,
    Emitter<ShippingRatesState> emit,
  ) async {
    emit(state.copyWith(status: ShippingRatesStatus.loadingCities));

    try {
      final response = await _repository.getCitiesByCountry();
      emit(state.copyWith(
        status: ShippingRatesStatus.citiesLoaded,
        regions: response.regions,
        allCities: response.allCities,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: ShippingRatesStatus.error,
        errorMessage: e.toString(),
      ));
    }
  }

  Future<void> _onCreateRequested(
    ShippingRateCreateRequested event,
    Emitter<ShippingRatesState> emit,
  ) async {
    emit(state.copyWith(status: ShippingRatesStatus.creating));

    try {
      final newRate = await _repository.createShippingRate(
        cityIds: event.cityIds,
        deliveryCost: event.deliveryCost,
        freeShippingThreshold: event.freeShippingThreshold,
      );

      emit(state.copyWith(
        status: ShippingRatesStatus.created,
        shippingRates: [...state.shippingRates, newRate],
      ));
    } catch (e) {
      emit(state.copyWith(
        status: ShippingRatesStatus.error,
        errorMessage: e.toString(),
      ));
    }
  }

  Future<void> _onUpdateRequested(
    ShippingRateUpdateRequested event,
    Emitter<ShippingRatesState> emit,
  ) async {
    emit(state.copyWith(status: ShippingRatesStatus.updating));

    try {
      final updatedRate = await _repository.updateShippingRate(
        id: event.id,
        cityIds: event.cityIds,
        deliveryCost: event.deliveryCost,
        freeShippingThreshold: event.freeShippingThreshold,
        isActive: event.isActive,
      );

      final updatedRates = state.shippingRates.map((rate) {
        return rate.id == event.id ? updatedRate : rate;
      }).toList();

      emit(state.copyWith(
        status: ShippingRatesStatus.updated,
        shippingRates: updatedRates,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: ShippingRatesStatus.error,
        errorMessage: e.toString(),
      ));
    }
  }

  Future<void> _onDeleteRequested(
    ShippingRateDeleteRequested event,
    Emitter<ShippingRatesState> emit,
  ) async {
    emit(state.copyWith(status: ShippingRatesStatus.deleting));

    try {
      await _repository.deleteShippingRate(event.id);

      final updatedRates = state.shippingRates
          .where((rate) => rate.id != event.id)
          .toList();

      emit(state.copyWith(
        status: ShippingRatesStatus.deleted,
        shippingRates: updatedRates,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: ShippingRatesStatus.error,
        errorMessage: e.toString(),
      ));
    }
  }
}
