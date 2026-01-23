import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/features/cart/data/models/location_model.dart';

/// A reusable city selection sheet with multi-select, region grouping,
/// search functionality, and "Select all" per region.
///
/// Used for shipping rates city selection and product shipping filter.
class CitySelectionSheet extends StatefulWidget {
  /// All cities available for selection (flattened list)
  final List<CityModel> allCities;

  /// Regions with their cities (for grouped display)
  final List<RegionModel> regions;

  /// Currently selected city IDs
  final Set<String> selectedCityIds;

  /// Callback when selection changes
  final void Function(Set<String> ids, List<CityModel> cities) onSelectionChanged;

  /// Optional title for the sheet
  final String title;

  const CitySelectionSheet({
    super.key,
    required this.allCities,
    required this.regions,
    required this.selectedCityIds,
    required this.onSelectionChanged,
    this.title = 'Select Cities',
  });

  @override
  State<CitySelectionSheet> createState() => _CitySelectionSheetState();
}

class _CitySelectionSheetState extends State<CitySelectionSheet> {
  late Set<String> _selectedIds;
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _selectedIds = Set.from(widget.selectedCityIds);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _onDone() {
    final selectedCities = widget.allCities
        .where((city) => _selectedIds.contains(city.id))
        .toList();
    widget.onSelectionChanged(_selectedIds, selectedCities);
    Navigator.pop(context);
  }

  void _onReset() {
    final selectedCities = <CityModel>[];
    widget.onSelectionChanged({}, selectedCities);
    Navigator.pop(context);
  }

  void _toggleCity(String cityId) {
    setState(() {
      if (_selectedIds.contains(cityId)) {
        _selectedIds.remove(cityId);
      } else {
        _selectedIds.add(cityId);
      }
    });
  }

  void _selectAllInRegion(RegionModel region) {
    setState(() {
      for (final city in region.cities) {
        _selectedIds.add(city.id);
      }
    });
  }

  void _deselectAllInRegion(RegionModel region) {
    setState(() {
      for (final city in region.cities) {
        _selectedIds.remove(city.id);
      }
    });
  }

  int _getSelectedCountForRegion(RegionModel region) {
    return region.cities.where((c) => _selectedIds.contains(c.id)).length;
  }

  bool _isAllSelectedInRegion(RegionModel region) {
    return region.cities.every((c) => _selectedIds.contains(c.id));
  }

