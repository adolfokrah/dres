import 'dart:io';
import 'package:equatable/equatable.dart';

enum AIListingStatus {
  initial,
  editing,
  generatingDescription,
  uploadingImages,
  submitting,
  success,
  failure,
}

class AIListingState extends Equatable {
  final AIListingStatus status;
  final List<File> images;
  final List<String>? uploadedImageIds;
  final String description;
  final List<String> sizes;
  final List<double> prices;
  final String? department;
  final String? collection;
  final String? category;
  final List<int?> stocks;
  final String? authenticity;
  final String? createdStyleId;
  final String? errorMessage;
  final double uploadProgress;

  const AIListingState({
    this.status = AIListingStatus.initial,
    this.images = const [],
    this.uploadedImageIds,
    this.description = '',
    this.sizes = const [],
    this.prices = const [],
    this.department,
    this.collection,
    this.category,
    this.stocks = const [],
    this.authenticity,
    this.createdStyleId,
    this.errorMessage,
    this.uploadProgress = 0.0,
  });

  bool get isValid {
    return images.isNotEmpty &&
        sizes.isNotEmpty &&
        prices.isNotEmpty &&
        prices.every((p) => p > 0) &&
        department != null &&
        department!.isNotEmpty &&
        collection != null &&
        collection!.isNotEmpty &&
        category != null &&
        category!.isNotEmpty;
  }

  AIListingState copyWith({
    AIListingStatus? status,
    List<File>? images,
    List<String>? uploadedImageIds,
    String? description,
    List<String>? sizes,
    List<double>? prices,
    String? department,
    String? collection,
    String? category,
    List<int?>? stocks,
    String? authenticity,
    String? createdStyleId,
    String? errorMessage,
    double? uploadProgress,
  }) {
    return AIListingState(
      status: status ?? this.status,
      images: images ?? this.images,
      uploadedImageIds: uploadedImageIds ?? this.uploadedImageIds,
      description: description ?? this.description,
      sizes: sizes ?? this.sizes,
      prices: prices ?? this.prices,
      department: department ?? this.department,
      collection: collection ?? this.collection,
      category: category ?? this.category,
      stocks: stocks ?? this.stocks,
      authenticity: authenticity ?? this.authenticity,
      createdStyleId: createdStyleId ?? this.createdStyleId,
      errorMessage: errorMessage ?? this.errorMessage,
      uploadProgress: uploadProgress ?? this.uploadProgress,
    );
  }

  @override
  List<Object?> get props => [
        status,
        images,
        uploadedImageIds,
        description,
        sizes,
        prices,
        department,
        collection,
        category,
        stocks,
        authenticity,
        createdStyleId,
        errorMessage,
        uploadProgress,
      ];
}
