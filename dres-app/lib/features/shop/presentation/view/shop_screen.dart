import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/app_header.dart';
import 'package:dres/core/widgets/custom_tab_bar.dart';
import 'package:dres/features/splash/logic/menu_bloc/menu_bloc.dart';
import 'package:dres/features/splash/logic/menu_bloc/menu_state.dart';
import 'package:dres/core/models/menu_model.dart';

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
                            'Failed to load menu',
                            style: AppTypography.bodyL,
                          ),
                          const SizedBox(height: 8),
                          TextButton(
                            onPressed: () {
                              // Retry is handled by pull to refresh
                            },
                            child: const Text('Pull to refresh'),
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
                        child: _buildCollectionsList(departments[_selectedTabIndex]),
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

  Widget _buildCollectionsList(DepartmentModel department) {
    if (department.collections.isEmpty) {
      return Center(
        child: Text(
          'No collections available',
          style: AppTypography.bodyL,
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: department.collections.length,
      itemBuilder: (context, index) {
        final collection = department.collections[index];
        return _buildCollectionItem(collection);
      },
    );
  }

  Widget _buildCollectionItem(CollectionModel collection) {
    return InkWell(
      onTap: () {
        // TODO: Navigate to collection detail page
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              collection.name,
              style: AppTypography.bodyL,
            ),
            Icon(
              Icons.chevron_right,
              color: AppColors.textSecondary,
              size: 20,
            ),
          ],
        ),
      ),
    );
  }
}
