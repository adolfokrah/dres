import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/features/profile/logic/seller_reviews_bloc/seller_reviews_bloc.dart';
import 'package:dres/features/product_details/presentation/widgets/review_item.dart';

/// Seller reviews list tab content
class SellerReviewsList extends StatefulWidget {
  final BuildContext parentContext;
  final String sellerId;
  final SellerReviewsBloc? bloc; // Optional: use parent's BLoC if provided

  const SellerReviewsList({
    super.key,
    required this.parentContext,
    required this.sellerId,
    this.bloc,
  });

  @override
  State<SellerReviewsList> createState() => _SellerReviewsListState();
}

class _SellerReviewsListState extends State<SellerReviewsList> {
  late final SellerReviewsBloc _sellerReviewsBloc;
  bool _ownsBloc = false;

  @override
  void initState() {
    super.initState();
    // Use provided BLoC or create a new one
    if (widget.bloc != null) {
      _sellerReviewsBloc = widget.bloc!;
      _ownsBloc = false;
    } else {
      _sellerReviewsBloc = getIt<SellerReviewsBloc>();
      _ownsBloc = true;
      // Fetch reviews when widget is shown (only if we created the BLoC)
      _sellerReviewsBloc.add(SellerReviewsFetchRequested(sellerId: widget.sellerId));
    }
  }

  @override
  void dispose() {
    // Only close the BLoC if we created it
    if (_ownsBloc) {
      _sellerReviewsBloc.close();
    }
    super.dispose();
  }

  void _onScroll(ScrollNotification notification) {
    if (notification is ScrollEndNotification) {
      final metrics = notification.metrics;
      if (metrics.pixels >= metrics.maxScrollExtent - 200) {
        _sellerReviewsBloc.add(const SellerReviewsLoadMoreRequested());
      }
    }
  }

  Future<void> _onRefresh() async {
    _sellerReviewsBloc.add(const SellerReviewsRefreshRequested());
    // Wait for the state to change from loading
    await _sellerReviewsBloc.stream.firstWhere(
      (state) => state.status != SellerReviewsStatus.loading,
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<SellerReviewsBloc, SellerReviewsState>(
      bloc: _sellerReviewsBloc,
      builder: (context, state) {
        return NotificationListener<ScrollNotification>(
          onNotification: (notification) {
            _onScroll(notification);
            return false;
          },
          child: RefreshIndicator(
            onRefresh: _onRefresh,
            edgeOffset: 100, // Account for NestedScrollView header
            child: CustomScrollView(
              slivers: [
                // Inject overlap from NestedScrollView header
                SliverOverlapInjector(
                  handle: NestedScrollView.sliverOverlapAbsorberHandleFor(
                      widget.parentContext),
                ),

                // Reviews content
                _buildSliverContent(state),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildSliverContent(SellerReviewsState state) {
    if (state.status == SellerReviewsStatus.loading && state.reviews.isEmpty) {
      return const SliverFillRemaining(
        child: Center(child: CircularProgressIndicator()),
      );
    }

    if (state.status == SellerReviewsStatus.error && state.reviews.isEmpty) {
      return SliverFillRemaining(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'Failed to load reviews',
                  style: AppTypography.bodyM.copyWith(
                    color: AppColors.textSecondary,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                TextButton(
                  onPressed: () =>
                      _sellerReviewsBloc.add(const SellerReviewsRefreshRequested()),
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    if (state.reviews.isEmpty) {
      return SliverFillRemaining(
        child: Center(
          child: Text(
            'No reviews yet',
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
          if (index >= state.reviews.length) {
            return const SizedBox.shrink();
          }
          final review = state.reviews[index];
          return ReviewItem(
            reviewerName: review.user.username ?? review.user.name,
            reviewerImage: review.user.avatar,
            review: review.review ?? '',
            images: review.imageUrls,
          );
        },
        childCount: state.reviews.length + (state.hasMore ? 1 : 0),
      ),
    );
  }
}
