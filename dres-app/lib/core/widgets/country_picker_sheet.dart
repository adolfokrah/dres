import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/core/services/api_service.dart';

/// Country model for the picker
class CountryItem {
  final String id;
  final String name;
  final String? code;
  final String? currencyCode;

  const CountryItem({
    required this.id,
    required this.name,
    this.code,
    this.currencyCode,
  });

  factory CountryItem.fromJson(Map<String, dynamic> json) {
    final currency = json['currency'];
    return CountryItem(
      id: json['id'] as String,
      name: json['name'] as String? ?? '',
      code: json['code'] as String?,
      currencyCode: currency is Map ? currency['code'] as String? : null,
    );
  }
}

/// Bottom sheet for selecting a country with search functionality
class CountryPickerSheet extends StatefulWidget {
  final String? selectedCountryId;

  const CountryPickerSheet({
    super.key,
    this.selectedCountryId,
  });

  /// Show the country picker bottom sheet
  static Future<CountryItem?> show(
    BuildContext context, {
    String? selectedCountryId,
  }) {
    return showModalBottomSheet<CountryItem>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.7,
      ),
      backgroundColor: AppColors.background,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.zero,
      ),
      builder: (context) => CountryPickerSheet(
        selectedCountryId: selectedCountryId,
      ),
    );
  }

  @override
  State<CountryPickerSheet> createState() => _CountryPickerSheetState();
}

class _CountryPickerSheetState extends State<CountryPickerSheet> {
  List<CountryItem> _countries = [];
  List<CountryItem> _filteredCountries = [];
  bool _isLoading = true;
  String? _error;
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadCountries();
    _searchController.addListener(_onSearchChanged);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadCountries() async {
    try {
      final apiService = getIt<ApiService>();
      final response = await apiService.get(
        '/countries?where[isActive][equals]=true&limit=100&depth=1',
      );

      if (mounted) {
        final docs = response.data['docs'] as List<dynamic>? ?? [];
        final countries = docs
            .map((c) => CountryItem.fromJson(c as Map<String, dynamic>))
            .toList();

        setState(() {
          _countries = countries;
          _filteredCountries = countries;
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
      if (query.isEmpty) {
        _filteredCountries = _countries;
      } else {
        _filteredCountries = _countries.where((country) {
          return country.name.toLowerCase().contains(query) ||
              (country.code?.toLowerCase().contains(query) ?? false);
        }).toList();
      }
    });
  }

  void _selectCountry(CountryItem country) {
    Navigator.of(context).pop(country);
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Select Country',
                  style: AppTypography.bodyL.copyWith(
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                GestureDetector(
                  onTap: () => Navigator.of(context).pop(),
                  child: PhosphorIcon(
                    PhosphorIcons.x(),
                    size: 20,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: AppColors.divider),

          // Search field
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              style: AppTypography.bodyM.copyWith(
                color: AppColors.textPrimary,
              ),
              decoration: InputDecoration(
                hintText: 'Search country...',
                hintStyle: AppTypography.bodyM.copyWith(
                  color: AppColors.textHint,
                ),
                prefixIcon: PhosphorIcon(
                  PhosphorIcons.magnifyingGlass(),
                  size: 20,
                  color: AppColors.textHint,
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.zero,
                  borderSide: BorderSide(color: AppColors.border),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.zero,
                  borderSide: BorderSide(color: AppColors.border),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.zero,
                  borderSide: BorderSide(color: AppColors.textPrimary),
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
              ),
            ),
          ),

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
              PhosphorIcon(
                PhosphorIcons.warning(),
                size: 48,
                color: AppColors.error,
              ),
              const SizedBox(height: 16),
              Text(
                'Failed to load countries',
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
                  _loadCountries();
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

    if (_filteredCountries.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Text(
            _searchController.text.isNotEmpty
                ? 'No countries found for "${_searchController.text}"'
                : 'No countries available',
            style: AppTypography.bodyL.copyWith(
              color: AppColors.textSecondary,
            ),
            textAlign: TextAlign.center,
          ),
        ),
      );
    }

    return ListView.builder(
      itemCount: _filteredCountries.length,
      itemBuilder: (context, index) {
        final country = _filteredCountries[index];
        final isSelected = widget.selectedCountryId == country.id;

        return InkWell(
          onTap: () => _selectCountry(country),
          child: Container(
            padding: const EdgeInsets.symmetric(
              horizontal: 20,
              vertical: 16,
            ),
            decoration: BoxDecoration(
              border: Border(
                bottom: BorderSide(
                  color: AppColors.divider,
                  width: 1,
                ),
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        country.name,
                        style: AppTypography.bodyM.copyWith(
                          color: AppColors.textPrimary,
                          fontWeight:
                              isSelected ? FontWeight.w600 : FontWeight.w400,
                        ),
                      ),
                      if (country.currencyCode != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          'Currency: ${country.currencyCode}',
                          style: AppTypography.caption.copyWith(
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                if (isSelected)
                  PhosphorIcon(
                    PhosphorIcons.check(),
                    size: 20,
                    color: AppColors.textPrimary,
                  ),
              ],
            ),
          ),
        );
      },
    );
  }
}