  List<RegionModel> get _filteredRegions {
    if (_searchQuery.isEmpty) {
      return widget.regions.where((r) => r.cities.isNotEmpty).toList();
    }

    // Filter regions and their cities based on search
    return widget.regions
        .map((region) {
          final filteredCities = region.cities
              .where((city) =>
                  city.name.toLowerCase().contains(_searchQuery.toLowerCase()))
              .toList();
          if (filteredCities.isEmpty) return null;
          return RegionModel(
            id: region.id,
            name: region.name,
            cities: filteredCities,
          );
        })
        .whereType<RegionModel>()
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    final filteredRegions = _filteredRegions;

    return DraggableScrollableSheet(
      initialChildSize: 0.9,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      expand: false,
      builder: (context, scrollController) {
        return Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                border: Border(bottom: BorderSide(color: AppColors.border)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: Text(
                      'Cancel',
                      style:
                          AppTypography.bodyM.copyWith(color: AppColors.textSecondary),
                    ),
                  ),
                  Text(
                    widget.title,
                    style: AppTypography.bodyL.copyWith(color: AppColors.textPrimary),
                  ),
                  GestureDetector(
                    onTap: _onDone,
                    child: Text(
                      'Done (${_selectedIds.length})',
                      style: AppTypography.bodyM.copyWith(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Search bar
            Padding(
              padding: const EdgeInsets.all(16),
              child: TextField(
                controller: _searchController,
                decoration: InputDecoration(
                  hintText: 'Search cities',
                  hintStyle: AppTypography.bodyM.copyWith(color: AppColors.textHint),
                  prefixIcon: Padding(
                    padding: const EdgeInsets.all(12),
                    child: PhosphorIcon(
                      PhosphorIcons.magnifyingGlass(),
                      size: 20,
                      color: AppColors.textHint,
                    ),
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.zero,
                    borderSide: BorderSide(color: AppColors.border),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.zero,
                    borderSide: BorderSide(color: AppColors.border),
                  ),
                  focusedBorder: const OutlineInputBorder(
                    borderRadius: BorderRadius.zero,
                    borderSide: BorderSide(color: AppColors.textPrimary),
                  ),
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                ),
                onChanged: (value) {
                  setState(() {
                    _searchQuery = value;
                  });
                },
              ),
            ),

            // Reset button (only show if there are selections)
            if (_selectedIds.isNotEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Align(
                  alignment: Alignment.centerRight,
                  child: GestureDetector(
                    onTap: _onReset,
                    child: Text(
                      'Reset all',
                      style: AppTypography.bodyS.copyWith(
                        color: AppColors.error,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ),
              ),

            const SizedBox(height: 8),

            // Regions with sticky headers and cities
            Expanded(
              child: filteredRegions.isEmpty
                  ? Center(
                      child: Text(
                        'No cities found',
                        style:
                            AppTypography.bodyM.copyWith(color: AppColors.textSecondary),
                      ),
                    )
                  : CustomScrollView(
                      controller: scrollController,
                      slivers: filteredRegions.map((region) {
                        final selectedCount = _getSelectedCountForRegion(region);
                        final isAllSelected = _isAllSelectedInRegion(region);

                        return SliverMainAxisGroup(
                          slivers: [
                            // Sticky Region Header
                            SliverPersistentHeader(
                              pinned: true,
                              delegate: _StickyRegionHeaderDelegate(
                                minHeight: 48,
                                maxHeight: 48,
                                child: Container(
                                  color: AppColors.secondary,
                                  padding: const EdgeInsets.symmetric(horizontal: 16),
                                  child: Row(
                                    children: [
                                      Expanded(
                                        child: Text(
                                          region.name,
                                          style: AppTypography.bodyL.copyWith(
                                            fontWeight: FontWeight.w600,
                                            color: AppColors.textPrimary,
                                          ),
                                        ),
                                      ),
                                      if (selectedCount > 0)
                                        Container(
                                          margin: const EdgeInsets.only(right: 12),
                                          padding: const EdgeInsets.symmetric(
                                              horizontal: 8, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: AppColors.textPrimary,
                                            borderRadius: BorderRadius.circular(10),
                                          ),
                                          child: Text(
                                            '$selectedCount',
                                            style: AppTypography.bodyS.copyWith(
                                              color: AppColors.background,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                        ),
                                      GestureDetector(
                                        onTap: () {
                                          if (isAllSelected) {
                                            _deselectAllInRegion(region);
                                          } else {
                                            _selectAllInRegion(region);
                                          }
                                        },
                                        child: Text(
                                          isAllSelected ? 'Deselect all' : 'Select all',
                                          style: AppTypography.bodyS.copyWith(
                                            color: AppColors.primary,
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                            // Cities under this region
                            SliverList(
                              delegate: SliverChildBuilderDelegate(
                                (context, index) =>
                                    _buildCityItem(region.cities[index]),
                                childCount: region.cities.length,
                              ),
                            ),
                          ],
                        );
                      }).toList(),
                    ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildCityItem(CityModel city) {
    final isSelected = _selectedIds.contains(city.id);

    return GestureDetector(
      onTap: () => _toggleCity(city.id),
      child: Container(
        color: AppColors.background,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      city.name,
                      style: AppTypography.bodyM.copyWith(
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ),
                  Container(
                    width: 22,
                    height: 22,
                    decoration: BoxDecoration(
                      color: isSelected ? AppColors.textPrimary : Colors.transparent,
                      border: Border.all(
                        color: isSelected ? AppColors.textPrimary : AppColors.textHint,
                        width: 1.5,
                      ),
                    ),
                    child: isSelected
                        ? const Center(
                            child: Icon(
                              Icons.check,
                              size: 14,
                              color: AppColors.background,
                            ),
                          )
                        : null,
                  ),
                ],
              ),
            ),
            Divider(
              height: 1,
              thickness: 1,
              color: AppColors.border.withValues(alpha: 0.3),
              indent: 16,
            ),
          ],
        ),
      ),
    );
  }
}

/// Sticky header delegate for region headers
class _StickyRegionHeaderDelegate extends SliverPersistentHeaderDelegate {
  final double minHeight;
  final double maxHeight;
  final Widget child;

  _StickyRegionHeaderDelegate({
    required this.minHeight,
    required this.maxHeight,
    required this.child,
  });

  @override
  double get minExtent => minHeight;

  @override
  double get maxExtent => maxHeight;

  @override
  Widget build(
    BuildContext context,
    double shrinkOffset,
    bool overlapsContent,
  ) {
    return SizedBox.expand(child: child);
  }

  @override
  bool shouldRebuild(_StickyRegionHeaderDelegate oldDelegate) {
    return maxHeight != oldDelegate.maxHeight ||
        minHeight != oldDelegate.minHeight ||
        child != oldDelegate.child;
  }
}
