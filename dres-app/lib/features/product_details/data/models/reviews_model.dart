class ReviewsModel {
  final List<ReviewModel> reviews;
  final int totalReviews;
  final double averageRating;
  final RatingDistributionModel ratingDistribution;

  ReviewsModel({
    required this.reviews,
    required this.totalReviews,
    required this.averageRating,
    required this.ratingDistribution,
  });

  factory ReviewsModel.fromJson(Map<String, dynamic> json) {
    return ReviewsModel(
      reviews: (json['reviews'] as List<dynamic>?)
              ?.map((r) => ReviewModel.fromJson(r))
              .toList() ??
          [],
      totalReviews: json['totalReviews'] ?? 0,
      averageRating: (json['averageRating'] ?? 0).toDouble(),
      ratingDistribution: RatingDistributionModel.fromJson(
        json['ratingDistribution'] ?? {},
      ),
    );
  }
}

class ReviewModel {
  final String id;
  final int rating;
  final String review;
  final List<String> images;
  final ReviewerModel reviewer;
  final String createdAt;
  final int helpful;
  final bool verified;

  ReviewModel({
    required this.id,
    required this.rating,
    required this.review,
    required this.images,
    required this.reviewer,
    required this.createdAt,
    required this.helpful,
    required this.verified,
  });

  factory ReviewModel.fromJson(Map<String, dynamic> json) {
    return ReviewModel(
      id: json['id'] ?? '',
      rating: json['rating'] ?? 0,
      review: json['review'] ?? '',
      images: (json['images'] as List<dynamic>?)
              ?.map((i) => i.toString())
              .toList() ??
          [],
      reviewer: ReviewerModel.fromJson(json['reviewer'] ?? {}),
      createdAt: json['createdAt'] ?? '',
      helpful: json['helpful'] ?? 0,
      verified: json['verified'] ?? false,
    );
  }
}

class ReviewerModel {
  final String id;
  final String name;
  final String? profileImage;

  ReviewerModel({
    required this.id,
    required this.name,
    this.profileImage,
  });

  factory ReviewerModel.fromJson(Map<String, dynamic> json) {
    return ReviewerModel(
      id: json['id'] ?? '',
      name: json['name'] ?? 'Anonymous',
      profileImage: json['profileImage'],
    );
  }
}

class RatingDistributionModel {
  final int five;
  final int four;
  final int three;
  final int two;
  final int one;

  RatingDistributionModel({
    required this.five,
    required this.four,
    required this.three,
    required this.two,
    required this.one,
  });

  factory RatingDistributionModel.fromJson(Map<String, dynamic> json) {
    return RatingDistributionModel(
      five: json['5'] ?? 0,
      four: json['4'] ?? 0,
      three: json['3'] ?? 0,
      two: json['2'] ?? 0,
      one: json['1'] ?? 0,
    );
  }
}
