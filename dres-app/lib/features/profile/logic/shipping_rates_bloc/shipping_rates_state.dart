part of 'shipping_rates_bloc.dart';

enum ShippingRatesStatus {
  initial,
  loading,
  loaded,
  loadingCities,
  citiesLoaded,
  creating,
  created,
  updating,
  updated,
  deleting,
  deleted,
  error,
}

class ShippingRatesState extends Equatable {
  final ShippingRatesStatus status;
  final List<ShippingRateModel> shippingRates;
  final List<RegionModel> regions;
  final List<CityModel> allCities;
  final String? errorMessage;

  const ShippingRatesState({
    this.status = ShippingRatesStatus.initial,
    this.shippingRates = const [],
    this.regions = const [],
    this.allCities = const [],
    this.errorMessage,
  });

  ShippingRatesState copyWith({
    ShippingRatesStatus? status,
    List<ShippingRateModel>? shippingRates,
    List<RegionModel>? regions,
    List<CityModel>? allCities,
    String? errorMessage,
  }) {
    return ShippingRatesState(
      status: status ?? this.status,
      shippingRates: shippingRates ?? this.shippingRates,
      regions: regions ?? this.regions,
      allCities: allCities ?? this.allCities,
      errorMessage: errorMessage,
    );
  }

  @override
  List<Object?> get props => [
        status,
        shippingRates,
        regions,
        allCities,
        errorMessage,
      ];
}
