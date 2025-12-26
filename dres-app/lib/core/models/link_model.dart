/// Link model for CMS links
class LinkModel {
  final String? type;
  final bool? newTab;
  final String? url;
  final String label;
  final String? appearance;
  final ReferenceModel? reference;

  LinkModel({
    this.type,
    this.newTab,
    this.url,
    required this.label,
    this.appearance,
    this.reference,
  });

  factory LinkModel.fromJson(Map<String, dynamic> json) {
    return LinkModel(
      type: json['type'] as String?,
      newTab: json['newTab'] as bool?,
      url: json['url'] as String?,
      label: json['label'] as String? ?? '',
      appearance: json['appearance'] as String?,
      reference: json['reference'] != null
          ? ReferenceModel.fromJson(json['reference'] as Map<String, dynamic>)
          : null,
    );
  }

  String get resolvedUrl {
    if (type == 'custom' && url != null) {
      return url!;
    }
    if (type == 'reference' && reference != null) {
      return '/${reference!.relationTo}/${reference!.valueSlug ?? reference!.valueId}';
    }
    return '';
  }
}

/// Reference model for linked documents
class ReferenceModel {
  final String relationTo;
  final String? valueId;
  final String? valueSlug;

  ReferenceModel({
    required this.relationTo,
    this.valueId,
    this.valueSlug,
  });

  factory ReferenceModel.fromJson(Map<String, dynamic> json) {
    final value = json['value'];
    String? valueId;
    String? valueSlug;

    if (value is String) {
      valueId = value;
    } else if (value is Map<String, dynamic>) {
      valueId = value['id'] as String?;
      valueSlug = value['slug'] as String?;
    }

    return ReferenceModel(
      relationTo: json['relationTo'] as String? ?? '',
      valueId: valueId,
      valueSlug: valueSlug,
    );
  }
}
