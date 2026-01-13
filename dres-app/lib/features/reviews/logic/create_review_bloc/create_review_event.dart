part of 'create_review_bloc.dart';

abstract class CreateReviewEvent extends Equatable {
  const CreateReviewEvent();

  @override
  List<Object?> get props => [];
}

/// Submit the review
class CreateReviewSubmitted extends CreateReviewEvent {
  final String styleId;

  const CreateReviewSubmitted({required this.styleId});

  @override
  List<Object?> get props => [styleId];
}

/// Rating changed
class CreateReviewRatingChanged extends CreateReviewEvent {
  final int rating;

  const CreateReviewRatingChanged({required this.rating});

  @override
  List<Object?> get props => [rating];
}

/// Review text changed
class CreateReviewTextChanged extends CreateReviewEvent {
  final String text;

  const CreateReviewTextChanged({required this.text});

  @override
  List<Object?> get props => [text];
}

/// Images changed
class CreateReviewImagesChanged extends CreateReviewEvent {
  final List<File> images;

  const CreateReviewImagesChanged({required this.images});

  @override
  List<Object?> get props => [images];
}

/// Reset the form
class CreateReviewReset extends CreateReviewEvent {
  const CreateReviewReset();
}
