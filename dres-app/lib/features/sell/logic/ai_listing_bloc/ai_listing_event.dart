import 'dart:io';
import 'package:equatable/equatable.dart';

abstract class AIListingEvent extends Equatable {
  const AIListingEvent();

  @override
  List<Object?> get props => [];
}

/// Add images to the listing
class AIListingImagesAdded extends AIListingEvent {
  final List<File> images;

  const AIListingImagesAdded({required this.images});

  @override
  List<Object?> get props => [images];
}

/// Remove an image from the listing
class AIListingImageRemoved extends AIListingEvent {
  final int index;

  const AIListingImageRemoved({required this.index});

  @override
  List<Object?> get props => [index];
}

/// Update product description
class AIListingDescriptionUpdated extends AIListingEvent {
  final String description;

  const AIListingDescriptionUpdated({required this.description});

  @override
  List<Object?> get props => [description];
}

/// Update available sizes
class AIListingSizesUpdated extends AIListingEvent {
  final List<String> sizes;

  const AIListingSizesUpdated({required this.sizes});

  @override
  List<Object?> get props => [sizes];
}

/// Update base price
class AIListingPriceUpdated extends AIListingEvent {
  final double price;

  const AIListingPriceUpdated({required this.price});

  @override
  List<Object?> get props => [price];
}

/// Update department
class AIListingDepartmentUpdated extends AIListingEvent {
  final String department;

  const AIListingDepartmentUpdated({required this.department});

  @override
  List<Object?> get props => [department];
}

/// Update collection
class AIListingCollectionUpdated extends AIListingEvent {
  final String collection;

  const AIListingCollectionUpdated({required this.collection});

  @override
  List<Object?> get props => [collection];
}

/// Update category
class AIListingCategoryUpdated extends AIListingEvent {
  final String category;

  const AIListingCategoryUpdated({required this.category});

  @override
  List<Object?> get props => [category];
}

/// Update stock (optional)
class AIListingStockUpdated extends AIListingEvent {
  final int? stock;

  const AIListingStockUpdated({required this.stock});

  @override
  List<Object?> get props => [stock];
}

/// Update authenticity
class AIListingAuthenticityUpdated extends AIListingEvent {
  final String? authenticity;

  const AIListingAuthenticityUpdated({required this.authenticity});

  @override
  List<Object?> get props => [authenticity];
}

/// Generate description from uploaded images
class AIListingDescriptionGenerateRequested extends AIListingEvent {
  const AIListingDescriptionGenerateRequested();
}

/// Submit the listing to AI for creation
class AIListingSubmitted extends AIListingEvent {
  const AIListingSubmitted();
}

/// Reset the form
class AIListingReset extends AIListingEvent {
  const AIListingReset();
}
