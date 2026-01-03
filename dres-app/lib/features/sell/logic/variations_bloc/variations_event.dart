import 'package:equatable/equatable.dart';

abstract class VariationsEvent extends Equatable {
  const VariationsEvent();

  @override
  List<Object?> get props => [];
}

/// Load variations for a style
class VariationsLoadRequested extends VariationsEvent {
  final String styleId;

  const VariationsLoadRequested({required this.styleId});

  @override
  List<Object?> get props => [styleId];
}

/// Refresh variations
class VariationsRefreshRequested extends VariationsEvent {
  const VariationsRefreshRequested();
}

/// Create a new variation
class VariationCreateRequested extends VariationsEvent {
  final String styleId;
  final List<Map<String, String>>? variants;

  const VariationCreateRequested({required this.styleId, this.variants});

  @override
  List<Object?> get props => [styleId, variants];
}

/// Delete a variation
class VariationDeleteRequested extends VariationsEvent {
  final String variationId;

  const VariationDeleteRequested({required this.variationId});

  @override
  List<Object?> get props => [variationId];
}
