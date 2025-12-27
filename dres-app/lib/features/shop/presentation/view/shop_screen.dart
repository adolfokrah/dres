import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/app_header.dart';
import 'package:dres/core/widgets/custom_tab_bar.dart';
import 'package:dres/core/widgets/shop_promo_card.dart';
import 'package:dres/features/splash/logic/menu_bloc/menu_bloc.dart';
import 'package:dres/features/splash/logic/menu_bloc/menu_state.dart';
import 'package:dres/core/models/menu_model.dart';
import 'package:dres/l10n/app_localizations.dart';
import 'package:dres/routes.dart';

class ShopScreen extends StatefulWidget {
  const ShopScreen({super.key});

  @override
  State<ShopScreen> createState() => _ShopScreenState();
}

class _ShopScreenState extends State<ShopScreen> {
  int _selectedTabIndex = 0;
  
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
    final promoCards = _getPromoCardsForDepartment(department.name);

    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: department.collections.length + (promoCards.isNotEmpty ? 1 : 0),
      itemBuilder: (context, index) {
        // Show collections first
        if (index < department.collections.length) {
          final collection = department.collections[index];
          return _buildCollectionItem(collection, departmentName);
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

  List<Widget> _getPromoCardsForDepartment(String departmentName) {
    final name = departmentName.toLowerCase();
    final l10n = AppLocalizations.of(context)!;
    
    if (name == 'women') {
      return [
        ShopPromoCard(
          title: l10n.newArrivalsForYou,
          subtitle: l10n.dailyDropPersonalized,
          imageText: 'NEW',
          gradientColors: const [Color(0xFF121212), Color(0xFF939393)],
        ),
        ShopPromoCard(
          title: l10n.designers,
          subtitle: l10n.azOfBrands,
          imageText: '',
          imagePath: 'assets/images/desiners_women.png',
          gradientColors: const [Color(0xFF121212), Color(0xFF939393)],
        ),
        ShopPromoCard(
          title: l10n.weLove,
          subtitle: l10n.styleTeamTopPicks,
          imageText: '',
          imagePath: 'assets/images/we_love_women.png',
          gradientColors: const [Color(0xFF121212), Color(0xFF939393)],
        ),
        ShopPromoCard(
          title: l10n.onSale,
          subtitle: l10n.finestDeals,
          imageText: 'SALE',
          gradientColors: const [Color(0xFF121212), Color(0xFFC6CA77)],
        ),
      ];
    } else if (name == 'men') {
      return [
        ShopPromoCard(
          title: l10n.newArrivalsForYou,
          subtitle: l10n.dailyDropPersonalized,
          imageText: 'NEW',
          gradientColors: const [Color(0xFF121212), Color(0xFF939393)],
        ),
        ShopPromoCard(
          title: l10n.designers,
          subtitle: l10n.azOfBrands,
          imageText: '',
          imagePath: 'assets/images/designers_men.png',
          gradientColors: const [Color(0xFF121212), Color(0xFF939393)],
        ),
        ShopPromoCard(
          title: l10n.weLove,
          subtitle: l10n.styleTeamTopPicks,
          imageText: '',
          imagePath: 'assets/images/we_love_men.png',
          gradientColors: const [Color(0xFF121212), Color(0xFF939393)],
        ),
        ShopPromoCard(
          title: l10n.onSale,
          subtitle: l10n.finestDeals,
          imageText: 'SALE',
          gradientColors: const [Color(0xFF121212), Color(0xFF77B1CA)],
        ),
      ];
    } else if (name == 'kids') {
      return [
        ShopPromoCard(
          title: l10n.newArrivalsForYou,
          subtitle: l10n.dailyDropPersonalized,
          badgeImagePath: 'assets/images/arrival_kids.png',
          gradientColors: const [Color(0xFF121212), Color(0xFF939393)],
        ),
      ];
    }
    
    return [];
  }

  Widget _buildCollectionItem(CollectionModel collection, String departmentName) {
    return Column(
      children: [
        InkWell(
          onTap: () {
            context.pushNamed(
              AppRoutes.categories,
              extra: {
                'collection': collection,
                'departmentName': departmentName,
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
}
