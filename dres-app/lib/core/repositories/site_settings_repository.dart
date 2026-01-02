import 'package:dres/core/services/api_service.dart';
import 'package:dres/core/models/site_settings_model.dart';

export 'package:dres/core/models/site_settings_model.dart';

class SiteSettingsRepository {
  final ApiService _apiService;

  SiteSettingsRepository({required ApiService apiService})
      : _apiService = apiService;

  Future<SiteSettingsModel> getSiteSettings() async {
    try {
      final response = await _apiService.get('/site-settings');
      return SiteSettingsModel.fromJson(response.data);
    } catch (e) {
      // Return default settings if API fails
      return SiteSettingsModel.defaults();
    }
  }
}
