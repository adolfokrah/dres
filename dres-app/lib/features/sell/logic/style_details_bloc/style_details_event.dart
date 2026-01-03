import 'package:equatable/equatable.dart';

abstract class StyleDetailsEvent extends Equatable {
  const StyleDetailsEvent();

  @override
  List<Object?> get props => [];
}

/// Create a new empty style
class StyleDetailsCreateRequested extends StyleDetailsEvent {
  const StyleDetailsCreateRequested();
}

/// Load existing style details
class StyleDetailsLoadRequested extends StyleDetailsEvent {
  final String styleId;

  const StyleDetailsLoadRequested({required this.styleId});

  @override
  List<Object?> get props => [styleId];
}

/// Update style details (Step 1)
class StyleDetailsUpdateRequested extends StyleDetailsEvent {
  final String styleId;
  final String title;
  final String? description;
  final String? departmentId;
  final String? collectionId;
  final String categoryId;
  final String brandId;

  const StyleDetailsUpdateRequested({
    required this.styleId,
    required this.title,
    this.description,
    this.departmentId,
    this.collectionId,
    required this.categoryId,
    required this.brandId,
  });

  @override
  List<Object?> get props => [
        styleId,
        title,
        description,
        departmentId,
        collectionId,
        categoryId,
        brandId,
      ];
}

/// Reset state
class StyleDetailsReset extends StyleDetailsEvent {
  const StyleDetailsReset();
}
