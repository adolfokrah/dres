import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/utilities/media_utils.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/core/widgets/profile_avatar.dart';
import 'package:dres/features/auth/logic/auth_bloc/auth_bloc.dart';
import 'package:dres/features/follows/logic/follows_bloc/follows_bloc.dart';
import 'package:dres/features/product_details/data/repositories/seller_repository.dart';
import 'package:dres/features/product_details/data/models/seller_model.dart';
import 'package:dres/features/profile/presentation/widgets/profile_stats_card.dart';
import 'package:dres/features/profile/presentation/widgets/profile_tabs_bar.dart';
import 'package:dres/features/profile/presentation/widgets/purchases_list.dart';
import 'package:dres/features/profile/presentation/widgets/incoming_orders_list.dart';
import 'package:dres/features/profile/presentation/widgets/transactions_list.dart';
import 'package:dres/features/profile/presentation/widgets/community_list.dart';
import 'package:dres/features/profile/presentation/widgets/seller_reviews_list.dart';
import 'package:dres/features/profile/presentation/widgets/user_products_list.dart';
import 'package:dres/features/profile/logic/seller_reviews_bloc/seller_reviews_bloc.dart';

class UserProfileScreen extends StatefulWidget {
  final String? userId;

  const UserProfileScreen({
    super.key,
    this.userId,
  });

  @override
  State<UserProfileScreen> createState() => _UserProfileScreenState();
}

class _UserProfileScreenState extends State<UserProfileScreen> {
  int _selectedTabIndex = 2; // Default to Purchases tab
  SellerModel? _seller;
  bool _isLoadingSeller = false;
  String? _error;
  String? _loadedUserId;
  
  // Create BLoC instance for this screen
  late final SellerReviewsBloc _sellerReviewsBloc;
  bool _initialized = false;

  @override
  void initState() {
    super.initState();
    // Create a new BLoC instance for this screen
    _sellerReviewsBloc = getIt<SellerReviewsBloc>();
  }

  @override
  void dispose() {
    // Close the BLoC since it's a factory instance
    _sellerReviewsBloc.close();
    super.dispose();
  }

  Future<void> _fetchSellerInfo(String userId) async {
    if (_loadedUserId == userId || _isLoadingSeller) return;
    

    setState(() {
      _isLoadingSeller = true;
      _error = null;
      _loadedUserId = userId;
    });

    // Also fetch reviews for this user
    _sellerReviewsBloc.add(SellerReviewsFetchRequested(sellerId: userId));

    try {
      final sellerRepository = getIt<SellerRepository>();
      debugPrint('🔵 UserProfileScreen: Calling getSellerInfo...');
      final seller = await sellerRepository.getSellerInfo(sellerId: userId);
      debugPrint('🟢 UserProfileScreen: Got seller: ${seller.name}');
      if (mounted) {
        setState(() {
          _seller = seller;
          _isLoadingSeller = false;
        });
      }
    } catch (e, stackTrace) {
      debugPrint('🔴 Error fetching seller info: $e');
      debugPrint('🔴 Stack trace: $stackTrace');
      if (mounted) {
        setState(() {
          _isLoadingSeller = false;
          _error = e.toString();
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Refresh user data (including stats) when profile screen opens (once)
    if (!_initialized) {
      _initialized = true;
      context.read<AuthBloc>().add(const AuthCheckStatusRequested());
    }

    return BlocConsumer<AuthBloc, AuthState>(
      listener: (context, state) {
        final userId = widget.userId ?? state.user?.id;
        if (userId != null && _loadedUserId != userId) {
          _fetchSellerInfo(userId);
        }
      },
      builder: (context, authState) {
        final userId = widget.userId ?? authState.user?.id;
        final displayName = _seller?.name ?? 'Profile';
        
        // If auth is still loading and we don't have a userId, show loading
        if (userId == null && authState.status == AuthStatus.loading) {
          return Scaffold(
            backgroundColor: AppColors.background,
            appBar: _buildAppBar(context, 'Profile'),
            body: const Center(child: CircularProgressIndicator()),
          );
        }
        
        // If we have a userId but haven't loaded seller yet, trigger load
        if (userId != null && _loadedUserId != userId && !_isLoadingSeller) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            _fetchSellerInfo(userId);
          });
        }
        
        // If no user and auth is done loading, show error
        if (userId == null && authState.status != AuthStatus.loading) {
          return Scaffold(
            backgroundColor: AppColors.background,
            appBar: _buildAppBar(context, 'Profile'),
            body: _buildNotLoggedInState(),
          );
        }

        // Loading state
        if (_isLoadingSeller || _seller == null) {
          return Scaffold(
            backgroundColor: AppColors.background,
            appBar: _buildAppBar(context, 'Profile'),
            body: const Center(child: CircularProgressIndicator()),
          );
        }

        // Error state
        if (_error != null) {
          return Scaffold(
            backgroundColor: AppColors.background,
            appBar: _buildAppBar(context, 'Profile'),
            body: _buildErrorState(),
          );
        }

        // Success - show content
        return Scaffold(
          backgroundColor: AppColors.background,
          appBar: _buildAppBar(context, displayName),
          body: _buildContent(authState),
        );
      },
    );
  }

  PreferredSizeWidget _buildAppBar(BuildContext context, String title) {
    return AppBar(
      backgroundColor: AppColors.background,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: true,
      leading: IconButton(
        icon: Icon(
          PhosphorIcons.caretLeft(),
          color: AppColors.textPrimary,
          size: 20,
        ),
        onPressed: () => context.pop(),
      ),
      title: Text(
        title,
        style: AppTypography.bodyL.copyWith(
          color: AppColors.textPrimary,
        ),
      ),
      actions: [
        IconButton(
          icon: Icon(
            PhosphorIcons.pencilSimple(),
            color: AppColors.textPrimary,
            size: 20,
          ),
          onPressed: () => context.push('/profile/personal-info'),
        ),
      ],
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(1),
        child: Container(
          color: AppColors.secondary,
          height: 1,
        ),
      ),
    );
  }

