import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/app_header.dart';
import 'package:dres/core/widgets/custom_tab_bar.dart';
import 'package:dres/core/widgets/shop_promo_card.dart';
import 'package:dres/core/services/scroll_to_top_service.dart';
import 'package:dres/features/splash/logic/menu_bloc/menu_bloc.dart';
import 'package:dres/features/splash/logic/menu_bloc/menu_state.dart';
import 'package:dres/core/models/menu_model.dart';
import 'package:dres/l10n/app_localizations.dart';
import 'package:dres/routes.dart';
import 'dart:async';

class ShopScreen extends StatefulWidget {
  const ShopScreen({super.key});

  @override
  State<ShopScreen> createState() => _ShopScreenState();
}

class _ShopScreenState extends State<ShopScreen> {
  int _selectedTabIndex = 0;
  final ScrollController _scrollController = ScrollController();
  StreamSubscription<int>? _scrollSubscription;

  @override
  void initState() {
    super.initState();
    // Listen for scroll to top notifications (tab index 1 is Shop)
    _scrollSubscription = ScrollToTopService.instance.scrollToTopStream.listen((tabIndex) {
      if (tabIndex == 1 && _scrollController.hasClients) { // Tab index 1 = Shop
        debugPrint('📲 ShopScreen: Received scroll notification, has clients: ${_scrollController.hasClients}');
        debugPrint('📲 ShopScreen: Current offset: ${_scrollController.offset}');
        debugPrint('📲 ShopScreen: Scrolling to top via stream');
        _scrollController.animateTo(
          0,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      } else if (tabIndex == 1) {
        debugPrint('⚠️ ShopScreen: Received scroll notification but controller has no clients');
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
              onSearchTap: () {
                // TODO: Navigate to search/discover
              },
            ),

            // Content
            Expanded(
              child: BlocBuilder<MenuBloc, MenuState>(
                builder: (context, state) {
                  if (state.status == MenuStatus.loading) {
                    return const Center(
                      child: CircularProgressIndicator(),
                    );
                  }

                  if (state.status == MenuStatus.failure) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            AppLocalizations.of(context)!.failedToLoadMenu,
                            style: AppTypography.bodyL,
                          ),
                          const SizedBox(height: 8),
                          TextButton(
                            onPressed: () {
                              // Retry is handled by pull to refresh
                            },
                            child: Text(AppLocalizations.of(context)!.pullToRefresh),
                          ),
                        ],
                      ),
                    );
                  }

                  final menu = state.menu;
                  if (menu == null) {
                    return const SizedBox.shrink();
                  }

                  final departments = menu.departments;

                  return Column(
                    children: [
                      // Department Tabs
                      CustomTabBar(
                        tabs: departments.map((d) => d.name).toList(),
                        selectedIndex: _selectedTabIndex,
                        onTabSelected: (index) {
                          setState(() {
                            _selectedTabIndex = index;
                          });
                        },
                      ),

                      // Collections List
                      Expanded(
                        child: _buildCollectionsList(
                          departments[_selectedTabIndex],
                          departments[_selectedTabIndex].name,
                        ),
                      ),
                    ],
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCollectionsList(DepartmentModel department, String departmentName) {
    if (department.collections.isEmpty) {
      return Center(
        child: Text(
          AppLocalizations.of(context)!.noCollectionsAvailable,
          style: AppTypography.bodyL,
        ),
      );
    }

    // Get promo cards based on department
    final promoCards = _getPromoCardsForDepartment(department.name, department.id);

    return ListView.builder(
      key: ValueKey('collections_${department.name}'),
      controller: _scrollController,
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: department.collections.length + (promoCards.isNotEmpty ? 1 : 0),
      itemBuilder: (context, index) {
        // Show collections first
        if (index < department.collections.length) {
          final collection = department.collections[index];
          return _buildCollectionItem(collection, department);
        }
        
        // Show promo cards at the end
        return Padding(
          padding: const EdgeInsets.all(10),
          child: Column(
            children: promoCards.map((card) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: card,
              );
            }).toList(),
          ),
        );
      },
    );
  }

  List<Widget> _getPromoCardsForDepartment(String departmentName, String departmentId) {
    final name = departmentName.toLowerCase();
    final l10n = AppLocalizations.of(context)!;
    
    if (name == 'women') {
      return [
        ShopPromoCard(
          title: l10n.newArrivalsForYou,
          subtitle: l10n.dailyDropPersonalized,
          imageText: 'NEW',
          gradientColors: const [Color(0xFF121212), Color(0xFF939393)],
          onTap: () => _navigateToFilteredProducts(context, departmentId, departmentName, 'new-arrivals', l10n.newArrivalsForYou),
        ),
        ShopPromoCard(
          title: l10n.designers,
          subtitle: l10n.azOfBrands,
          imageText: '',
          imagePath: 'assets/images/desiners_women.png',
          gradientColors: const [Color(0xFF121212), Color(0xFF939393)],
          onTap: () => _navigateToFilteredProducts(context, departmentId, departmentName, 'designers', l10n.designers),
        ),
        ShopPromoCard(
          title: l10n.weLove,
          subtitle: l10n.styleTeamTopPicks,
          imageText: '',
          imagePath: 'assets/images/we_love_women.png',
          gradientColors: const [Color(0xFF121212), Color(0xFF939393)],
          onTap: () => _navigateToFilteredProducts(context, departmentId, departmentName, 'we-love', l10n.weLove),
        ),
        ShopPromoCard(
          title: l10n.onSale,
          subtitle: l10n.finestDeals,
          imageText: 'SALE',
          gradientColors: const [Color(0xFF121212), Color(0xFFC6CA77)],
          onTap: () => _navigateToFilteredProducts(context, departmentId, departmentName, 'on-sale', l10n.onSale),
        ),
      ];
    } else if (name == 'men') {
      return [
        ShopPromoCard(
          title: l10n.newArrivalsForYou,
          subtitle: l10n.dailyDropPersonalized,
          imageText: 'NEW',
          gradientColors: const [Color(0xFF121212), Color(0xFF939393)],
          onTap: () => _navigateToFilteredProducts(context, departmentId, departmentName, 'new-arrivals', l10n.newArrivalsForYou),
        ),
        ShopPromoCard(
          title: l10n.designers,
          subtitle: l10n.azOfBrands,
          imageText: '',
          imagePath: 'assets/images/designers_men.png',
          gradientColors: const [Color(0xFF121212), Color(0xFF939393)],
          onTap: () => _navigateToFilteredProducts(context, departmentId, departmentName, 'designers', l10n.designers),
        ),
        ShopPromoCard(
          title: l10n.weLove,
          subtitle: l10n.styleTeamTopPicks,
          imageText: '',
          imagePath: 'assets/images/we_love_men.png',
          gradientColors: const [Color(0xFF121212), Color(0xFF939393)],
          onTap: () => _navigateToFilteredProducts(context, departmentId, departmentName, 'we-love', l10n.weLove),
        ),
        ShopPromoCard(
          title: l10n.onSale,
          subtitle: l10n.finestDeals,
          imageText: 'SALE',
          gradientColors: const [Color(0xFF121212), Color(0xFF77B1CA)],
          onTap: () => _navigateToFilteredProducts(context, departmentId, departmentName, 'on-sale', l10n.onSale),
        ),
      ];
    } else if (name == 'kids') {
      return [
        ShopPromoCard(
          title: l10n.newArrivalsForYou,
          subtitle: l10n.dailyDropPersonalized,
          badgeImagePath: 'assets/images/arrival_kids.png',
          gradientColors: const [Color(0xFF121212), Color(0xFF939393)],
          onTap: () => _navigateToFilteredProducts(context, departmentId, departmentName, 'new-arrivals', l10n.newArrivalsForYou),
        ),
      ];
    }
    
    return [];
  }

  Widget _buildCollectionItem(CollectionModel collection, DepartmentModel department) {
    return Column(
      children: [
        InkWell(
          onTap: () {
            context.pushNamed(
              AppRoutes.categories,
              extra: {
                'collection': collection,
                'departmentName': department.name,
                'departmentId': department.id,
              },
            );
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  collection.name,
                  style: AppTypography.bodyL.copyWith(
                    fontSize: 18
                  ),
                ),
                Icon(
                  Icons.chevron_right,
                  color: AppColors.textSecondary,
                  size: 25,
                ),
              ],
            ),
          ),
        ),
        Divider(
          height: 1,
          thickness: 1,
          color: AppColors.border.withValues(alpha: 0.4),
          indent: 16,
          endIndent: 16,
        ),
      ],
    );
  }

  void _navigateToFilteredProducts(BuildContext context, String departmentId, String departmentName, String filterType, String title) {
    // For Designers, navigate to brands screen instead
    if (filterType == 'designers') {
      context.pushNamed(
        'brands',
        extra: {
          'departmentId': departmentId,
          'departmentName': departmentName,
        },
      );
      return;
    }

    // For other filters, navigate to products with filterType
    context.push(
      '/discover/categories/products',
      extra: {
        'departmentId': departmentId,
        'filterType': filterType,
        'title': title,
      },
    );
  }
}
