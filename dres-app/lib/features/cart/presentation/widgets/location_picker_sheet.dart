import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/app_search_input.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/features/cart/data/repositories/location_repository.dart';

/// Bottom sheet for selecting a city/location grouped by region
class LocationPickerSheet extends StatefulWidget {
  final CityModel? selectedCity;

  const LocationPickerSheet({
    super.key,
    this.selectedCity,
  });

  /// Show the location picker bottom sheet
  static Future<CityModel?> show(BuildContext context, {CityModel? selectedCity}) {
    return showModalBottomSheet<CityModel>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.9,
      ),
      backgroundColor: AppColors.background,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.zero,
      ),
      builder: (context) => LocationPickerSheet(selectedCity: selectedCity),
    );
  }

  @override
  State<LocationPickerSheet> createState() => _LocationPickerSheetState();
}

class _LocationPickerSheetState extends State<LocationPickerSheet> {
  RegionsByCountryResponse? _data;
  List<CityModel> _filteredCities = [];
  bool _isLoading = true;
  bool _isSearching = false;
  String? _error;
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadData();
    _searchController.addListener(_onSearchChanged);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    try {
      final repository = LocationRepository(apiService: getIt());
      final data = await repository.getRegionsWithCities();
      
      if (mounted) {
        setState(() {
          _data = data;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  void _onSearchChanged() {
    final query = _searchController.text.toLowerCase().trim();
    setState(() {
      _isSearching = query.isNotEmpty;
      if (_isSearching && _data != null) {
        _filteredCities = _data!.allCities.where((city) {
          return city.name.toLowerCase().contains(query) ||
              (city.regionName?.toLowerCase().contains(query) ?? false);
        }).toList();
      }
    });
  }

  void _selectCity(CityModel city) {
    Navigator.of(context).pop(city);
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle bar
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.border,
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Select Location',
                  style: AppTypography.bodyL.copyWith(
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                GestureDetector(
                  onTap: () => Navigator.of(context).pop(),
                  child: Icon(
                    PhosphorIcons.x(),
                    size: 24,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          ),

          // Search field
          AppSearchInput(
            controller: _searchController,
            hintText: 'Search city...',
            padding: const EdgeInsets.symmetric(horizontal: 20),
            onChanged: (_) => _onSearchChanged(),
          ),

          const SizedBox(height: 16),

          // Content
          Expanded(
            child: _buildContent(),
          ),
        ],
      ),
    );
  }

  Widget _buildContent() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                PhosphorIcons.warning(),
                size: 48,
                color: AppColors.error,
              ),
              const SizedBox(height: 16),
              Text(
                'Failed to load locations',
                style: AppTypography.bodyL.copyWith(
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              GestureDetector(
                onTap: () {
                  setState(() {
                    _isLoading = true;
                    _error = null;
                  });
                  _loadData();
                },
                child: Text(
                  'Tap to retry',
                  style: AppTypography.bodyM.copyWith(
                    color: AppColors.textSecondary,
                    decoration: TextDecoration.underline,
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (_data == null || _data!.totalCities == 0) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Text(
            'No cities available',
            style: AppTypography.bodyL.copyWith(
              color: AppColors.textSecondary,
            ),
            textAlign: TextAlign.center,
          ),
        ),
      );
    }

    // Show flat search results when searching
    if (_isSearching) {
      return _buildSearchResults();
    }

    // Show grouped by region when not searching
    return _buildGroupedList();
  }

  Widget _buildSearchResults() {
    if (_filteredCities.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Text(
            'No cities found for "${_searchController.text}"',
            style: AppTypography.bodyL.copyWith(
              color: AppColors.textSecondary,
            ),
            textAlign: TextAlign.center,
          ),
        ),
      );
    }

    return ListView.builder(
      itemCount: _filteredCities.length,
      itemBuilder: (context, index) {
        final city = _filteredCities[index];
        return _buildCityTile(city);
      },
    );
  }

  Widget _buildGroupedList() {
    return CustomScrollView(
      slivers: [
        for (final region in _data!.regions)
          if (region.cities.isNotEmpty)
            SliverMainAxisGroup(
              slivers: [
                // Sticky Region Header
                SliverPersistentHeader(
                  pinned: true,
                  delegate: _StickyRegionHeaderDelegate(
                    regionName: region.name,
                  ),
                ),
                // Cities under this region
                SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) => _buildCityTile(region.cities[index]),
                    childCount: region.cities.length,
                  ),
                ),
              ],
            ),
        // Cities without region at the end
        if (_data!.citiesWithoutRegion.isNotEmpty)
          SliverMainAxisGroup(
            slivers: [
              SliverPersistentHeader(
                pinned: true,
                delegate: _StickyRegionHeaderDelegate(
                  regionName: 'Other',
                ),
              ),
              SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) => _buildCityTile(_data!.citiesWithoutRegion[index]),
                  childCount: _data!.citiesWithoutRegion.length,
                ),
              ),
            ],
          ),
      ],
    );
  }

  Widget _buildCityTile(CityModel city) {
    final isSelected = widget.selectedCity?.id == city.id;

    return GestureDetector(
      onTap: () => _selectCity(city),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.secondary : AppColors.background,
          border: const Border(
            bottom: BorderSide(
              color: AppColors.secondary,
              width: 1,
            ),
          ),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                city.name,
                style: AppTypography.bodyL.copyWith(
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w400,
                  color: AppColors.textPrimary,
                ),
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

/// Delegate for sticky region headers
class _StickyRegionHeaderDelegate extends SliverPersistentHeaderDelegate {
  final String regionName;

  _StickyRegionHeaderDelegate({
    required this.regionName,
  });

  @override
  double get minExtent => 44;

  @override
  double get maxExtent => 44;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      width: double.infinity,
      height: 44,
      padding: const EdgeInsets.symmetric(horizontal: 20),
      alignment: Alignment.centerLeft,
      decoration: BoxDecoration(
        color: AppColors.secondary,
        boxShadow: overlapsContent
            ? [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ]
            : null,
      ),
      child: Text(
        regionName,
        style: AppTypography.bodyM.copyWith(
          fontWeight: FontWeight.w700,
          color: AppColors.textPrimary,
        ),
      ),
    );
  }

  @override
  bool shouldRebuild(covariant _StickyRegionHeaderDelegate oldDelegate) {
    return regionName != oldDelegate.regionName;
  }
}
