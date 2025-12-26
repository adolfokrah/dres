import 'package:dres/core/models/block_model.dart';
import 'package:dres/core/models/link_model.dart';

/// Hero model for pages
class HeroModel {
  final String type;
  final Map<String, dynamic>? richText;
  final List<HeroLinkModel> links;
  final MediaModel? media;

  HeroModel({
    required this.type,
    this.richText,
    this.links = const [],
    this.media,
  });

  factory HeroModel.fromJson(Map<String, dynamic> json) {
    final linksJson = json['links'] as List<dynamic>? ?? [];
    return HeroModel(
      type: json['type'] as String? ?? 'none',
      richText: json['richText'] as Map<String, dynamic>?,
      links: linksJson
          .map((e) => HeroLinkModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      media: json['media'] != null
          ? MediaModel.fromJson(json['media'] is String
              ? {'id': json['media']}
              : json['media'] as Map<String, dynamic>)
          : null,
    );
  }
}

class HeroLinkModel {
  final LinkModel link;
  final String? id;

  HeroLinkModel({
    required this.link,
    this.id,
  });

  factory HeroLinkModel.fromJson(Map<String, dynamic> json) {
    return HeroLinkModel(
      link: LinkModel.fromJson(json['link'] as Map<String, dynamic>),
      id: json['id'] as String?,
    );
  }
}

/// Page model
class PageModel {
  final String id;
  final String title;
  final String slug;
  final HeroModel hero;
  final List<BlockModel> layout;
  final PageMetaModel? meta;
  final String? publishedAt;
  final String? status;
  final String updatedAt;
  final String createdAt;

  PageModel({
    required this.id,
    required this.title,
    required this.slug,
    required this.hero,
    this.layout = const [],
    this.meta,
    this.publishedAt,
    this.status,
    required this.updatedAt,
    required this.createdAt,
  });

  factory PageModel.fromJson(Map<String, dynamic> json) {
    final layoutJson = json['layout'] as List<dynamic>? ?? [];
    return PageModel(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      slug: json['slug'] as String? ?? '',
      hero: HeroModel.fromJson(json['hero'] as Map<String, dynamic>? ?? {}),
      layout: layoutJson
          .map((e) => BlockModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      meta: json['meta'] != null
          ? PageMetaModel.fromJson(json['meta'] as Map<String, dynamic>)
          : null,
      publishedAt: json['publishedAt'] as String?,
      status: json['_status'] as String?,
      updatedAt: json['updatedAt'] as String? ?? '',
      createdAt: json['createdAt'] as String? ?? '',
    );
  }

  /// Get blocks of a specific type
  List<T> getBlocksOfType<T extends BlockModel>() {
    return layout.whereType<T>().toList();
  }

  /// Get first promo banner block
  PromoBannerBlockModel? get promoBanner {
    final blocks = getBlocksOfType<PromoBannerBlockModel>();
    return blocks.isNotEmpty ? blocks.first : null;
  }
}

/// Page meta model
class PageMetaModel {
  final String? title;
  final String? description;
  final MediaModel? image;

  PageMetaModel({
    this.title,
    this.description,
    this.image,
  });

  factory PageMetaModel.fromJson(Map<String, dynamic> json) {
    return PageMetaModel(
      title: json['title'] as String?,
      description: json['description'] as String?,
      image: json['image'] != null
          ? MediaModel.fromJson(json['image'] is String
              ? {'id': json['image']}
              : json['image'] as Map<String, dynamic>)
          : null,
    );
  }
}
