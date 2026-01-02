import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/core/widgets/profile_avatar.dart';
import 'package:dres/features/profile/logic/community_bloc/community_bloc.dart';
import 'package:dres/features/profile/data/models/follow_user_model.dart';

/// Community list tab content (followers/following)
class CommunityList extends StatefulWidget {
  final BuildContext parentContext;
  final String userId;

  const CommunityList({
    super.key,
    required this.parentContext,
    required this.userId,
  });

  @override
  State<CommunityList> createState() => _CommunityListState();
}

class _CommunityListState extends State<CommunityList> {
  late final CommunityBloc _communityBloc;

  @override
  void initState() {
    super.initState();
    _communityBloc = getIt<CommunityBloc>();

    // Always fetch community when this widget is shown
    _communityBloc.add(CommunityFetchRequested(userId: widget.userId, filter: 'followers'));
  }

  @override
  void dispose() {
    // Don't close bloc - it's a singleton
    super.dispose();
  }

  void _onScroll(ScrollNotification notification) {
    if (notification is ScrollEndNotification) {
      final metrics = notification.metrics;
      if (metrics.pixels >= metrics.maxScrollExtent - 200) {
        _communityBloc.add(const CommunityLoadMoreRequested());
      }
    }
  }

  void _showFilterMenu() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.zero,
      ),
      builder: (context) => _FilterBottomSheet(
        currentFilter: _communityBloc.state.filter,
        onFilterSelected: (filter) {
          Navigator.pop(context);
          _communityBloc.add(CommunityFilterChanged(filter: filter));
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<CommunityBloc, CommunityState>(
      bloc: _communityBloc,
      builder: (context, state) {
        return NotificationListener<ScrollNotification>(
          onNotification: (notification) {
            _onScroll(notification);
            return false; // Allow notification to bubble up to NestedScrollView
          },
          child: CustomScrollView(
            slivers: [
              // Inject overlap from NestedScrollView header
              SliverOverlapInjector(
                handle: NestedScrollView.sliverOverlapAbsorberHandleFor(
                    widget.parentContext),
              ),

              // Filter header
              SliverToBoxAdapter(
                child: _buildFilterHeader(state),
              ),

              // Community content
              _buildSliverContent(state),
            ],
          ),
        );
      },
    );
  }

  Widget _buildFilterHeader(CommunityState state) {
    return Container(
      padding: const EdgeInsets.all(20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          GestureDetector(
            onTap: _showFilterMenu,
            child: Row(
              children: [
                Text(
                  'Filter by',
                  style: AppTypography.bodyM.copyWith(
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(width: 4),
                Icon(
                  PhosphorIcons.caretDown(),
                  size: 14,
                  color: AppColors.textPrimary,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSliverContent(CommunityState state) {
    if (state.status == CommunityStatus.loading && state.users.isEmpty) {
      return const SliverFillRemaining(
        child: Center(child: CircularProgressIndicator()),
      );
    }

    if (state.status == CommunityStatus.error && state.users.isEmpty) {
      return SliverFillRemaining(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'Failed to load ${state.filter}',
                  style: AppTypography.bodyM.copyWith(
                    color: AppColors.textSecondary,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                TextButton(
                  onPressed: () =>
                      _communityBloc.add(const CommunityRefreshRequested()),
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    if (state.users.isEmpty) {
      return SliverFillRemaining(
        child: Center(
          child: Text(
            state.filter == 'followers'
                ? 'No followers yet'
                : 'Not following anyone yet',
            style: AppTypography.bodyM.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
        ),
      );
    }

    return SliverList(
      delegate: SliverChildBuilderDelegate(
        (context, index) {
          if (index >= state.users.length) {
            return const SizedBox.shrink();
          }
          final user = state.users[index];
          return _CommunityMemberCard(
            user: user,
            filterType: state.filter,
          );
        },
        childCount: state.users.length + (state.hasMore ? 1 : 0),
      ),
    );
  }
}

/// Community member card widget
class _CommunityMemberCard extends StatelessWidget {
  final FollowUserModel user;
  final String filterType;

  const _CommunityMemberCard({
    required this.user,
    required this.filterType,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(
          bottom: BorderSide(color: AppColors.secondary, width: 1),
        ),
      ),
      child: GestureDetector(
        onTap: () => context.push('/profile/${user.id}'),
        child: Row(
          children: [
            // Avatar
            ProfileAvatar(
              photoUrl: user.avatar,
              size: 56,
              displayName: user.name,
            ),
            const SizedBox(width: 15),

            // User info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    user.username ?? user.name,
                    style: AppTypography.bodyM.copyWith(
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 11),
                  // Badge
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 5, vertical: 5),
                    decoration: BoxDecoration(
                      border: Border.all(color: AppColors.textPrimary, width: 1),
                    ),
                    child: Text(
                      filterType == 'followers' ? 'Follower' : 'Following',
                      style: AppTypography.bodyS.copyWith(
                        color: AppColors.textPrimary,
                        fontSize: 10,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Chevron
            Icon(
              PhosphorIcons.caretRight(),
              size: 16,
              color: AppColors.textPrimary,
            ),
          ],
        ),
      ),
    );
  }
}

/// Filter bottom sheet
class _FilterBottomSheet extends StatelessWidget {
  final String currentFilter;
  final ValueChanged<String> onFilterSelected;

  const _FilterBottomSheet({
    required this.currentFilter,
    required this.onFilterSelected,
  });

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(height: 8),
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.secondary,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'Filter by',
            style: AppTypography.bodyL.copyWith(
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 16),
          _FilterOption(
            label: 'Followers',
            isSelected: currentFilter == 'followers',
            onTap: () => onFilterSelected('followers'),
          ),
          _FilterOption(
            label: 'Following',
            isSelected: currentFilter == 'following',
            onTap: () => onFilterSelected('following'),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }
}

class _FilterOption extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _FilterOption({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: AppTypography.bodyM.copyWith(
                color: AppColors.textPrimary,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w400,
              ),
            ),
            if (isSelected)
              Icon(
                PhosphorIcons.check(),
                size: 20,
                color: AppColors.textPrimary,
              ),
          ],
        ),
      ),
    );
  }
}
