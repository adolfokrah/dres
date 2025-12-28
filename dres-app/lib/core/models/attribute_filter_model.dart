class AttributeFilterModel {
  final String id;
  final String name;
  final List<AttributeOptionModel> options;

  AttributeFilterModel({
    required this.id,
    required this.name,
    required this.options,
  });

  factory AttributeFilterModel.fromJson(Map<String, dynamic> json) {
    return AttributeFilterModel(
      id: json['id'] as String,
      name: json['name'] as String,
      options: (json['options'] as List)
          .map((o) => AttributeOptionModel.fromJson(o as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'options': options.map((o) => o.toJson()).toList(),
    };
  }
}

class AttributeOptionModel {
  final String id;
  final String name;
  final String slug;

  AttributeOptionModel({
    required this.id,
    required this.name,
    required this.slug,
  });

  factory AttributeOptionModel.fromJson(Map<String, dynamic> json) {
    return AttributeOptionModel(
      id: json['id'] as String,
      name: json['name'] as String,
      slug: json['slug'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'slug': slug,
    };
  }
}
