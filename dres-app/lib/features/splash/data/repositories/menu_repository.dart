import 'package:dres/core/services/api_service.dart';
import 'package:dres/core/models/menu_model.dart';

/// Model for a top seller
class TopSeller {
  final String id;
  final String name;
  final String? username;
  final String? shopName;
  final String? avatarUrl;

  TopSeller({
    required this.id,
    required this.name,
    this.username,
    this.shopName,
    this.avatarUrl,
  });

  factory TopSeller.fromJson(Map<String, dynamic> json) {
    return TopSeller(
      id: json['id'] as String,
      name: json['name'] as String? ?? '',
      username: json['username'] as String?,
      shopName: json['shopName'] as String?,
      avatarUrl: json['avatar'] != null ? json['avatar']['url'] as String? : null,
    );
  }
}

class MenuRepository {
  final ApiService _apiService;

  MenuRepository(this._apiService);

  /// Fetch menu structure (departments -> collections -> categories)
  Future<MenuModel> fetchMenu() async {
    try {
      final response = await _apiService.get('/menu');
      return MenuModel.fromJson(response.data);
    } catch (e) {
      throw Exception('Failed to fetch menu: $e');
    }
  }

  /// Fetch top sellers for a department/collection/category
  Future<List<TopSeller>> fetchTopSellers({
    String? departmentId,
    String? collectionId,
    String? categoryId,
    int limit = 5,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'limit': limit,
      };
      if (departmentId != null) queryParams['departmentId'] = departmentId;
      if (collectionId != null) queryParams['collectionId'] = collectionId;
      if (categoryId != null) queryParams['categoryId'] = categoryId;

      final response = await _apiService.get(
        '/top-sellers',
        queryParameters: queryParams,
      );

      final sellers = (response.data['sellers'] as List?)
          ?.map((s) => TopSeller.fromJson(s as Map<String, dynamic>))
          .toList() ?? [];

      return sellers;
    } catch (e) {
      throw Exception('Failed to fetch top sellers: $e');
    }
  }
}
