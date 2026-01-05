import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/features/search/data/repositories/search_repository.dart';
import 'package:dres/features/search/logic/search_bloc/search_bloc.dart';
import 'package:dres/features/search/logic/search_bloc/search_event.dart';
import 'package:dres/features/search/logic/search_bloc/search_state.dart';
import 'package:dres/features/search/presentation/widgets/items_search_results.dart';
import 'package:dres/features/search/presentation/widgets/sellers_search_results.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _searchController = TextEditingController();
  final _focusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    // Auto-focus the search field
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _focusNode.requestFocus();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => SearchBloc(getIt<SearchRepository>()),
      child: Scaffold(
        backgroundColor: AppColors.background,
        body: SafeArea(
          child: Column(
            children: [
              _buildHeader(),
              _buildTabBar(),
              Expanded(child: _buildContent()),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      child: Row(
        children: [
          Expanded(
            child: BlocBuilder<SearchBloc, SearchState>(
              builder: (context, state) {
                return Container(
                  height: 44,
                  decoration: BoxDecoration(
                    color: AppColors.secondary,
                    borderRadius: BorderRadius.circular(22),
                  ),
                  child: TextField(
                    controller: _searchController,
                    focusNode: _focusNode,
                    onChanged: (value) {
                      context.read<SearchBloc>().add(SearchQueryChanged(value));
                    },
                    style: AppTypography.bodyM.copyWith(
                      color: AppColors.textPrimary,
                    ),
                    decoration: InputDecoration(
                      hintText: 'Search for items, members...',
                      hintStyle: AppTypography.bodyM.copyWith(
                        color: AppColors.textHint,
                      ),
                      prefixIcon: Padding(
                        padding: const EdgeInsets.only(left: 16, right: 8),
                        child: Icon(
                          PhosphorIcons.magnifyingGlass(),
                          size: 20,
                          color: AppColors.textHint,
                        ),
                      ),
                      prefixIconConstraints: const BoxConstraints(
                        minWidth: 44,
                        minHeight: 44,
                      ),
                      suffixIcon: state.hasQuery
                          ? GestureDetector(
                              onTap: () {
                                _searchController.clear();
                                context
                                    .read<SearchBloc>()
                                    .add(const SearchQueryCleared());
                              },
                              child: Padding(
                                padding: const EdgeInsets.only(right: 12),
                                child: Icon(
                                  PhosphorIcons.xCircle(PhosphorIconsStyle.fill),
                                  size: 20,
                                  color: AppColors.textHint,
                                ),
                              ),
                            )
                          : null,
                      suffixIconConstraints: const BoxConstraints(
                        minWidth: 32,
                        minHeight: 44,
                      ),
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(width: 12),
          GestureDetector(
            onTap: () => context.pop(),
            child: Text(
              'Close',
              style: AppTypography.bodyL.copyWith(
                color: AppColors.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabBar() {
    return BlocBuilder<SearchBloc, SearchState>(
      buildWhen: (previous, current) => previous.currentTab != current.currentTab,
      builder: (context, state) {
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 8),
          child: Container(
            height: 40,
            decoration: BoxDecoration(
              color: AppColors.secondary,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              children: [
                Expanded(
                  child: _buildTabButton(
                    context,
                    'Items',
                    0,
                    state.currentTab == 0,
                  ),
                ),
                Expanded(
                  child: _buildTabButton(
                    context,
                    'Sellers',
                    1,
                    state.currentTab == 1,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildTabButton(
    BuildContext context,
    String label,
    int index,
    bool isSelected,
  ) {
    return GestureDetector(
      onTap: () {
        context.read<SearchBloc>().add(SearchTabChanged(index));
      },
      child: Container(
        margin: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.background : Colors.transparent,
          borderRadius: BorderRadius.circular(16),
          border: isSelected
              ? Border.all(color: AppColors.border, width: 1)
              : null,
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: AppTypography.bodyM.copyWith(
            color: isSelected ? AppColors.textPrimary : AppColors.textSecondary,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
          ),
        ),
      ),
    );
  }

  Widget _buildContent() {
    return BlocBuilder<SearchBloc, SearchState>(
      builder: (context, state) {
        if (state.isItemsTab) {
          if (state.hasQuery) {
            return ItemsSearchResults(
              query: state.query,
              items: state.itemResults,
              brands: state.brandResults,
              isLoading: state.status == SearchStatus.loading,
            );
          } else {
            return _buildEmptyState('Search for brands, categories, styles...');
          }
        } else {
          if (state.hasQuery) {
            return SellersSearchResults(
              sellers: state.sellerResults,
              isLoading: state.status == SearchStatus.loading,
              hasQuery: state.hasQuery,
            );
          } else {
            return _buildEmptyState('Search for sellers...');
          }
        }
      },
    );
  }

  Widget _buildEmptyState(String message) {
    return Center(
      child: Text(
        message,
        style: AppTypography.bodyL.copyWith(
          color: AppColors.textSecondary,
        ),
      ),
    );
  }
}
