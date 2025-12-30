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
      case 'featuredGrid':
        return FeaturedGridBlockModel.fromJson(json);
      case 'productArchive':
        return ProductArchiveBlockModel.fromJson(json);
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
  final String? imageUrl;
  final String title;
  final String buttonText;
  final String buttonLink;

  CallToActionBlockModel({
    super.id,
    super.blockName,
    this.imageUrl,
    required this.title,
    required this.buttonText,
    required this.buttonLink,
  }) : super(blockType: 'cta');

  factory CallToActionBlockModel.fromJson(Map<String, dynamic> json) {
    // Extract image URL
    String? imageUrl;
    final image = json['image'];
    if (image != null && image is Map<String, dynamic>) {
      imageUrl = image['url'] as String?;
    }

    return CallToActionBlockModel(
      id: json['id'] as String?,
      blockName: json['blockName'] as String?,
      imageUrl: imageUrl,
      title: json['title'] as String? ?? '',
      buttonText: json['buttonText'] as String? ?? 'Learn More',
      buttonLink: json['buttonLink'] as String? ?? '',
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
  final String? thumbnailUrl;
  final String? alt;
  final String? filename;
  final String? mimeType;
  final int? width;
  final int? height;
  final MediaSizesModel? sizes;

  MediaModel({
    required this.id,
    this.url,
    this.thumbnailUrl,
    this.alt,
    this.filename,
    this.mimeType,
    this.width,
    this.height,
    this.sizes,
  });

  factory MediaModel.fromJson(Map<String, dynamic> json) {
    return MediaModel(
      id: json['id'] as String? ?? '',
      url: json['url'] as String?,
      thumbnailUrl: json['thumbnailURL'] as String?,
      alt: json['alt'] as String?,
      filename: json['filename'] as String?,
      mimeType: json['mimeType'] as String?,
      width: json['width'] as int?,
      height: json['height'] as int?,
      sizes: json['sizes'] != null
          ? MediaSizesModel.fromJson(json['sizes'] as Map<String, dynamic>)
          : null,
    );
  }

  /// Get the best URL for a given size preference
  String? getUrl({String size = 'medium'}) {
    if (sizes != null) {
      switch (size) {
        case 'thumbnail':
          return sizes!.thumbnail?.url ?? url;
        case 'square':
          return sizes!.square?.url ?? url;
        case 'small':
          return sizes!.small?.url ?? url;
        case 'medium':
          return sizes!.medium?.url ?? url;
        case 'large':
          return sizes!.large?.url ?? url;
        default:
          return url;
      }
    }
    return url;
  }
}

/// Media sizes model
class MediaSizesModel {
  final MediaSizeModel? thumbnail;
  final MediaSizeModel? square;
  final MediaSizeModel? small;
  final MediaSizeModel? medium;
  final MediaSizeModel? large;
  final MediaSizeModel? xlarge;

  MediaSizesModel({
    this.thumbnail,
    this.square,
    this.small,
    this.medium,
    this.large,
    this.xlarge,
  });

  factory MediaSizesModel.fromJson(Map<String, dynamic> json) {
    return MediaSizesModel(
      thumbnail: json['thumbnail'] != null
          ? MediaSizeModel.fromJson(json['thumbnail'] as Map<String, dynamic>)
          : null,
      square: json['square'] != null
          ? MediaSizeModel.fromJson(json['square'] as Map<String, dynamic>)
          : null,
      small: json['small'] != null
          ? MediaSizeModel.fromJson(json['small'] as Map<String, dynamic>)
          : null,
      medium: json['medium'] != null
          ? MediaSizeModel.fromJson(json['medium'] as Map<String, dynamic>)
          : null,
      large: json['large'] != null
          ? MediaSizeModel.fromJson(json['large'] as Map<String, dynamic>)
          : null,
      xlarge: json['xlarge'] != null
          ? MediaSizeModel.fromJson(json['xlarge'] as Map<String, dynamic>)
          : null,
    );
  }
}

/// Single media size
class MediaSizeModel {
  final int? width;
  final int? height;
  final String? url;
  final String? filename;

  MediaSizeModel({
    this.width,
    this.height,
    this.url,
    this.filename,
  });

  factory MediaSizeModel.fromJson(Map<String, dynamic> json) {
    return MediaSizeModel(
      width: json['width'] as int?,
      height: json['height'] as int?,
      url: json['url'] as String?,
      filename: json['filename'] as String?,
    );
  }
}

/// Featured Grid Block
class FeaturedGridBlockModel extends BlockModel {
  final String title;
  final List<FeaturedGridItemModel> items;
  final String? columns;
  final String? aspectRatio;

  FeaturedGridBlockModel({
    super.id,
    super.blockName,
    required this.title,
    this.items = const [],
    this.columns,
    this.aspectRatio,
  }) : super(blockType: 'featuredGrid');

  factory FeaturedGridBlockModel.fromJson(Map<String, dynamic> json) {
    final itemsJson = json['items'] as List<dynamic>? ?? [];
    return FeaturedGridBlockModel(
      id: json['id'] as String?,
      blockName: json['blockName'] as String?,
      title: json['title'] as String? ?? '',
      items: itemsJson
          .map((e) => FeaturedGridItemModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      columns: json['columns'] as String? ?? '3',
      aspectRatio: json['aspectRatio'] as String? ?? 'square',
    );
  }
}

/// Featured Grid Item
class FeaturedGridItemModel {
  final MediaModel? image;
  final String label;
  final String? link;

  FeaturedGridItemModel({
    this.image,
    required this.label,
    this.link,
  });

  factory FeaturedGridItemModel.fromJson(Map<String, dynamic> json) {
    return FeaturedGridItemModel(
      image: json['image'] != null
          ? MediaModel.fromJson(json['image'] is String
              ? {'id': json['image']}
              : json['image'] as Map<String, dynamic>)
          : null,
      label: json['label'] as String? ?? '',
      link: json['link'] as String?,
    );
  }
}

/// Unknown Block (fallback)
class UnknownBlockModel extends BlockModel {
  final Map<String, dynamic> data;

  UnknownBlockModel({
    super.id,
    super.blockName,
    required super.blockType,
    required this.data,
  });

  factory UnknownBlockModel.fromJson(Map<String, dynamic> json) {
    return UnknownBlockModel(
      id: json['id'] as String?,
      blockName: json['blockName'] as String?,
      blockType: json['blockType'] as String? ?? 'unknown',
      data: json,
    );
  }
}

/// Product Archive Block
class ProductArchiveBlockModel extends BlockModel {
  final String title;
  final String queryType;
  final String? seeAllLink;
  final String? seeAllText;
  final String? department;
  final int? limit;

  ProductArchiveBlockModel({
    super.id,
    super.blockName,
    required this.title,
    required this.queryType,
    this.seeAllLink,
    this.seeAllText,
    this.department,
    this.limit,
  }) : super(blockType: 'productArchive');

  factory ProductArchiveBlockModel.fromJson(Map<String, dynamic> json) {
    return ProductArchiveBlockModel(
      id: json['id'] as String?,
      blockName: json['blockName'] as String?,
      title: json['title'] as String? ?? 'Products',
      queryType: json['queryType'] as String? ?? 'trending',
      seeAllLink: json['seeAllLink'] as String?,
      seeAllText: json['seeAllText'] as String?,
      department: json['department'] as String?,
      limit: json['limit'] as int?,
    );
  }
}
