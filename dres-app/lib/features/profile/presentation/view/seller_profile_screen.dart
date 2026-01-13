import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/features/product_details/data/repositories/seller_repository.dart';
import 'package:dres/features/product_details/data/models/seller_model.dart';
import 'package:dres/features/product_details/presentation/widgets/seller_info.dart';
import 'package:dres/features/profile/presentation/widgets/profile_tabs_bar.dart';
import 'package:dres/features/profile/presentation/widgets/community_list.dart';
import 'package:dres/features/profile/presentation/widgets/seller_reviews_list.dart';
import 'package:dres/features/profile/presentation/widgets/seller_products_list.dart';
import 'package:dres/features/profile/logic/seller_reviews_bloc/seller_reviews_bloc.dart';
import 'package:dres/features/follows/logic/follows_bloc/follows_bloc.dart';

/// Public seller profile screen viewed by visitors
class SellerProfileScreen extends StatefulWidget {
  final String sellerId;
  final int initialTab;

  const SellerProfileScreen({
    super.key,
    required this.sellerId,
    this.initialTab = 0,
  });

  @override
  State<SellerProfileScreen> createState() => _SellerProfileScreenState();
}

class _SellerProfileScreenState extends State<SellerProfileScreen> {
  late int _selectedTabIndex;
  SellerModel? _seller;
  bool _isLoadingSeller = true;
  String? _error;
  
  // Create BLoC instance for this screen
  late final SellerReviewsBloc _sellerReviewsBloc;

  @override
  void initState() {
    super.initState();
    // Initialize tab index from initialTab parameter
    _selectedTabIndex = widget.initialTab;
    // Create a new BLoC instance for this screen
    _sellerReviewsBloc = getIt<SellerReviewsBloc>();
    
    _fetchSellerInfo();
    // Fetch reviews for this seller
    _sellerReviewsBloc.add(SellerReviewsFetchRequested(sellerId: widget.sellerId));
    // Check if following this seller
    getIt<FollowsBloc>().add(FollowsCheckRequested(userId: widget.sellerId));
  }

  @override
  void dispose() {
    // Close the BLoC since it's a factory instance
    _sellerReviewsBloc.close();
    super.dispose();
  }

  Future<void> _fetchSellerInfo() async {
    setState(() {
      _isLoadingSeller = true;
      _error = null;
    });

    try {
      final sellerRepository = getIt<SellerRepository>();
      final seller = await sellerRepository.getSellerInfo(sellerId: widget.sellerId);
      if (mounted) {
        setState(() {
          _seller = seller;
          _isLoadingSeller = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching seller info: $e');
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
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: _buildAppBar(context),
      body: _buildBody(),
    );
  }

  PreferredSizeWidget _buildAppBar(BuildContext context) {
    final title = _seller?.name ?? 'Seller';
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
        onPressed: () {
          if (context.canPop()) {
            context.pop();
          } else {
            context.go('/');
          }
        },
      ),
      title: Text(
        title,
        style: AppTypography.bodyL.copyWith(
          color: AppColors.textPrimary,
        ),
      ),
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(1),
        child: Container(
          color: AppColors.secondary,
          height: 1,
        ),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoadingSeller) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'Failed to load seller profile',
              style: AppTypography.bodyL.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 16),
            TextButton(
              onPressed: _fetchSellerInfo,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_seller == null) {
      return const Center(child: Text('Seller not found'));
    }

    return BlocBuilder<SellerReviewsBloc, SellerReviewsState>(
      bloc: _sellerReviewsBloc,
      builder: (context, reviewsState) {
        // Visitor tabs: Products | Community | Reviews
        final tabs = [
          const ProfileTab(label: 'Products'),
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
                  child: Container(
                    padding: const EdgeInsets.fromLTRB(20, 10, 20, 10),
                    decoration: const BoxDecoration(
                      border: Border(
                        bottom: BorderSide(color: AppColors.secondary, width: 1),
                      ),
                    ),
                    // Reuse the SellerInfo widget from product details
                    child: SellerInfo(sellerId: widget.sellerId),
                  ),
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
              return _buildTabContent(context);
            },
          ),
        );
      },
    );
  }

  Widget _buildTabContent(BuildContext context) {
    switch (_selectedTabIndex) {
      case 0:
        return SellerProductsList(
          parentContext: context,
          sellerId: widget.sellerId,
        );
      case 1:
        return CommunityList(
          parentContext: context,
          userId: widget.sellerId,
        );
      case 2:
        return SellerReviewsList(
          parentContext: context,
          sellerId: widget.sellerId,
          bloc: _sellerReviewsBloc, // Pass the parent's BLoC
        );
      default:
        return const SizedBox.shrink();
    }
  }
}

/// Delegate for the pinned tabs bar
class _TabsBarDelegate extends SliverPersistentHeaderDelegate {
  final Widget child;

  _TabsBarDelegate({required this.child});

  // Use a consistent height that matches the ProfileTabsBar
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
