import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/unified_header.dart';
import 'package:dres/features/sell/logic/style_stats_bloc/style_stats_bloc.dart';
import 'package:dres/features/sell/data/repositories/style_stats_repository.dart';

class StyleStatsScreen extends StatefulWidget {
  final String styleId;
  final String? styleTitle;

  const StyleStatsScreen({
    super.key,
    required this.styleId,
    this.styleTitle,
  });

  @override
  State<StyleStatsScreen> createState() => _StyleStatsScreenState();
}

class _StyleStatsScreenState extends State<StyleStatsScreen> {
  late final StyleStatsBloc _bloc;

  @override
  void initState() {
    super.initState();
    _bloc = StyleStatsBloc(
      styleStatsRepository: getIt<StyleStatsRepository>(),
    );
    _bloc.add(StyleStatsLoadRequested(styleId: widget.styleId));
  }

  @override
  void dispose() {
    _bloc.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: _bloc,
      child: Scaffold(
        backgroundColor: AppColors.background,
        body: SafeArea(
          child: Column(
            children: [
              UnifiedHeader.titleOnly(
                title: 'Analytics',
              ),
              Expanded(
                child: BlocBuilder<StyleStatsBloc, StyleStatsState>(
                  builder: (context, state) {
                    if (state.status == StyleStatsStatus.loading) {
                      return const Center(
                        child: CircularProgressIndicator(
                          color: AppColors.textPrimary,
                        ),
                      );
                    }

                    if (state.status == StyleStatsStatus.failure) {
                      return Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            PhosphorIcon(
                              PhosphorIcons.warning(),
                              size: 48,
                              color: AppColors.textSecondary,
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'Failed to load analytics',
                              style: AppTypography.bodyM.copyWith(
                                color: AppColors.textSecondary,
                              ),
                            ),
                            const SizedBox(height: 8),
                            TextButton(
                              onPressed: () {
                                _bloc.add(StyleStatsLoadRequested(
                                  styleId: widget.styleId,
                                ));
                              },
                              child: const Text('Try Again'),
                            ),
                          ],
                        ),
                      );
                    }

                    final stats = state.stats;
                    if (stats == null) {
                      return const Center(
                        child: Text('No data available'),
                      );
                    }

                    return RefreshIndicator(
                      onRefresh: () async {
                        _bloc.add(const StyleStatsRefreshRequested());
                        // Wait a bit for the refresh to complete
                        await Future.delayed(const Duration(milliseconds: 500));
                      },
                      color: AppColors.textPrimary,
                      child: SingleChildScrollView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Style title
                            if (stats.styleTitle != null) ...[
                              Text(
                                stats.styleTitle!,
                                style: AppTypography.titleLM.copyWith(
                                  color: AppColors.textPrimary,
                                ),
                              ),
                              const SizedBox(height: 20),
                            ],

                            // Key Metrics Grid
                            _buildMetricsGrid(stats),

                            const SizedBox(height: 24),

                            // Performance Chart
                            _buildPerformanceChart(stats),

                            const SizedBox(height: 24),

                            // Conversion Stats
                            _buildConversionCard(stats),

                            const SizedBox(height: 24),

                            // Variation Breakdown
                            if (stats.variations.isNotEmpty) ...[
                              Text(
                                'Variation Performance',
                                style: AppTypography.bodyM.copyWith(
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                              const SizedBox(height: 12),
                              _buildVariationsTable(stats),
                            ],

                            const SizedBox(height: 40),
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
      ),
    );
  }

  Widget _buildMetricsGrid(StyleStatsModel stats) {
    final overview = stats.overview;
    final currency = stats.currencySymbol;
    
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _buildMetricCard(
                icon: PhosphorIcons.eye(),
                label: 'Views',
                value: _formatNumber(overview.totalViews),
                subValue: '${overview.uniqueViewers} unique',
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildMetricCard(
                icon: PhosphorIcons.heart(),
                label: 'Favorites',
                value: _formatNumber(overview.totalFavorites),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildMetricCard(
                icon: PhosphorIcons.shoppingCart(),
                label: 'Items Sold',
                value: _formatNumber(overview.totalItemsSold),
                subValue: '${overview.totalOrders} orders',
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildMetricCard(
                icon: PhosphorIcons.currencyCircleDollar(),
                label: 'Revenue',
                value: '$currency ${_formatNumber(overview.totalRevenue.toInt())}',
                valueColor: AppColors.success,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildMetricCard(
                icon: PhosphorIcons.star(),
                label: 'Reviews',
                value: _formatNumber(overview.totalReviews),
                subValue: overview.totalReviews > 0
                    ? '${overview.averageRating} avg rating'
                    : null,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildMetricCard(
                icon: PhosphorIcons.bell(),
                label: 'Waitlist',
                value: _formatNumber(overview.waitlistCount),
                subValue: 'want restock',
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildMetricCard({
    required IconData icon,
    required String label,
    required String value,
    String? subValue,
    Color? valueColor,
  }) {
    return Container(
      height: 100, // Fixed height for consistent sizing
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              PhosphorIcon(
                icon,
                size: 16,
                color: AppColors.textSecondary,
              ),
              const SizedBox(width: 6),
              Text(
                label,
                style: AppTypography.caption.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: AppTypography.titleLM.copyWith(
                  color: valueColor ?? AppColors.textPrimary,
                  fontWeight: FontWeight.w700,
                ),
              ),
              Text(
                subValue ?? '',
                style: AppTypography.caption.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPerformanceChart(StyleStatsModel stats) {
    final overview = stats.overview;

    // Create data for the bar chart comparing key metrics
    final barGroups = [
      _makeBarGroup(0, overview.totalViews.toDouble(), AppColors.primary),
      _makeBarGroup(1, overview.totalFavorites.toDouble(), AppColors.error),
      _makeBarGroup(2, overview.totalItemsSold.toDouble(), AppColors.success),
      _makeBarGroup(3, overview.totalOrders.toDouble(), AppColors.warning),
    ];

    // Find max value for chart scaling
    final maxValue = [
      overview.totalViews,
      overview.totalFavorites,
      overview.totalItemsSold,
      overview.totalOrders,
    ].reduce((a, b) => a > b ? a : b).toDouble();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Performance Overview',
            style: AppTypography.bodyM.copyWith(
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 20),
          SizedBox(
            height: 200,
            child: BarChart(
              BarChartData(
                alignment: BarChartAlignment.spaceAround,
                maxY: maxValue > 0 ? maxValue * 1.2 : 10,
                barTouchData: BarTouchData(
                  touchTooltipData: BarTouchTooltipData(
                    getTooltipColor: (_) => AppColors.textPrimary,
                    tooltipPadding: const EdgeInsets.all(8),
                    getTooltipItem: (group, groupIndex, rod, rodIndex) {
                      final labels = ['Views', 'Favorites', 'Sold', 'Orders'];
                      return BarTooltipItem(
                        '${labels[group.x]}\n${rod.toY.toInt()}',
                        AppTypography.caption.copyWith(
                          color: AppColors.background,
                        ),
                      );
                    },
                  ),
                ),
                titlesData: FlTitlesData(
                  show: true,
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      getTitlesWidget: (value, meta) {
                        final labels = ['Views', 'Favorites', 'Sold', 'Orders'];
                        return Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Text(
                            labels[value.toInt()],
                            style: AppTypography.caption.copyWith(
                              color: AppColors.textSecondary,
                              fontSize: 10,
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 40,
                      getTitlesWidget: (value, meta) {
                        return Text(
                          _formatNumber(value.toInt()),
                          style: AppTypography.caption.copyWith(
                            color: AppColors.textSecondary,
                            fontSize: 10,
                          ),
                        );
                      },
                    ),
                  ),
                  topTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  rightTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                ),
                borderData: FlBorderData(show: false),
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  horizontalInterval: maxValue > 0 ? maxValue / 4 : 2.5,
                  getDrawingHorizontalLine: (value) {
                    return FlLine(
                      color: AppColors.border,
                      strokeWidth: 1,
                    );
                  },
                ),
                barGroups: barGroups,
              ),
            ),
          ),
        ],
      ),
    );
  }

  BarChartGroupData _makeBarGroup(int x, double y, Color color) {
    return BarChartGroupData(
      x: x,
      barRods: [
        BarChartRodData(
          toY: y,
          color: color,
          width: 32,
          borderRadius: BorderRadius.zero,
        ),
      ],
    );
  }

  Widget _buildConversionCard(StyleStatsModel stats) {
    final overview = stats.overview;
    final currency = stats.currencySymbol;
    final conversionRate = overview.conversionRate;
    final avgOrderValue = overview.totalOrders > 0
        ? overview.totalRevenue / overview.totalOrders
        : 0.0;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Conversion Insights',
            style: AppTypography.bodyM.copyWith(
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildInsightItem(
                  label: 'Conversion Rate',
                  value: '${conversionRate.toStringAsFixed(2)}%',
                  description: 'Viewers who bought',
                  icon: PhosphorIcons.trendUp(),
                  iconColor: conversionRate > 2
                      ? AppColors.success
                      : AppColors.warning,
                ),
              ),
              Container(
                width: 1,
                height: 60,
                color: AppColors.border,
              ),
              Expanded(
                child: _buildInsightItem(
                  label: 'Avg Order Value',
                  value: '$currency ${avgOrderValue.toStringAsFixed(0)}',
                  description: 'Per order',
                  icon: PhosphorIcons.receipt(),
                  iconColor: AppColors.primary,
                ),
              ),
            ],
          ),
          if (overview.lastSaleAt != null) ...[
            const SizedBox(height: 16),
            const Divider(color: AppColors.border),
            const SizedBox(height: 12),
            Row(
              children: [
                PhosphorIcon(
                  PhosphorIcons.clock(),
                  size: 16,
                  color: AppColors.textSecondary,
                ),
                const SizedBox(width: 8),
                Text(
                  'Last sale: ${_formatDate(overview.lastSaleAt!)}',
                  style: AppTypography.caption.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildInsightItem({
    required String label,
    required String value,
    required String description,
    required IconData icon,
    required Color iconColor,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: Column(
        children: [
          PhosphorIcon(
            icon,
            size: 24,
            color: iconColor,
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: AppTypography.titleLM.copyWith(
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: AppTypography.caption.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVariationsTable(StyleStatsModel stats) {
    final variations = stats.variations;
    final currency = stats.currencySymbol;
    
    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            color: AppColors.surface,
            child: Row(
              children: [
                Expanded(
                  flex: 3,
                  child: Text(
                    'Variation',
                    style: AppTypography.caption.copyWith(
                      fontWeight: FontWeight.w600,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ),
                Expanded(
                  child: Text(
                    'Views',
                    style: AppTypography.caption.copyWith(
                      fontWeight: FontWeight.w600,
                      color: AppColors.textSecondary,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
                Expanded(
                  child: Text(
                    'Sold',
                    style: AppTypography.caption.copyWith(
                      fontWeight: FontWeight.w600,
                      color: AppColors.textSecondary,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
                Expanded(
                  child: Text(
                    'Rev.',
                    style: AppTypography.caption.copyWith(
                      fontWeight: FontWeight.w600,
                      color: AppColors.textSecondary,
                    ),
                    textAlign: TextAlign.right,
                  ),
                ),
              ],
            ),
          ),
          // Rows
          ...variations.map((v) => _buildVariationRow(v, currency)),
        ],
      ),
    );
  }

  Widget _buildVariationRow(VariationStatsModel variation, String currency) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      decoration: const BoxDecoration(
        border: Border(
          top: BorderSide(color: AppColors.border),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            flex: 3,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  variation.title ?? 'Untitled',
                  style: AppTypography.bodyS.copyWith(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w500,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                if (variation.favorites > 0 || variation.waitlist > 0) ...[
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      if (variation.favorites > 0) ...[
                        PhosphorIcon(
                          PhosphorIcons.heart(),
                          size: 10,
                          color: AppColors.error,
                        ),
                        const SizedBox(width: 2),
                        Text(
                          '${variation.favorites}',
                          style: AppTypography.caption.copyWith(
                            color: AppColors.textSecondary,
                            fontSize: 10,
                          ),
                        ),
                        const SizedBox(width: 8),
                      ],
                      if (variation.waitlist > 0) ...[
                        PhosphorIcon(
                          PhosphorIcons.bell(),
                          size: 10,
                          color: AppColors.warning,
                        ),
                        const SizedBox(width: 2),
                        Text(
                          '${variation.waitlist}',
                          style: AppTypography.caption.copyWith(
                            color: AppColors.textSecondary,
                            fontSize: 10,
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ],
            ),
          ),
          Expanded(
            child: Text(
              _formatNumber(variation.views),
              style: AppTypography.bodyS.copyWith(
                color: AppColors.textPrimary,
              ),
              textAlign: TextAlign.center,
            ),
          ),
          Expanded(
            child: Text(
              _formatNumber(variation.itemsSold),
              style: AppTypography.bodyS.copyWith(
                color: AppColors.textPrimary,
              ),
              textAlign: TextAlign.center,
            ),
          ),
          Expanded(
            child: Text(
              '$currency${_formatNumber(variation.revenue.toInt())}',
              style: AppTypography.bodyS.copyWith(
                color: AppColors.success,
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.right,
            ),
          ),
        ],
      ),
    );
  }

  String _formatNumber(int number) {
    if (number >= 1000000) {
      return '${(number / 1000000).toStringAsFixed(1)}M';
    } else if (number >= 1000) {
      return '${(number / 1000).toStringAsFixed(1)}K';
    }
    return number.toString();
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      final now = DateTime.now();
      final diff = now.difference(date);

      if (diff.inDays == 0) {
        return 'Today';
      } else if (diff.inDays == 1) {
        return 'Yesterday';
      } else if (diff.inDays < 7) {
        return '${diff.inDays} days ago';
      } else {
        return '${date.day}/${date.month}/${date.year}';
      }
    } catch (e) {
      return dateStr;
    }
  }
}
