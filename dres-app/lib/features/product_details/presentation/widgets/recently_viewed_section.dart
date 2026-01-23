import 'package:dres/features/auth/logic/auth_bloc/auth_bloc.dart';
import 'package:flutter/material.dart';
import 'package:dres/core/widgets/product_archive_block.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/core/services/storage_service.dart';
import 'package:dres/l10n/app_localizations.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class RecentlyViewedSection extends StatelessWidget {
  /// The current variation ID to exclude from the list
  final String? excludeVariationId;

  const RecentlyViewedSection({super.key, this.excludeVariationId});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final storageService = getIt<StorageService>();
    final department = storageService.getUserDepartment() ?? 'men';

    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, state) {
        // Only show recently viewed if user is logged in
        if (state.status != AuthStatus.authenticated) {
          return const SizedBox.shrink();
        }

        return ProductArchiveBlock(
          title: l10n.recentlyViewed,
          queryType: QueryType.recentlyViewed,
          department: department,
          limit: 20,
          showSeeAll: false,
          excludeVariationId: excludeVariationId,
        );
      },
    );
  }
}
