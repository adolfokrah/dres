class SavedSearchModel {
  final String id;
  final String? name;
  final Map<String, dynamic> searchData;
  final bool isActive;
  final DateTime createdAt;
  final DateTime? lastChecked;
  final DateTime? lastNotificationSent;

  SavedSearchModel({
    required this.id,
    this.name,
    required this.searchData,
    required this.isActive,
    required this.createdAt,
    this.lastChecked,
    this.lastNotificationSent,
  });

  factory SavedSearchModel.fromJson(Map<String, dynamic> json) {
    return SavedSearchModel(
      id: json['id'] as String,
      name: json['name'] as String?,
      searchData: json['searchData'] as Map<String, dynamic>,
      isActive: json['isActive'] as bool? ?? true,
      createdAt: DateTime.parse(json['createdAt'] as String),
      lastChecked: json['lastChecked'] != null
          ? DateTime.parse(json['lastChecked'] as String)
          : null,
      lastNotificationSent: json['lastNotificationSent'] != null
          ? DateTime.parse(json['lastNotificationSent'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'searchData': searchData,
      'isActive': isActive,
      'createdAt': createdAt.toIso8601String(),
      'lastChecked': lastChecked?.toIso8601String(),
      'lastNotificationSent': lastNotificationSent?.toIso8601String(),
    };
  }

  SavedSearchModel copyWith({
    String? id,
    String? name,
    Map<String, dynamic>? searchData,
    bool? isActive,
    DateTime? createdAt,
    DateTime? lastChecked,
    DateTime? lastNotificationSent,
  }) {
    return SavedSearchModel(
      id: id ?? this.id,
      name: name ?? this.name,
      searchData: searchData ?? this.searchData,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
      lastChecked: lastChecked ?? this.lastChecked,
      lastNotificationSent: lastNotificationSent ?? this.lastNotificationSent,
    );
  }
}

class SaveSearchRequest {
  final String? name;
  final Map<String, dynamic> searchData;

  SaveSearchRequest({
    this.name,
    required this.searchData,
  });

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'searchData': searchData,
    };
  }
}

class SaveSearchResponse {
  final bool success;
  final String? message;
  final SavedSearchModel? savedSearch;

  SaveSearchResponse({
    required this.success,
    this.message,
    this.savedSearch,
  });

  factory SaveSearchResponse.fromJson(Map<String, dynamic> json) {
    return SaveSearchResponse(
      success: json['success'] as bool? ?? false,
      message: json['message'] as String?,
      savedSearch: json['doc'] != null 
          ? SavedSearchModel.fromJson(json['doc'] as Map<String, dynamic>)
          : null,
    );
  }
}

class GetSavedSearchesResponse {
  final bool success;
  final List<SavedSearchModel> searches;
  final int totalDocs;

  GetSavedSearchesResponse({
    required this.success,
    required this.searches,
    required this.totalDocs,
  });

  factory GetSavedSearchesResponse.fromJson(Map<String, dynamic> json) {
    final docs = json['docs'] as List<dynamic>? ?? [];
    return GetSavedSearchesResponse(
      success: true,
      searches: docs
          .map((doc) => SavedSearchModel.fromJson(doc as Map<String, dynamic>))
          .toList(),
      totalDocs: json['totalDocs'] as int? ?? 0,
    );
  }
}