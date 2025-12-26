import 'package:dres/core/models/link_model.dart';

/// Base class for all blocks
abstract class BlockModel {
  final String? id;
  final String? blockName;
  final String blockType;

  BlockModel({
    this.id,
    this.blockName,
    required this.blockType,
  });

  factory BlockModel.fromJson(Map<String, dynamic> json) {
    final blockType = json['blockType'] as String?;

    switch (blockType) {
      case 'promoBanner':
        return PromoBannerBlockModel.fromJson(json);
      case 'cta':
        return CallToActionBlockModel.fromJson(json);
      case 'content':
        return ContentBlockModel.fromJson(json);
      case 'mediaBlock':
        return MediaBlockModel.fromJson(json);
      default:
        return UnknownBlockModel.fromJson(json);
    }
  }
}

/// Promo Banner Block
class PromoBannerBlockModel extends BlockModel {
  final String title;
  final String description;
  final String actionText;
  final LinkModel? actionLink;
  final String? backgroundColor;

  PromoBannerBlockModel({
    super.id,
    super.blockName,
    required this.title,
    required this.description,
    required this.actionText,
    this.actionLink,
    this.backgroundColor,
  }) : super(blockType: 'promoBanner');

  factory PromoBannerBlockModel.fromJson(Map<String, dynamic> json) {
    return PromoBannerBlockModel(
      id: json['id'] as String?,
      blockName: json['blockName'] as String?,
      title: json['title'] as String? ?? '',
      description: json['description'] as String? ?? '',
      actionText: json['actionText'] as String? ?? 'Get started',
      actionLink: json['actionLink'] != null
          ? LinkModel.fromJson(json['actionLink'] as Map<String, dynamic>)
          : null,
      backgroundColor: json['backgroundColor'] as String? ?? 'light',
    );
  }
}

/// Call to Action Block
class CallToActionBlockModel extends BlockModel {
  final Map<String, dynamic>? richText;
  final List<LinkModel> links;

  CallToActionBlockModel({
    super.id,
    super.blockName,
    this.richText,
    this.links = const [],
  }) : super(blockType: 'cta');

  factory CallToActionBlockModel.fromJson(Map<String, dynamic> json) {
    final linksJson = json['links'] as List<dynamic>? ?? [];
    return CallToActionBlockModel(
      id: json['id'] as String?,
      blockName: json['blockName'] as String?,
      richText: json['richText'] as Map<String, dynamic>?,
      links: linksJson
          .map((e) => LinkModel.fromJson(
              (e as Map<String, dynamic>)['link'] as Map<String, dynamic>))
          .toList(),
    );
  }
}

/// Content Block
class ContentBlockModel extends BlockModel {
  final List<ContentColumnModel> columns;

  ContentBlockModel({
    super.id,
    super.blockName,
    this.columns = const [],
  }) : super(blockType: 'content');

  factory ContentBlockModel.fromJson(Map<String, dynamic> json) {
    final columnsJson = json['columns'] as List<dynamic>? ?? [];
    return ContentBlockModel(
      id: json['id'] as String?,
      blockName: json['blockName'] as String?,
      columns: columnsJson
          .map((e) => ContentColumnModel.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

class ContentColumnModel {
  final String? size;
  final Map<String, dynamic>? richText;

  ContentColumnModel({
    this.size,
    this.richText,
  });

  factory ContentColumnModel.fromJson(Map<String, dynamic> json) {
    return ContentColumnModel(
      size: json['size'] as String?,
      richText: json['richText'] as Map<String, dynamic>?,
    );
  }
}

/// Media Block
class MediaBlockModel extends BlockModel {
  final MediaModel? media;

  MediaBlockModel({
    super.id,
    super.blockName,
    this.media,
  }) : super(blockType: 'mediaBlock');

  factory MediaBlockModel.fromJson(Map<String, dynamic> json) {
    return MediaBlockModel(
      id: json['id'] as String?,
      blockName: json['blockName'] as String?,
      media: json['media'] != null
          ? MediaModel.fromJson(json['media'] is String
              ? {'id': json['media']}
              : json['media'] as Map<String, dynamic>)
          : null,
    );
  }
}

/// Media model
class MediaModel {
  final String id;
  final String? url;
  final String? alt;
  final String? filename;
  final String? mimeType;
  final int? width;
  final int? height;

  MediaModel({
    required this.id,
    this.url,
    this.alt,
    this.filename,
    this.mimeType,
    this.width,
    this.height,
  });

  factory MediaModel.fromJson(Map<String, dynamic> json) {
    return MediaModel(
      id: json['id'] as String? ?? '',
      url: json['url'] as String?,
      alt: json['alt'] as String?,
      filename: json['filename'] as String?,
      mimeType: json['mimeType'] as String?,
      width: json['width'] as int?,
      height: json['height'] as int?,
    );
  }
}

/// Unknown Block (fallback)
class UnknownBlockModel extends BlockModel {
  final Map<String, dynamic> data;

  UnknownBlockModel({
    super.id,
    super.blockName,
    required String blockType,
    required this.data,
  }) : super(blockType: blockType);

  factory UnknownBlockModel.fromJson(Map<String, dynamic> json) {
    return UnknownBlockModel(
      id: json['id'] as String?,
      blockName: json['blockName'] as String?,
      blockType: json['blockType'] as String? ?? 'unknown',
      data: json,
    );
  }
}
