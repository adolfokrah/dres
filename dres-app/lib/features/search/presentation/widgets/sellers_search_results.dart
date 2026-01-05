import 'package:flutter/material.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/user_list_item.dart';
import 'package:dres/features/search/data/models/search_models.dart';

class SellersSearchResults extends StatelessWidget {
  final List<SellerSearchResult> sellers;
  final bool isLoading;
  final bool hasQuery;

  const SellersSearchResults({
    super.key,
    required this.sellers,
    this.isLoading = false,
    this.hasQuery = false,
  });

  @override
  Widget build(BuildContext context) {
    if (!hasQuery) {
      return Center(
        child: Text(
          'Search for sellers',
          style: AppTypography.bodyL.copyWith(
            color: AppColors.textSecondary,
          ),
        ),
      );
    }

    if (isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (sellers.isEmpty) {
      return Center(
        child: Text(
          'No sellers found',
          style: AppTypography.bodyL.copyWith(
            color: AppColors.textSecondary,
          ),
        ),
      );
    }

    return ListView.builder(
      padding: EdgeInsets.zero,
      itemCount: sellers.length,
      itemBuilder: (context, index) {
        final seller = sellers[index];
        return UserListItem(
          id: seller.id,
          name: seller.name,
          username: seller.username,
          avatarUrl: seller.avatarUrl,
        );
      },
    );
  }
}
