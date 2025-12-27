class MenuModel {
  final List<DepartmentModel> departments;

  MenuModel({required this.departments});

  factory MenuModel.fromJson(Map<String, dynamic> json) {
    return MenuModel(
      departments: (json['menu'] as List?)
          ?.map((d) => DepartmentModel.fromJson(d))
          .toList() ?? [],
    );
  }
}

class DepartmentModel {
  final String id;
  final String name;
  final String slug;
  final List<CollectionModel> collections;

  DepartmentModel({
    required this.id,
    required this.name,
    required this.slug,
    required this.collections,
  });

  factory DepartmentModel.fromJson(Map<String, dynamic> json) {
    return DepartmentModel(
      id: json['id'] as String,
      name: json['name'] as String,
      slug: json['slug'] as String? ?? '', // slug is optional
      collections: (json['collections'] as List?)
          ?.map((c) => CollectionModel.fromJson(c))
          .toList() ?? [],
    );
  }
}

class CollectionModel {
  final String id;
  final String name;
  final String slug;
  final List<CategoryModel> categories;

  CollectionModel({
    required this.id,
    required this.name,
    required this.slug,
    required this.categories,
  });

  factory CollectionModel.fromJson(Map<String, dynamic> json) {
    return CollectionModel(
      id: json['id'] as String,
      name: json['name'] as String,
      slug: json['slug'] as String? ?? '', // slug is optional
      categories: (json['categories'] as List?)
          ?.map((c) => CategoryModel.fromJson(c))
          .toList() ?? [],
    );
  }
}

class CategoryModel {
  final String id;
  final String name;
  final String slug;

  CategoryModel({
    required this.id,
    required this.name,
    required this.slug,
  });

  factory CategoryModel.fromJson(Map<String, dynamic> json) {
    return CategoryModel(
      id: json['id'] as String,
      name: json['name'] as String,
      slug: json['slug'] as String? ?? '', // slug is optional
    );
  }
}
