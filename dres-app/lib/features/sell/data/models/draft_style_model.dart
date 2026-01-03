/// Draft style model representing an incomplete/unfinished style
class DraftStyleModel {
  final String id;
  final String title;
  final String? brandName;
  final String? thumbnail;
  final int stepsLeft;
  final List<String> missingSteps;
  final DateTime updatedAt;
  final DateTime createdAt;

  DraftStyleModel({
    required this.id,
    required this.title,
    this.brandName,
    this.thumbnail,
    required this.stepsLeft,
    required this.missingSteps,
    required this.updatedAt,
    required this.createdAt,
  });

  factory DraftStyleModel.fromJson(Map<String, dynamic> json) {
    return DraftStyleModel(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      brandName: json['brandName'],
      thumbnail: json['thumbnail'],
      stepsLeft: json['stepsLeft'] ?? 0,
      missingSteps: (json['missingSteps'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'])
          : DateTime.now(),
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'brandName': brandName,
      'thumbnail': thumbnail,
      'stepsLeft': stepsLeft,
      'missingSteps': missingSteps,
      'updatedAt': updatedAt.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
    };
  }
}
