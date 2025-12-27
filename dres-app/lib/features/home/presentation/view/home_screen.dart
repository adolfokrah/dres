import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/widgets/app_header.dart';
import 'package:dres/core/widgets/promo_banner.dart';
import 'package:dres/core/widgets/featured_grid.dart';
import 'package:dres/core/widgets/product_archive_block.dart';
import 'package:dres/core/widgets/call_to_action_block.dart';
import 'package:dres/core/widgets/main_shell.dart';
import 'package:dres/core/services/scroll_to_top_service.dart';
import 'package:dres/features/home/logic/bloc/home_bloc.dart';
import 'package:dres/features/home/logic/bloc/home_event.dart';
import 'package:dres/features/home/logic/bloc/home_state.dart';
import 'package:dres/core/models/block_model.dart';
import 'package:dres/core/services/storage_service.dart';
import 'dart:async';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final ScrollController _scrollController = ScrollController();
  StreamSubscription<int>? _scrollSubscription;

  @override
  void initState() {
    super.initState();
    // Listen for scroll to top notifications (tab index 0 is Home)
    _scrollSubscription = ScrollToTopService.instance.scrollToTopStream.listen((tabIndex) {
      if (tabIndex == 0) { // Home tab
        debugPrint('📲 HomeScreen: Received scroll notification');
        if (_scrollController.hasClients) {
          debugPrint('📲 HomeScreen: Scrolling to top');
          _scrollController.animateTo(
            0,
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeOut,
          );
        } else {
          debugPrint('⚠️ HomeScreen: ScrollController has no clients');
        }
      }
    });
  }

  @override
  void dispose() {
    _scrollSubscription?.cancel();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return _HomeScreenView(scrollController: _scrollController);
  }
}

class _HomeScreenView extends StatefulWidget {
  final ScrollController scrollController;

  const _HomeScreenView({required this.scrollController});

  @override
  State<_HomeScreenView> createState() => _HomeScreenViewState();
}

class _HomeScreenViewState extends State<_HomeScreenView> {

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            // Header
            AppHeader(
              onNotificationTap: () {
                // TODO: Navigate to notifications
              },
              onCartTap: () {
                // TODO: Navigate to cart
              },
              onSearchTap: () {
                // TODO: Navigate to search/discover
              },
            ),

            // Content
            Expanded(
              child: BlocBuilder<HomeBloc, HomeState>(
                builder: (context, state) {
                  if (state.status == HomeStatus.loading) {
                    return const Center(
                      child: CircularProgressIndicator(),
                    );
                  }

                  if (state.status == HomeStatus.failure) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'Failed to load',
                            style: TextStyle(color: AppColors.textPrimary),
                          ),
                          const SizedBox(height: 8),
                          TextButton(
                            onPressed: () {
                              context
                                  .read<HomeBloc>()
                                  .add(const RefreshHomePage());
                            },
                            child: const Text('Retry'),
                          ),
                        ],
                      ),
                    );
                  }

                  final page = state.page;
                  if (page == null) {
                    return const SizedBox.shrink();
                  }

                  return RefreshIndicator(
                    onRefresh: () async {
                      final storageService = getIt<StorageService>();
                      final department = storageService.getUserDepartment() ?? 'men';
                      final pageSlug = department == 'women' ? 'home-women' : 'home';
                      context.read<HomeBloc>().add(RefreshHomePage(slug: pageSlug));
                    },
                    child: SingleChildScrollView(
                      controller: widget.scrollController,
                      physics: const AlwaysScrollableScrollPhysics(),
                      child: Column(
                        children: [
                          // Render blocks from CMS
                          ...page.layout.map((block) => _buildBlock(context, block)),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBlock(BuildContext context, BlockModel block) {
    switch (block.blockType) {
      case 'promoBanner':
        final promoBanner = block as PromoBannerBlockModel;
        return PromoBanner(
          title: promoBanner.title,
          description: promoBanner.description,
          actionText: promoBanner.actionText,
          backgroundColor: promoBanner.backgroundColor ?? 'light',
          onActionTap: () {
            // TODO: Handle action link navigation
          },
        );
      case 'featuredGrid':
        final featuredGrid = block as FeaturedGridBlockModel;
        return FeaturedGrid(
          title: featuredGrid.title,
          items: featuredGrid.items,
          columns: int.tryParse(featuredGrid.columns ?? '3') ?? 3,
          aspectRatio: _getAspectRatio(featuredGrid.aspectRatio),
          onItemTap: (item) {
            // TODO: Handle item tap navigation
          },
        );
      case 'productArchive':
        final productArchive = block as ProductArchiveBlockModel;
        return ProductArchiveBlock(
          title: productArchive.title,
          queryType: _getQueryType(productArchive.queryType),
          seeAllLink: productArchive.seeAllLink,
          seeAllText: productArchive.seeAllText ?? 'See all',
          department: productArchive.department,
          limit: productArchive.limit ?? 8,
        );
      case 'cta':
        final cta = block as CallToActionBlockModel;
        return CallToActionBlock(
          imageUrl: cta.imageUrl,
          title: cta.title,
          buttonText: cta.buttonText,
          buttonLink: cta.buttonLink,
          onDepartmentChanged: () {
            // Reload home page with the new department's page slug
            final storageService = getIt<StorageService>();
            final department = storageService.getUserDepartment() ?? 'men';
            final pageSlug = department == 'women' ? 'home-women' : 'home';
            context.read<HomeBloc>().add(RefreshHomePage(slug: pageSlug));
          },
        );
      default:
        return const SizedBox.shrink();
    }
  }

  double _getAspectRatio(String? ratio) {
    switch (ratio) {
      case 'portrait':
        return 3 / 4;
      case 'landscape':
        return 4 / 3;
      case 'square':
      default:
        return 1.0;
    }
  }

  QueryType _getQueryType(String type) {
    switch (type) {
      case 'new-arrivals':
        return QueryType.newArrivals;
      case 'recently-viewed':
        return QueryType.recentlyViewed;
      case 'featured':
        return QueryType.featured;
      case 'trending':
      default:
        return QueryType.trending;
    }
  }
}
