import 'package:dres/core/services/api_service.dart';
import 'package:dres/features/sell/data/models/style_stats_model.dart';

export 'package:dres/features/sell/data/models/style_stats_model.dart';

class StyleStatsRepository {
  final ApiService _apiService;

  StyleStatsRepository({required ApiService apiService})
      : _apiService = apiService;

  /// Get statistics for a style
  Future<StyleStatsModel> getStyleStats(String styleId) async {
    final response = await _apiService.get('/styles/$styleId/stats');
    return StyleStatsModel.fromJson(response.data);
  }
}
