import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/widgets/unified_header.dart';
import 'package:dres/features/sell/logic/sell_bloc/sell_bloc.dart';
import 'package:dres/features/sell/presentation/widgets/draft_style_item.dart';

class SellScreen extends StatefulWidget {
  const SellScreen({super.key});

  @override
  State<SellScreen> createState() => _SellScreenState();
}

class _SellScreenState extends State<SellScreen> {
  @override
  void initState() {
    super.initState();
    // Fetch drafts when screen loads
    getIt<SellBloc>().add(const SellFetchDraftsRequested());
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: getIt<SellBloc>(),
      child: Scaffold(
        backgroundColor: AppColors.background,
        body: SafeArea(
          child: Column(
            children: [
              // Header
              const UnifiedHeader.titleWithBell(title: 'Sell an item'),
              // Content
              Expanded(
                child: BlocBuilder<SellBloc, SellState>(
                  builder: (context, state) {
                    return _buildContent(state);
                  },
                ),
              ),
              // Bottom section with button
              _buildBottomSection(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildContent(SellState state) {
    if (state.status == SellStatus.loading) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.textPrimary),
      );
    }

    if (state.status == SellStatus.failure) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text(
              'Failed to load drafts',
              style: TextStyle(
                fontFamily: 'HelveticaNowText',
                fontSize: 16,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 16),
            TextButton(
              onPressed: () {
                getIt<SellBloc>().add(const SellRefreshRequested());
              },
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (state.drafts.isEmpty) {
      return _buildEmptyState();
    }

    return RefreshIndicator(
      onRefresh: () async {
        getIt<SellBloc>().add(const SellRefreshRequested());
      },
      color: AppColors.textPrimary,
      child: ListView.builder(
        padding: EdgeInsets.zero,
        itemCount: state.drafts.length,
        itemBuilder: (context, index) {
          final draft = state.drafts[index];
          return DraftStyleItem(
            draft: draft,
            onTap: () {
              // TODO: Navigate to edit draft
              _onDraftTapped(draft.id);
            },
          );
        },
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          PhosphorIcon(
            PhosphorIcons.storefront(),
            size: 64,
            color: AppColors.textHint.withOpacity(0.5),
          ),
          const SizedBox(height: 16),
          const Text(
            'No drafts yet',
            style: TextStyle(
              fontFamily: 'HelveticaNowText',
              fontSize: 18,
              fontWeight: FontWeight.w500,
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Start selling by tapping the button below',
            style: TextStyle(
              fontFamily: 'HelveticaNowText',
              fontSize: 14,
              color: AppColors.textHint,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomSection() {
    return Container(
      color: AppColors.secondary,
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: SizedBox(
            width: double.infinity,
            height: 44,
            child: ElevatedButton(
              onPressed: _onStartSellingPressed,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: AppColors.textOnPrimary,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(0),
                ),
                elevation: 0,
              ),
              child: const Text(
                'Start selling',
                style: TextStyle(
                  fontFamily: 'HelveticaNowText',
                  fontSize: 16,
                  fontWeight: FontWeight.w400,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _onDraftTapped(String draftId) {
    // TODO: Navigate to edit draft screen
    debugPrint('Draft tapped: $draftId');
  }

  void _onStartSellingPressed() {
    // TODO: Navigate to create new listing screen
    debugPrint('Start selling pressed');
  }
}
