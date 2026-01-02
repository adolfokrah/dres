/// Seller review image model
class SellerReviewImageModel {
  final String id;
  final String url;
  final String? thumbnailURL;

  SellerReviewImageModel({
    required this.id,
    required this.url,
    this.thumbnailURL,
  });

  factory SellerReviewImageModel.fromJson(Map<String, dynamic> json) {
    return SellerReviewImageModel(
      id: json['id'] ?? '',
      url: json['url'] ?? '',
      thumbnailURL: json['thumbnailURL'],
    );
  }
}

/// Seller review user model
class SellerReviewUserModel {
  final String id;
  final String name;
  final String? username;
  final String? avatar;

  SellerReviewUserModel({
    required this.id,
    required this.name,
    this.username,
    this.avatar,
  });

  factory SellerReviewUserModel.fromJson(Map<String, dynamic> json) {
    return SellerReviewUserModel(
      id: json['id'] ?? '',
      name: json['name'] ?? 'Unknown',
      username: json['username'],
      avatar: json['avatar'],
    );
  }
}

/// Seller review model
class SellerReviewModel {
  final String id;
  final SellerReviewUserModel user;
  final int rating;
  final String? review;
  final List<SellerReviewImageModel> images;
  final DateTime createdAt;

  SellerReviewModel({
    required this.id,
    required this.user,
    required this.rating,
    this.review,
    required this.images,
    required this.createdAt,
  });

  factory SellerReviewModel.fromJson(Map<String, dynamic> json) {
    return SellerReviewModel(
      id: json['id'] ?? '',
      user: SellerReviewUserModel.fromJson(json['user'] ?? {}),
      rating: json['rating'] ?? 0,
      review: json['review'],
      images: (json['images'] as List<dynamic>?)
              ?.map((e) => SellerReviewImageModel.fromJson(e))
              .toList() ??
          [],
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
    );
  }

  /// Get image URLs as list of strings for the ReviewItem widget
  List<String> get imageUrls => images.map((img) => img.url).toList();
}

/// Seller reviews response with pagination
class SellerReviewsResponse {
  final List<SellerReviewModel> reviews;
  final int totalDocs;
  final int totalPages;
  final int page;
  final int limit;
  final bool hasNextPage;
  final bool hasPrevPage;
  final double averageRating;
  final int totalReviews;

  SellerReviewsResponse({
    required this.reviews,
    required this.totalDocs,
    required this.totalPages,
    required this.page,
    required this.limit,
    required this.hasNextPage,
    required this.hasPrevPage,
    required this.averageRating,
    required this.totalReviews,
  });

  factory SellerReviewsResponse.fromJson(Map<String, dynamic> json) {
    return SellerReviewsResponse(
      reviews: (json['reviews'] as List<dynamic>?)
              ?.map((e) => SellerReviewModel.fromJson(e))
              .toList() ??
          [],
      totalDocs: json['totalDocs'] ?? 0,
      totalPages: json['totalPages'] ?? 1,
      page: json['page'] ?? 1,
      limit: json['limit'] ?? 10,
      hasNextPage: json['hasNextPage'] ?? false,
      hasPrevPage: json['hasPrevPage'] ?? false,
      averageRating: (json['averageRating'] ?? 0).toDouble(),
      totalReviews: json['totalReviews'] ?? 0,
    );
  }
}
