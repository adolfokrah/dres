import 'package:flutter/material.dart';
import 'package:dres/core/widgets/app_button.dart';
import 'package:dres/core/services/storage_service.dart';
import 'package:dres/core/di/injection.dart';
import 'package:go_router/go_router.dart';
import 'package:dres/l10n/app_localizations.dart';

class AddToBagButton extends StatelessWidget {
  final String? selectedSkuId;
  final VoidCallback? onAddToBag;
  final bool isOutOfStock;

  const AddToBagButton({
    super.key,
    this.selectedSkuId,
    this.onAddToBag,
    this.isOutOfStock = false,
  });

  Future<void> _handleAddToBag(BuildContext context) async {
    final storageService = getIt<StorageService>();
    final token = await storageService.getToken();

    if (token == null || token.isEmpty) {
      // User not logged in, navigate to auth home screen
      if (context.mounted) {
        context.push('/auth');
      }
    } else {
      // User is logged in, proceed with add to bag
      onAddToBag?.call();
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return AppButton.filled(
      text: isOutOfStock ? l10n.outOfStock : l10n.addToBag,
      onPressed: isOutOfStock ? null : () => _handleAddToBag(context),
      width: double.infinity,
    );
  }
}
