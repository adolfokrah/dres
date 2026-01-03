import 'package:dres/features/sell/data/models/draft_style_model.dart';

/// Response from the get my drafts endpoint
class GetDraftStylesResponse {
  final List<DraftStyleModel> drafts;
  final int totalDrafts;

  GetDraftStylesResponse({
    required this.drafts,
    required this.totalDrafts,
  });

  factory GetDraftStylesResponse.fromJson(Map<String, dynamic> json) {
    return GetDraftStylesResponse(
      drafts: (json['drafts'] as List<dynamic>?)
              ?.map((e) => DraftStyleModel.fromJson(e))
              .toList() ??
          [],
      totalDrafts: json['totalDrafts'] ?? 0,
    );
  }
}
