import 'package:dres/core/services/api_service.dart';
import 'package:dres/features/sell/data/models/draft_styles_response.dart';

export 'package:dres/features/sell/data/models/draft_style_model.dart';
export 'package:dres/features/sell/data/models/draft_styles_response.dart';

class SellRepository {
  final ApiService _apiService;

  SellRepository({required ApiService apiService}) : _apiService = apiService;

  /// Get user's draft/incomplete styles
  Future<GetDraftStylesResponse> getMyDraftStyles() async {
    try {
      final response = await _apiService.get('/styles/my-drafts');
      return GetDraftStylesResponse.fromJson(response.data);
    } catch (_) {
      return GetDraftStylesResponse(drafts: [], totalDrafts: 0);
    }
  }
}
