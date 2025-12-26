import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/widgets/app_header.dart';
import 'package:dres/core/widgets/promo_banner.dart';
import 'package:dres/features/home/logic/bloc/home_bloc.dart';
import 'package:dres/features/home/logic/bloc/home_event.dart';
import 'package:dres/features/home/logic/bloc/home_state.dart';
import 'package:dres/core/models/block_model.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => getIt<HomeBloc>()..add(const FetchHomePage()),
      child: const _HomeScreenView(),
    );
  }
}

class _HomeScreenView extends StatelessWidget {
  const _HomeScreenView();

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
                      context.read<HomeBloc>().add(const RefreshHomePage());
                    },
                    child: SingleChildScrollView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      child: Column(
                        children: [
                          // Render blocks from CMS
                          ...page.layout.map((block) => _buildBlock(block)),
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

  Widget _buildBlock(BlockModel block) {
    switch (block.blockType) {
      case 'promoBanner':
        final promoBanner = block as PromoBannerBlockModel;
        return PromoBanner(
          title: promoBanner.title,
          description: promoBanner.description,
          actionText: promoBanner.actionText,
          onActionTap: () {
            // TODO: Handle action link navigation
          },
        );
      default:
        return const SizedBox.shrink();
    }
  }
}
