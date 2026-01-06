part of 'shipping_rates_bloc.dart';

abstract class ShippingRatesEvent extends Equatable {
  const ShippingRatesEvent();

  @override
  List<Object?> get props => [];
}

/// Fetch user's shipping rates
class ShippingRatesFetchRequested extends ShippingRatesEvent {
  const ShippingRatesFetchRequested();
}

/// Fetch cities for the user's country
class ShippingRatesCitiesFetchRequested extends ShippingRatesEvent {
  const ShippingRatesCitiesFetchRequested();
}

/// Create a new shipping rate
class ShippingRateCreateRequested extends ShippingRatesEvent {
  final List<String> cityIds;
  final double deliveryCost;
  final double? freeShippingThreshold;

  const ShippingRateCreateRequested({
    required this.cityIds,
    required this.deliveryCost,
    this.freeShippingThreshold,
  });

  @override
  List<Object?> get props => [
        cityIds,
        deliveryCost,
        freeShippingThreshold,
      ];
}

/// Update an existing shipping rate
class ShippingRateUpdateRequested extends ShippingRatesEvent {
  final String id;
  final List<String>? cityIds;
  final double? deliveryCost;
  final double? freeShippingThreshold;
  final bool? isActive;

  const ShippingRateUpdateRequested({
    required this.id,
    this.cityIds,
    this.deliveryCost,
    this.freeShippingThreshold,
    this.isActive,
  });

  @override
  List<Object?> get props => [
        id,
        cityIds,
        deliveryCost,
        freeShippingThreshold,
        isActive,
      ];
}

/// Delete a shipping rate
class ShippingRateDeleteRequested extends ShippingRatesEvent {
  final String id;

  const ShippingRateDeleteRequested({required this.id});

  @override
  List<Object?> get props => [id];
}
