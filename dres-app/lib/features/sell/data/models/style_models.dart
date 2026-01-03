/// Response from create style endpoint
class CreateStyleResponse {
  final String id;
  final String status;
  final String message;

  CreateStyleResponse({
    required this.id,
    required this.status,
    required this.message,
  });

  factory CreateStyleResponse.fromJson(Map<String, dynamic> json) {
    // Payload returns { doc: { id: ..., ... }, message: ... }
    // or directly { id: ..., ... }
    final doc = json['doc'] as Map<String, dynamic>?;
    final actualData = doc ?? json;

    return CreateStyleResponse(
      id: actualData['id']?.toString() ?? '',
      status: json['status'] ?? 'success',
      message: json['message'] ?? 'Style created successfully',
    );
  }
}

/// Response from update style endpoint
class UpdateStyleResponse {
  final bool success;
  final String message;

  UpdateStyleResponse({required this.success, required this.message});

  factory UpdateStyleResponse.fromJson(Map<String, dynamic> json) {
    return UpdateStyleResponse(
      success: json['success'] ?? true,
      message: json['message'] ?? 'Style updated successfully',
    );
  }
}

/// Request body for updating style details (Step 1)
class UpdateStyleDetailsRequest {
  final String title;
  final String? description;
  final String? departmentId;
  final String? collectionId;
  final String categoryId;
  final String brandId;

  UpdateStyleDetailsRequest({
    required this.title,
    this.description,
    this.departmentId,
    this.collectionId,
    required this.categoryId,
    required this.brandId,
  });

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      if (description != null && description!.isNotEmpty)
        'description': description,
      if (departmentId != null) 'department': departmentId,
      if (collectionId != null) 'collection': collectionId,
      'category': categoryId,
      'brand': brandId,
    };
  }
}

/// Model for style details data (loaded from API)
class StyleDetailsModel {
  final String id;
  final String? title;
  final String? description;
  final String status; // 'draft' or 'published'
  final String? departmentId;
  final String? departmentName;
  final String? collectionId;
  final String? collectionName;
  final String? categoryId;
  final String? categoryName;
  final String? brandId;
  final String? brandName;

  StyleDetailsModel({
    required this.id,
    this.title,
    this.description,
    this.status = 'draft',
    this.departmentId,
    this.departmentName,
    this.collectionId,
    this.collectionName,
    this.categoryId,
    this.categoryName,
    this.brandId,
    this.brandName,
  });

  bool get isPublished => status == 'published';
  bool get isDraft => status == 'draft';

  factory StyleDetailsModel.fromJson(Map<String, dynamic> json) {
    // Helper to extract ID from relationship (can be string ID or object with id)
    String? extractId(dynamic value) {
      if (value == null) return null;
      if (value is String) return value;
      if (value is Map) return value['id']?.toString();
      return null;
    }

    // Helper to extract name from relationship object
    // Note: Categories use 'category' field for name, others use 'name'
    String? extractName(dynamic value, {String fieldName = 'name'}) {
      if (value == null) return null;
      if (value is Map) return value[fieldName]?.toString();
      return null;
    }

    final result = StyleDetailsModel(
      id: json['id'] ?? '',
      title: json['title'],
      description: json['description'],
      status: json['status'] ?? 'draft',
      departmentId: extractId(json['department']),
      departmentName: extractName(json['department']),
      collectionId: extractId(json['collection']),
      collectionName: extractName(json['collection']),
      categoryId: extractId(json['category']),
      // Categories use 'category' field for name, not 'name'
      categoryName: extractName(json['category'], fieldName: 'category'),
      brandId: extractId(json['brand']),
      brandName: extractName(json['brand']),
    );

    return result;
  }
}
