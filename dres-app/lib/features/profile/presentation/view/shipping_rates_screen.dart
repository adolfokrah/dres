import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/utilities/currency_utils.dart';
import 'package:dres/core/widgets/app_button.dart';
import 'package:dres/core/widgets/app_text_field.dart';
import 'package:dres/features/profile/logic/shipping_rates_bloc/shipping_rates_bloc.dart';
import 'package:dres/features/profile/data/models/shipping_rate_model.dart';
import 'package:dres/features/cart/data/models/location_model.dart';

class ShippingRatesScreen extends StatefulWidget {
  const ShippingRatesScreen({super.key});

  @override
  State<ShippingRatesScreen> createState() => _ShippingRatesScreenState();
}

class _ShippingRatesScreenState extends State<ShippingRatesScreen> {
  late final ShippingRatesBloc _bloc;

  @override
  void initState() {
    super.initState();
    _bloc = getIt<ShippingRatesBloc>();
    _bloc.add(const ShippingRatesFetchRequested());
    // Pre-fetch cities for the user's country
    _bloc.add(const ShippingRatesCitiesFetchRequested());
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
              _buildHeader(context),
              Expanded(
                child: BlocConsumer<ShippingRatesBloc, ShippingRatesState>(
                  listener: (context, state) {
                    if (state.status == ShippingRatesStatus.deleted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Shipping rate deleted'),
                          backgroundColor: AppColors.success,
                        ),
                      );
                    }
                    if (state.status == ShippingRatesStatus.error) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(state.errorMessage ?? 'An error occurred'),
                          backgroundColor: AppColors.error,
                        ),
                      );
                    }
                  },
                  builder: (context, state) {
                    if (state.status == ShippingRatesStatus.loading) {
                      return const Center(
                        child: CircularProgressIndicator(
                          color: AppColors.textPrimary,
                        ),
                      );
                    }

                    if (state.shippingRates.isEmpty) {
                      return _buildEmptyState();
                    }

                    return _buildShippingRatesList(state.shippingRates);
                  },
                ),
              ),
              // Bottom button
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.background,
                  border: Border(
                    top: BorderSide(color: AppColors.border),
                  ),
                ),
                child: AppButton.filled(
                  text: 'Add Shipping Rate',
                  isFullWidth: true,
                  onPressed: () => _showAddEditSheet(context),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(color: AppColors.secondary, width: 1),
        ),
      ),
      child: Row(
        children: [
          GestureDetector(
            onTap: () {
              if (context.canPop()) {
                context.pop();
              } else {
                context.go('/profile');
              }
            },
            child: PhosphorIcon(
              PhosphorIcons.caretLeft(),
              size: 16,
              color: AppColors.textPrimary,
            ),
          ),
          Expanded(
            child: Text(
              'Shipping Rates',
              style: AppTypography.bodyL.copyWith(color: AppColors.textPrimary),
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(width: 32),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            PhosphorIcon(
              PhosphorIcons.truck(),
              size: 64,
              color: AppColors.textHint,
            ),
            const SizedBox(height: 16),
            Text(
              'No shipping rates yet',
              style: AppTypography.titleLM.copyWith(color: AppColors.textPrimary),
            ),
            const SizedBox(height: 8),
            Text(
              'Add shipping rates to let buyers know how much delivery costs to their city.',
              style: AppTypography.bodyM.copyWith(color: AppColors.textSecondary),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildShippingRatesList(List<ShippingRateModel> rates) {
    return ListView.builder(
      padding: EdgeInsets.zero,
      itemCount: rates.length,
      itemBuilder: (context, index) {
        final rate = rates[index];
        return _buildShippingRateItem(rate);
      },
    );
  }

  Widget _buildShippingRateItem(ShippingRateModel rate) {
    return Dismissible(
      key: Key(rate.id),
      direction: DismissDirection.endToStart,
      background: Container(
        color: AppColors.error,
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        child: PhosphorIcon(
          PhosphorIcons.trash(),
          size: 24,
          color: Colors.white,
        ),
      ),
      confirmDismiss: (direction) async {
        return await _confirmDelete(rate);
      },
      onDismissed: (direction) {
        _bloc.add(ShippingRateDeleteRequested(id: rate.id));
      },
      child: GestureDetector(
        onTap: () => _showAddEditSheet(context, rate: rate),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          decoration: BoxDecoration(
            color: AppColors.background,
            border: Border(
              bottom: BorderSide(color: AppColors.secondary, width: 1),
            ),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Truck icon
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppColors.secondary,
                  border: Border.all(color: AppColors.border),
                ),
                child: Center(
                  child: PhosphorIcon(
                    PhosphorIcons.truck(),
                    size: 20,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              
              // Content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Cities
                    Text(
                      rate.citiesDisplay,
                      style: AppTypography.bodyM.copyWith(
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    
                    // Price row
                    Row(
                      children: [
                        Text(
                          '${CurrencyUtils.currentSymbol} ${rate.deliveryCost.toStringAsFixed(0)}',
                          style: AppTypography.bodyL.copyWith(
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        if (rate.freeShippingThreshold != null) ...[
                          const SizedBox(width: 8),
                          Text(
                            '•',
                            style: AppTypography.bodyS.copyWith(
                              color: AppColors.textHint,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'Free over ${CurrencyUtils.currentSymbol} ${rate.freeShippingThreshold!.toStringAsFixed(0)}',
                            style: AppTypography.bodyS.copyWith(
                              color: AppColors.success,
                            ),
                          ),
                        ],
                      ],
                    ),
                    
                    // Inactive badge
                    if (!rate.isActive) ...[
                      const SizedBox(height: 6),
                      Text(
                        'Inactive',
                        style: AppTypography.bodyS.copyWith(
                          color: AppColors.error,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              
              // Chevron
              PhosphorIcon(
                PhosphorIcons.caretRight(),
                size: 16,
                color: AppColors.textHint,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<bool> _confirmDelete(ShippingRateModel rate) async {
    return await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
        backgroundColor: AppColors.surface,
        title: Text(
          'Delete Shipping Rate',
          style: AppTypography.titleLM.copyWith(color: AppColors.textPrimary),
        ),
        content: Text(
          'Are you sure you want to delete this shipping rate?',
          style: AppTypography.bodyM.copyWith(color: AppColors.textPrimary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: Text(
              'Cancel',
              style: AppTypography.bodyM.copyWith(color: AppColors.textSecondary),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: Text(
              'Delete',
              style: AppTypography.bodyM.copyWith(color: AppColors.error),
            ),
          ),
        ],
      ),
    ) ?? false;
  }

  void _showAddEditSheet(BuildContext context, {ShippingRateModel? rate}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.background,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
      builder: (sheetContext) => BlocProvider.value(
        value: _bloc,
        child: _ShippingRateFormSheet(rate: rate),
      ),
    );
  }
}

class _ShippingRateFormSheet extends StatefulWidget {
  final ShippingRateModel? rate;

  const _ShippingRateFormSheet({this.rate});

  @override
  State<_ShippingRateFormSheet> createState() => _ShippingRateFormSheetState();
}

class _ShippingRateFormSheetState extends State<_ShippingRateFormSheet> {
  final _deliveryCostController = TextEditingController();
  final _freeShippingController = TextEditingController();

  Set<String> _selectedCityIds = {};
  List<CityModel> _selectedCities = [];
  bool _isEditing = false;

  @override
  void initState() {
    super.initState();
    _isEditing = widget.rate != null;

    if (_isEditing) {
      _deliveryCostController.text = widget.rate!.deliveryCost.toStringAsFixed(2);
      if (widget.rate!.freeShippingThreshold != null) {
        _freeShippingController.text = widget.rate!.freeShippingThreshold!.toStringAsFixed(2);
      }
      _selectedCityIds = widget.rate!.cities.map((c) => c.id).toSet();
      _selectedCities = List.from(widget.rate!.cities);
    }
    // Cities are pre-fetched on screen load
  }

  @override
  void dispose() {
    _deliveryCostController.dispose();
    _freeShippingController.dispose();
    super.dispose();
  }

  void _openCitySelector() {
    final state = context.read<ShippingRatesBloc>().state;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.background,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
      builder: (sheetContext) => _CitySelectionSheet(
        allCities: state.allCities,
        regions: state.regions,
        selectedCityIds: _selectedCityIds,
        onSelectionChanged: (ids, cities) {
          setState(() {
            _selectedCityIds = ids;
            _selectedCities = cities;
          });
        },
      ),
    );
  }

  void _onSave() {
    final deliveryCost = double.tryParse(_deliveryCostController.text);
    if (deliveryCost == null || deliveryCost <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter a valid delivery cost'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    if (_selectedCityIds.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select at least one city'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    final freeShipping = double.tryParse(_freeShippingController.text);

    if (_isEditing) {
      context.read<ShippingRatesBloc>().add(ShippingRateUpdateRequested(
            id: widget.rate!.id,
            cityIds: _selectedCityIds.toList(),
            deliveryCost: deliveryCost,
            freeShippingThreshold: freeShipping,
          ));
    } else {
      context.read<ShippingRatesBloc>().add(ShippingRateCreateRequested(
            cityIds: _selectedCityIds.toList(),
            deliveryCost: deliveryCost,
            freeShippingThreshold: freeShipping,
          ));
    }

    Navigator.pop(context);
  }

  String get _selectedCitiesDisplay {
    if (_selectedCities.isEmpty) return 'Select cities';
    if (_selectedCities.length == 1) return _selectedCities.first.name;
    if (_selectedCities.length <= 2) {
      return _selectedCities.map((c) => c.name).join(', ');
    }
    return '${_selectedCities.take(2).map((c) => c.name).join(', ')} +${_selectedCities.length - 2} more';
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<ShippingRatesBloc, ShippingRatesState>(
      builder: (context, state) {
        final isLoadingCities = state.status == ShippingRatesStatus.loadingCities;

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
                        child: PhosphorIcon(
                          PhosphorIcons.x(),
                          size: 20,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      Text(
                        _isEditing ? 'Edit Shipping Rate' : 'Add Shipping Rate',
                        style: AppTypography.bodyL.copyWith(color: AppColors.textPrimary),
                      ),
                      const SizedBox(width: 20),
                    ],
                  ),
                ),

                Expanded(
                  child: ListView(
                    controller: scrollController,
                    padding: const EdgeInsets.all(20),
                    children: [
                      // Cities selection - tappable list item
                      Text(
                        'Cities',
                        style: AppTypography.bodyM.copyWith(
                          fontWeight: FontWeight.w500,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 8),
                      GestureDetector(
                        onTap: isLoadingCities ? null : _openCitySelector,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                          decoration: BoxDecoration(
                            border: Border.all(color: AppColors.border),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: isLoadingCities
                                    ? Row(
                                        children: [
                                          const SizedBox(
                                            width: 16,
                                            height: 16,
                                            child: CircularProgressIndicator(
                                              strokeWidth: 2,
                                              color: AppColors.textHint,
                                            ),
                                          ),
                                          const SizedBox(width: 12),
                                          Text(
                                            'Loading cities...',
                                            style: AppTypography.bodyM.copyWith(color: AppColors.textHint),
                                          ),
                                        ],
                                      )
                                    : Text(
                                        _selectedCitiesDisplay,
                                        style: AppTypography.bodyM.copyWith(
                                          color: _selectedCities.isEmpty
                                              ? AppColors.textHint
                                              : AppColors.textPrimary,
                                        ),
                                      ),
                              ),
                              PhosphorIcon(
                                PhosphorIcons.caretRight(),
                                size: 16,
                                color: AppColors.textSecondary,
                              ),
                            ],
                          ),
                        ),
                      ),

                      const SizedBox(height: 20),

                      // Delivery cost
                      AppTextField(
                        controller: _deliveryCostController,
                        label: 'Delivery Cost',
                        hintText: '${CurrencyUtils.currentSymbol} 0.00',
                        keyboardType: TextInputType.number,
                      ),

                      const SizedBox(height: 20),

                      // Free shipping threshold
                      AppTextField(
                        controller: _freeShippingController,
                        label: 'Free Shipping Threshold (optional)',
                        hintText: '${CurrencyUtils.currentSymbol} 0.00',
                        keyboardType: TextInputType.number,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Orders above this amount get free shipping',
                        style: AppTypography.bodyS.copyWith(color: AppColors.textSecondary),
                      ),

                      const SizedBox(height: 40),
                    ],
                  ),
                ),
                
                // Save button
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: AppColors.background,
                    border: Border(
                      top: BorderSide(color: AppColors.border),
                    ),
                  ),
                  child: AppButton.filled(
                    text: _isEditing ? 'Save Changes' : 'Add Shipping Rate',
                    isFullWidth: true,
                    onPressed: _onSave,
                  ),
                ),
              ],
            );
          },
        );
      },
    );
  }
}

/// City selection sheet with multi-select using wrapped chips
class _CitySelectionSheet extends StatefulWidget {
  final List<CityModel> allCities;
  final List<RegionModel> regions;
  final Set<String> selectedCityIds;
  final void Function(Set<String> ids, List<CityModel> cities) onSelectionChanged;

  const _CitySelectionSheet({
    required this.allCities,
    required this.regions,
    required this.selectedCityIds,
    required this.onSelectionChanged,
  });

  @override
  State<_CitySelectionSheet> createState() => _CitySelectionSheetState();
}

class _CitySelectionSheetState extends State<_CitySelectionSheet> {
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
                      style: AppTypography.bodyM.copyWith(color: AppColors.textSecondary),
                    ),
                  ),
                  Text(
                    'Select Cities',
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
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                ),
                onChanged: (value) {
                  setState(() {
                    _searchQuery = value;
                  });
                },
              ),
            ),

            // Regions with sticky headers and cities
            Expanded(
              child: filteredRegions.isEmpty
                  ? Center(
                      child: Text(
                        'No cities found',
                        style: AppTypography.bodyM.copyWith(color: AppColors.textSecondary),
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
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
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
                                (context, index) => _buildCityItem(region.cities[index]),
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
