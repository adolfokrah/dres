import 'package:equatable/equatable.dart';
import 'package:dres/features/search/data/models/search_models.dart';

enum SearchStatus { initial, loading, success, failure }

class SearchState extends Equatable {
  final SearchStatus status;
  final String query;
  final int currentTab; // 0 = Items, 1 = Sellers
  final List<ItemSearchResult> itemResults;
  final List<BrandSearchResult> brandResults;
  final List<SellerSearchResult> sellerResults;
  final String? errorMessage;

  const SearchState({
    this.status = SearchStatus.initial,
    this.query = '',
    this.currentTab = 0,
    this.itemResults = const [],
    this.brandResults = const [],
    this.sellerResults = const [],
    this.errorMessage,
  });

  bool get hasQuery => query.isNotEmpty;
  bool get isItemsTab => currentTab == 0;
  bool get isSellersTab => currentTab == 1;

  SearchState copyWith({
    SearchStatus? status,
    String? query,
    int? currentTab,
    List<ItemSearchResult>? itemResults,
    List<BrandSearchResult>? brandResults,
    List<SellerSearchResult>? sellerResults,
    String? errorMessage,
  }) {
    return SearchState(
      status: status ?? this.status,
      query: query ?? this.query,
      currentTab: currentTab ?? this.currentTab,
      itemResults: itemResults ?? this.itemResults,
      brandResults: brandResults ?? this.brandResults,
      sellerResults: sellerResults ?? this.sellerResults,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }

  @override
  List<Object?> get props => [
        status,
        query,
        currentTab,
        itemResults,
        brandResults,
        sellerResults,
        errorMessage,
      ];
}
