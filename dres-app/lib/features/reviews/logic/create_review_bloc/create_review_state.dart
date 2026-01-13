part of 'create_review_bloc.dart';

enum CreateReviewStatus { initial, submitting, success, failure }

class CreateReviewState extends Equatable {
  final CreateReviewStatus status;
  final int rating;
  final String reviewText;
  final List<File> images;
  final String? errorMessage;

  const CreateReviewState({
    this.status = CreateReviewStatus.initial,
    this.rating = 0,
    this.reviewText = '',
    this.images = const [],
    this.errorMessage,
  });

  CreateReviewState copyWith({
    CreateReviewStatus? status,
    int? rating,
    String? reviewText,
    List<File>? images,
    String? errorMessage,
  }) {
    return CreateReviewState(
      status: status ?? this.status,
      rating: rating ?? this.rating,
      reviewText: reviewText ?? this.reviewText,
      images: images ?? this.images,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }

  @override
  List<Object?> get props => [status, rating, reviewText, images, errorMessage];
}
