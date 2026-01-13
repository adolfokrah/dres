import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/features/saved_searches/data/models/saved_search_models.dart';
import 'package:dres/features/saved_searches/logic/saved_searches_bloc/saved_searches_bloc.dart';
import 'package:dres/features/saved_searches/presentation/widgets/saved_search_card.dart';

class SavedSearchesScreen extends StatelessWidget {
  const SavedSearchesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: getIt<SavedSearchesBloc>(),
      child: const _SavedSearchesView(),
    );
  }
}

class _SavedSearchesView extends StatefulWidget {
  const _SavedSearchesView();

  @override
  State<_SavedSearchesView> createState() => _SavedSearchesViewState();
}

class _SavedSearchesViewState extends State<_SavedSearchesView> {
  @override
  void initState() {
    super.initState();
    context.read<SavedSearchesBloc>().add(const SavedSearchesFetchRequested());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          'SAVED SEARCHES',
          style: AppTypography.bodyL.copyWith(
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
      ),
      body: BlocBuilder<SavedSearchesBloc, SavedSearchesState>(
        builder: (context, state) {
          if (state.status == SavedSearchesStatus.loading) {
            return Center(
              child: CircularProgressIndicator(
                color: AppColors.textPrimary,
              ),
            );
          }

          if (state.status == SavedSearchesStatus.failure) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      PhosphorIcons.warning(),
                      size: 48,
                      color: AppColors.textHint,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Failed to load saved searches',
                      style: AppTypography.bodyM.copyWith(
                        color: AppColors.textSecondary,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    if (state.errorMessage != null) ...[
                      const SizedBox(height: 8),
                      Text(
                        state.errorMessage!,
                        style: AppTypography.bodyS.copyWith(
                          color: AppColors.textHint,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                    const SizedBox(height: 16),
                    TextButton(
                      onPressed: () {
                        context.read<SavedSearchesBloc>().add(const SavedSearchesFetchRequested());
                      },
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              ),
            );
          }

          if (state.searches.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    PhosphorIcons.bookmarkSimple(),
                    size: 64,
                    color: AppColors.textHint,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No saved searches yet',
                    style: AppTypography.bodyL.copyWith(
                      color: AppColors.textSecondary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 40),
                    child: Text(
                      'Save your searches to get notified when new items match your criteria',
                      style: AppTypography.bodyM.copyWith(
                        color: AppColors.textHint,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async {
              context.read<SavedSearchesBloc>().add(const SavedSearchesRefreshRequested());
            },
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: state.searches.length,
              itemBuilder: (context, index) {
                final search = state.searches[index];
                return SavedSearchCard(
                  savedSearch: search,
                  onDelete: () {
                    _showDeleteConfirmation(context, search.id);
                  },
                  onToggleActive: (isActive) {
                    context.read<SavedSearchesBloc>().add(
                      SavedSearchActiveToggled(
                        searchId: search.id,
                        isActive: isActive,
                      ),
                    );
                  },
                  onTap: () {
                    _navigateToProducts(context, search);
                  },
                );
              },
            ),
          );
        },
      ),
    );
  }

  void _showDeleteConfirmation(BuildContext context, String searchId) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(
          'Delete Saved Search',
          style: AppTypography.titleL.copyWith(
            color: AppColors.textPrimary,
          ),
        ),
        content: Text(
          'Are you sure you want to delete this saved search?',
          style: AppTypography.bodyM.copyWith(
            color: AppColors.textSecondary,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: Text(
              'Cancel',
              style: AppTypography.bodyM.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(dialogContext).pop();
              context.read<SavedSearchesBloc>().add(
                SavedSearchDeleteRequested(searchId),
              );
            },
            child: Text(
              'Delete',
              style: AppTypography.bodyM.copyWith(
                color: AppColors.error,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _navigateToProducts(BuildContext context, SavedSearchModel search) {
    final searchData = search.searchData;
    final queryParams = <String, String>{};

    // Map search data to query parameters
    if (searchData['query'] != null) {
      queryParams['query'] = searchData['query'].toString();
    }
    if (searchData['departmentId'] != null) {
      queryParams['departmentId'] = searchData['departmentId'].toString();
    }
    if (searchData['categoryId'] != null) {
      queryParams['categoryId'] = searchData['categoryId'].toString();
    }
    if (searchData['collectionId'] != null) {
      queryParams['collectionId'] = searchData['collectionId'].toString();
    }
    if (searchData['styleId'] != null) {
      queryParams['styleId'] = searchData['styleId'].toString();
    }
    if (searchData['brandId'] != null) {
      queryParams['brandId'] = searchData['brandId'].toString();
    }
    if (searchData['filterType'] != null) {
      queryParams['filterType'] = searchData['filterType'].toString();
    }

    // Use the saved search name as the title, or a default
    queryParams['title'] = search.name ?? 'Saved Search';

    // Build the URI with query parameters
    final uri = Uri(path: '/products', queryParameters: queryParams);
    context.push(uri.toString());
  }
}