  Widget _buildNotLoggedInState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            'Please log in to view your profile',
            style: AppTypography.bodyL.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 16),
          TextButton(
            onPressed: () => context.pop(),
            child: const Text('Go back'),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            'Failed to load profile',
            style: AppTypography.bodyL.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 16),
          TextButton(
            onPressed: () {
              final userId = widget.userId ?? context.read<AuthBloc>().state.user?.id;
              if (userId != null) {
                setState(() {
                  _loadedUserId = null;
                  _error = null;
                });
                _fetchSellerInfo(userId);
              }
            },
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  Widget _buildContent(AuthState authState) {
    final seller = _seller;
    final userId = widget.userId ?? authState.user?.id;
    final isOwnProfile = widget.userId == null || widget.userId == authState.user?.id;
    
    // Use authState.user for own profile (always up-to-date), seller for others
    final String displayName;
    final String username;
    final String? photoUrl;
    
    if (isOwnProfile && authState.user != null) {
      // Own profile - use AuthBloc state (always fresh)
      final user = authState.user!;
      displayName = user.shopName ?? '${user.firstName} ${user.lastName}'.trim();
      username = user.username ?? '';
      photoUrl = user.photo != null ? MediaUtils.resolveUrl(user.photo) : null;
    } else {
      // Other user's profile - use fetched seller data
      displayName = seller?.name ?? 'User';
      username = seller?.username ?? '';
      photoUrl = seller?.profileImage != null 
          ? MediaUtils.resolveUrl(seller!.profileImage) 
          : null;
    }

    return BlocBuilder<SellerReviewsBloc, SellerReviewsState>(
      bloc: _sellerReviewsBloc,
      builder: (context, reviewsState) {
        // Build tabs with review count
        final tabs = [
          const ProfileTab(label: 'Products'),
          const ProfileTab(label: 'Incoming orders'),
          const ProfileTab(label: 'Purchases'),
          const ProfileTab(label: 'Transactions'),
          const ProfileTab(label: 'Community'),
          ProfileTab(
            label: 'Reviews',
            count: reviewsState.totalReviews > 0 ? reviewsState.totalReviews : null,
          ),
        ];

        return NestedScrollView(
          headerSliverBuilder: (context, innerBoxIsScrolled) {
            return [
              // Wrap header in SliverOverlapAbsorber for proper coordination
              SliverOverlapAbsorber(
                handle: NestedScrollView.sliverOverlapAbsorberHandleFor(context),
                sliver: SliverToBoxAdapter(
                  child: _buildShopHeader(displayName, username, photoUrl, authState),
                ),
              ),

              // Tabs bar - pinned (sticks to top)
              SliverPersistentHeader(
                pinned: true,
                delegate: _TabsBarDelegate(
                  child: ProfileTabsBar(
                    selectedIndex: _selectedTabIndex,
                    onTabChanged: (index) {
                      setState(() {
                        _selectedTabIndex = index;
                      });
                    },
                    tabs: tabs,
                  ),
                ),
              ),
            ];
          },
          body: Builder(
            builder: (context) {
              return _buildTabContent(context, userId);
            },
          ),
        );
      },
    );
  }

  Widget _buildShopHeader(String displayName, String username, String? photoUrl, AuthState authState) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 10, 20, 16),
      decoration: const BoxDecoration(
        border: Border(
          bottom: BorderSide(color: AppColors.secondary, width: 1),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Profile info row
          Row(
            children: [
              // Avatar
              ProfileAvatar(
                photoUrl: photoUrl,
                displayName: displayName,
                size: 70,
              ),
              const SizedBox(width: 20),
              // Name and username
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      displayName,
                      style: AppTypography.bodyL.copyWith(
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    if (username.isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Text(
                        '@$username',
                        style: AppTypography.bodyM.copyWith(
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Stats card - using followers/following from FollowsBloc for real-time updates
          BlocBuilder<FollowsBloc, FollowsState>(
            bloc: getIt<FollowsBloc>(),
            buildWhen: (previous, current) =>
                previous.myFollowersCount != current.myFollowersCount ||
                previous.myFollowingCount != current.myFollowingCount,
            builder: (context, followsState) {
              // Use FollowsBloc counts if initialized, otherwise use auth state
              final followersCount = followsState.myFollowersCount > 0
                  ? followsState.myFollowersCount
                  : (authState.user?.followersCount ?? 0);
              final followingCount = followsState.myFollowingCount > 0
                  ? followsState.myFollowingCount
                  : (authState.user?.followingCount ?? 0);
              
              return ProfileStatsCard(
                followers: followersCount,
                following: followingCount,
                onFollowersTap: () {
                  // TODO: Navigate to followers
                },
                onFollowingTap: () {
                  // TODO: Navigate to following
                },
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildTabContent(BuildContext context, String? userId) {
    switch (_selectedTabIndex) {
      case 0:
        return UserProductsList(parentContext: context);
      case 1:
        return IncomingOrdersList(parentContext: context);
      case 2:
        return PurchasesList(parentContext: context);
      case 3:
        return TransactionsList(parentContext: context);
      case 4:
        if (userId == null) {
          return _buildPlaceholder(context, 'Community');
        }
        return CommunityList(parentContext: context, userId: userId);
      case 5:
        if (userId == null) {
          return _buildPlaceholder(context, 'Reviews');
        }
        return SellerReviewsList(
          parentContext: context,
          sellerId: userId,
          bloc: _sellerReviewsBloc, // Pass the parent's BLoC
        );
      default:
        return const SizedBox.shrink();
    }
  }

  Widget _buildPlaceholder(BuildContext context, String title) {
    return CustomScrollView(
      slivers: [
        SliverOverlapInjector(
          handle: NestedScrollView.sliverOverlapAbsorberHandleFor(context),
        ),
        SliverFillRemaining(
          child: Center(
            child: Text(
              '$title coming soon',
              style: AppTypography.bodyL.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

/// Delegate for the pinned tabs bar
class _TabsBarDelegate extends SliverPersistentHeaderDelegate {
  final Widget child;

  _TabsBarDelegate({required this.child});

  // Use a consistent height that matches the ProfileTabsBar
  // (vertical padding: 10*2 = 20) + (text ~16) + (border: 1) = ~37
  // Use 42 to give some buffer and avoid geometry issues
  static const double _height = 42.0;

  @override
  double get minExtent => _height;

  @override
  double get maxExtent => _height;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return SizedBox(
      height: _height,
      child: Container(
        color: AppColors.background,
        child: child,
      ),
    );
  }

  @override
  bool shouldRebuild(covariant _TabsBarDelegate oldDelegate) => true;
}
