import 'dart:io';

import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dres/core/services/api_exception.dart';
import 'package:dres/features/product_details/data/repositories/reviews_repository.dart';

part 'create_review_event.dart';
part 'create_review_state.dart';

class CreateReviewBloc extends Bloc<CreateReviewEvent, CreateReviewState> {
  final ReviewsRepository _reviewsRepository;

  CreateReviewBloc({required ReviewsRepository reviewsRepository})
      : _reviewsRepository = reviewsRepository,
        super(const CreateReviewState()) {
    on<CreateReviewSubmitted>(_onSubmitted);
    on<CreateReviewRatingChanged>(_onRatingChanged);
    on<CreateReviewTextChanged>(_onTextChanged);
    on<CreateReviewImagesChanged>(_onImagesChanged);
    on<CreateReviewReset>(_onReset);
  }

  void _onRatingChanged(
    CreateReviewRatingChanged event,
    Emitter<CreateReviewState> emit,
  ) {
    emit(state.copyWith(rating: event.rating));
  }

  void _onTextChanged(
    CreateReviewTextChanged event,
    Emitter<CreateReviewState> emit,
  ) {
    emit(state.copyWith(reviewText: event.text));
  }

  void _onImagesChanged(
    CreateReviewImagesChanged event,
    Emitter<CreateReviewState> emit,
  ) {
    emit(state.copyWith(images: event.images));
  }

  void _onReset(
    CreateReviewReset event,
    Emitter<CreateReviewState> emit,
  ) {
    emit(const CreateReviewState());
  }

  Future<void> _onSubmitted(
    CreateReviewSubmitted event,
    Emitter<CreateReviewState> emit,
  ) async {
    // Validate rating
    if (state.rating < 1 || state.rating > 5) {
      emit(state.copyWith(
        status: CreateReviewStatus.failure,
        errorMessage: 'Please select a rating',
      ));
      return;
    }

    // Validate review text is required
    if (state.reviewText.trim().isEmpty) {
      emit(state.copyWith(
        status: CreateReviewStatus.failure,
        errorMessage: 'Please write a review',
      ));
      return;
    }

    emit(state.copyWith(status: CreateReviewStatus.submitting));

    try {
      await _reviewsRepository.createReview(
        styleId: event.styleId,
        rating: state.rating,
        review: state.reviewText.trim(),
        images: state.images.isNotEmpty ? state.images : null,
      );

      emit(state.copyWith(status: CreateReviewStatus.success));
    } catch (e) {
      emit(state.copyWith(
        status: CreateReviewStatus.failure,
        errorMessage: getErrorMessage(e),
      ));
    }
  }
}
