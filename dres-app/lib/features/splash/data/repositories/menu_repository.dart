import 'package:dres/core/services/api_service.dart';
import 'package:dres/core/models/menu_model.dart';

class MenuRepository {
  final ApiService _apiService;

  MenuRepository(this._apiService);

  /// Fetch menu structure (departments -> collections -> categories)
  Future<MenuModel> fetchMenu() async {
    try {
      final response = await _apiService.get('/menu');
      
      // Debug log
      print('Menu API Response: ${response.data}');
      
      return MenuModel.fromJson(response.data);
    } catch (e) {
      print('Error in MenuRepository.fetchMenu: $e');
      throw Exception('Failed to fetch menu: $e');
    }
  }
}
