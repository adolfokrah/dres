import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/unified_header.dart';
import 'package:dres/core/widgets/app_button.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/features/sell/data/repositories/boost_tiers_repository.dart';
import 'package:dres/features/sell/data/models/boost_tier_model.dart';
import 'package:dres/features/payment/presentation/view/payment_screen.dart';

class BoostStyleScreen extends StatefulWidget {
  final String styleId;
  final String? styleTitle;

  const BoostStyleScreen({
    super.key,
    required this.styleId,
    this.styleTitle,
  });

  @override
  State<BoostStyleScreen> createState() => _BoostStyleScreenState();
}

class _BoostStyleScreenState extends State<BoostStyleScreen> {
  late final BoostTiersRepository _boostTiersRepository;
  
  List<BoostTierModel> _tiers = [];
  String? _selectedTierId;
  String _currencySymbol = '₵';
  bool _isLoading = true;
  bool _isProcessingPayment = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _boostTiersRepository = getIt<BoostTiersRepository>();
    _loadTiers();
  }

  Future<void> _loadTiers() async {
    try {
      final response = await _boostTiersRepository.getActiveBoostTiers();
      if (!mounted) return;
      setState(() {
        _tiers = response.tiers;
        _currencySymbol = response.currencySymbol;
        _selectedTierId = response.tiers.isNotEmpty ? response.tiers.first.id : null;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = 'Failed to load boost tiers';
        _isLoading = false;
      });
    }
  }

  BoostTierModel? get _selectedTier {
    if (_selectedTierId == null || _tiers.isEmpty) return null;
    try {
      return _tiers.firstWhere((t) => t.id == _selectedTierId);
    } catch (_) {
      return _tiers.isNotEmpty ? _tiers.first : null;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            const UnifiedHeader.simple(title: 'Boost Your Listing'),
            Expanded(
              child: _isLoading
                  ? const Center(
                      child: CircularProgressIndicator(
                        color: AppColors.textPrimary,
                      ),
                    )
                  : _error != null
                      ? Center(
                          child: Text(
                            _error!,
                            style: AppTypography.bodyM.copyWith(
                              color: AppColors.textSecondary,
                            ),
                          ),
                        )
                      : SingleChildScrollView(
                          child: Padding(
                            padding: const EdgeInsets.all(20),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Header section
                                _buildHeaderSection(),
                                const SizedBox(height: 24),

                                // Benefits section
                                _buildBenefitsSection(),
                                const SizedBox(height: 24),

                                // Tier selection
                                Text(
                                  'Choose Your Plan',
                                  style: AppTypography.titleLM.copyWith(
                                    color: AppColors.textPrimary,
                                  ),
                                ),
                                const SizedBox(height: 16),

                                // Tier cards
                                ..._tiers.map((tier) => Padding(
                                      padding: const EdgeInsets.only(bottom: 12),
                                      child: _buildTierCard(tier),
                                    )),

                                const SizedBox(height: 24),
                              ],
                            ),
                          ),
                        ),
            ),

            // Bottom button
            if (!_isLoading && _error == null) _buildBottomButton(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeaderSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: PhosphorIcon(
                PhosphorIcons.rocketLaunch(),
                color: AppColors.primary,
                size: 32,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Get More Eyes On Your Listing',
                    style: AppTypography.titleLM.copyWith(
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Boosted listings sell up to 3x faster',
                    style: AppTypography.bodyM.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildBenefitsSection() {
    final benefits = [
      _BenefitItem(
        icon: PhosphorIcons.eye(),
        title: 'Increased Visibility',
        description: 'Your listing appears in premium spots across the app',
      ),
      _BenefitItem(
        icon: PhosphorIcons.lightning(),
        title: 'Sell Faster',
        description: 'Boosted items get more views and sell quicker',
      ),
      _BenefitItem(
        icon: PhosphorIcons.star(),
        title: '"We Love" Badge',
        description: 'Stand out with a special badge on your listing',
      ),
      _BenefitItem(
        icon: PhosphorIcons.magnifyingGlass(),
        title: 'Search Priority',
        description: 'Appear higher in search results and recommendations',
      ),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Why Boost?',
          style: AppTypography.titleLM.copyWith(
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 12),
        ...benefits.map((benefit) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.secondary,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: PhosphorIcon(
                      benefit.icon,
                      color: AppColors.textPrimary,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          benefit.title,
                          style: AppTypography.bodyM.copyWith(
                            fontWeight: FontWeight.w600,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        Text(
                          benefit.description,
                          style: AppTypography.bodyS.copyWith(
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            )),
      ],
    );
  }

  Widget _buildTierCard(BoostTierModel tier) {
    final isSelected = _selectedTierId == tier.id;

    return GestureDetector(
      onTap: () => setState(() => _selectedTierId = tier.id),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary.withOpacity(0.05) : AppColors.surface,
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.secondary,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                // Radio indicator
                Container(
                  width: 24,
                  height: 24,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isSelected ? AppColors.primary : AppColors.textSecondary,
                      width: 2,
                    ),
                  ),
                  child: isSelected
                      ? Center(
                          child: Container(
                            width: 12,
                            height: 12,
                            decoration: const BoxDecoration(
                              shape: BoxShape.circle,
                              color: AppColors.primary,
                            ),
                          ),
                        )
                      : null,
                ),
                const SizedBox(width: 12),

                // Tier name and duration
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            tier.name,
                            style: AppTypography.bodyL.copyWith(
                              fontWeight: FontWeight.w700,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          if (tier.isPopular) ...[
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: AppColors.primary,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                'POPULAR',
                                style: AppTypography.bodyXS.copyWith(
                                  color: AppColors.surface,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      Text(
                        tier.durationText,
                        style: AppTypography.bodyS.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),

                // Price
                Text(
                  '$_currencySymbol${tier.price.toStringAsFixed(2)}',
                  style: AppTypography.titleLM.copyWith(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),

            // Features
            if (isSelected && tier.benefits.isNotEmpty) ...[
              const SizedBox(height: 12),
              const Divider(color: AppColors.secondary),
              const SizedBox(height: 8),
              ...tier.benefits.map((feature) => Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Row(
                      children: [
                        PhosphorIcon(
                          PhosphorIcons.check(),
                          color: AppColors.success,
                          size: 16,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            feature,
                            style: AppTypography.bodyS.copyWith(
                              color: AppColors.textPrimary,
                            ),
                          ),
                        ),
                      ],
                    ),
                  )),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildBottomButton() {
    final tier = _selectedTier;
    if (tier == null) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(
          top: BorderSide(color: AppColors.secondary, width: 1),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Total',
                style: AppTypography.bodyL.copyWith(
                  color: AppColors.textPrimary,
                ),
              ),
              Text(
                '$_currencySymbol${tier.price.toStringAsFixed(2)}',
                style: AppTypography.titleLM.copyWith(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: AppButton.filled(
              text: _isProcessingPayment ? 'Processing...' : 'Boost Now',
              onPressed: _isProcessingPayment ? null : _onBoostPressed,
            ),
          ),
        ],
      ),
    );
  }

  void _onBoostPressed() async {
    final tier = _selectedTier;
    if (tier == null) return;

    // Prevent double-taps
    if (_isProcessingPayment) return;

    setState(() {
      _isProcessingPayment = true;
    });

    try {
      // Initiate boost payment
      final response = await _boostTiersRepository.initiateBoostPayment(
        styleId: widget.styleId,
        tierId: tier.id,
      );

      if (!mounted) return;

      if (!response.success || response.paymentUrl == null || response.transactionId == null) {
        // Show error
        setState(() {
          _isProcessingPayment = false;
        });
        _showErrorDialog(response.error ?? response.message);
        return;
      }

      setState(() {
        _isProcessingPayment = false;
      });

      // Open payment screen
      final result = await openPaymentScreen(
        context,
        paymentUrl: response.paymentUrl!,
        transactionId: response.transactionId!,
        title: 'Pay for ${tier.name} Boost',
      );

      if (!mounted) return;

      // Handle result
      if (result == PaymentResult.success) {
        // Payment successful - show success and go back
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Boost activated! Your ${widget.styleTitle ?? 'style'} is now boosted for ${tier.duration} days.'),
            backgroundColor: AppColors.success,
          ),
        );
        // Go back to style details with result=true to trigger refetch
        context.pop(true);
      } else if (result == PaymentResult.failed) {
        // Payment failed
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Payment failed. Please try again.'),
            backgroundColor: AppColors.error,
          ),
        );
      } else {
        // User closed manually - just show info
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Payment was not completed. You can try again later.'),
            backgroundColor: AppColors.warning,
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isProcessingPayment = false;
      });
      _showErrorDialog('An error occurred. Please try again.');
    }
  }

  void _showErrorDialog(String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
        backgroundColor: AppColors.surface,
        title: Text(
          'Error',
          style: AppTypography.titleLM.copyWith(color: AppColors.textPrimary),
        ),
        content: Text(
          message,
          style: AppTypography.bodyM.copyWith(color: AppColors.textPrimary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text(
              'OK',
              style: AppTypography.bodyM.copyWith(
                color: AppColors.primary,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _BenefitItem {
  final IconData icon;
  final String title;
  final String description;

  const _BenefitItem({
    required this.icon,
    required this.title,
    required this.description,
  });
}
