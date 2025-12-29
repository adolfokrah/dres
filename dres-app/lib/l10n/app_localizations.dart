import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[Locale('en')];

  /// The app name
  ///
  /// In en, this message translates to:
  /// **'DRES'**
  String get appName;

  /// Tagline shown on splash screen
  ///
  /// In en, this message translates to:
  /// **'Buy & Sell Fashion, Made\nEasy'**
  String get splashTagline;

  /// Login button text
  ///
  /// In en, this message translates to:
  /// **'Login'**
  String get login;

  /// Sign up button text
  ///
  /// In en, this message translates to:
  /// **'Sign Up'**
  String get signUp;

  /// Email label
  ///
  /// In en, this message translates to:
  /// **'Email'**
  String get email;

  /// Password label
  ///
  /// In en, this message translates to:
  /// **'Password'**
  String get password;

  /// Forgot password link text
  ///
  /// In en, this message translates to:
  /// **'Forgotten password?'**
  String get forgotPassword;

  /// We Love promo card title
  ///
  /// In en, this message translates to:
  /// **'We Love'**
  String get weLove;

  /// Continue with Google button text
  ///
  /// In en, this message translates to:
  /// **'Continue with Google'**
  String get continueWithGoogle;

  /// Continue with Apple button text
  ///
  /// In en, this message translates to:
  /// **'Continue with Apple'**
  String get continueWithApple;

  /// Divider text for social login
  ///
  /// In en, this message translates to:
  /// **'Or continue with'**
  String get orContinueWith;

  /// Home tab label
  ///
  /// In en, this message translates to:
  /// **'Home'**
  String get home;

  /// Search tab label
  ///
  /// In en, this message translates to:
  /// **'Search'**
  String get search;

  /// Sell tab label
  ///
  /// In en, this message translates to:
  /// **'Sell'**
  String get sell;

  /// Inbox tab label
  ///
  /// In en, this message translates to:
  /// **'Inbox'**
  String get inbox;

  /// Profile tab label
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get profile;

  /// Search bar placeholder text
  ///
  /// In en, this message translates to:
  /// **'Search for items, members'**
  String get searchPlaceholder;

  /// Discover tab label
  ///
  /// In en, this message translates to:
  /// **'Discover'**
  String get discover;

  /// Favourite tab label
  ///
  /// In en, this message translates to:
  /// **'Favourite'**
  String get favourite;

  /// Me/Profile tab label
  ///
  /// In en, this message translates to:
  /// **'Me'**
  String get me;

  /// Shop tab label
  ///
  /// In en, this message translates to:
  /// **'Shop'**
  String get shop;

  /// Favorites tab label
  ///
  /// In en, this message translates to:
  /// **'Favorites'**
  String get favorites;

  /// First time promo banner title
  ///
  /// In en, this message translates to:
  /// **'First time?'**
  String get firstTimeTitle;

  /// First time promo banner description
  ///
  /// In en, this message translates to:
  /// **'Shop: 10% off with code WELCOMEVC. SELL: NO FEES TO START.*'**
  String get firstTimeDescription;

  /// Get started button text
  ///
  /// In en, this message translates to:
  /// **'Get started'**
  String get getStarted;

  /// Error message when menu fails to load
  ///
  /// In en, this message translates to:
  /// **'Failed to load menu'**
  String get failedToLoadMenu;

  /// Pull to refresh hint text
  ///
  /// In en, this message translates to:
  /// **'Pull to refresh'**
  String get pullToRefresh;

  /// Message when department has no collections
  ///
  /// In en, this message translates to:
  /// **'No collections available'**
  String get noCollectionsAvailable;

  /// New arrivals promo card title
  ///
  /// In en, this message translates to:
  /// **'New Arrivals for you'**
  String get newArrivalsForYou;

  /// New arrivals promo card subtitle
  ///
  /// In en, this message translates to:
  /// **'A daily drop, personalized for you'**
  String get dailyDropPersonalized;

  /// Designers promo card title
  ///
  /// In en, this message translates to:
  /// **'Designers'**
  String get designers;

  /// Designers promo card subtitle
  ///
  /// In en, this message translates to:
  /// **'A-Z of brand and official partners'**
  String get azOfBrands;

  /// We Love promo card subtitle
  ///
  /// In en, this message translates to:
  /// **'The style team\'s top picks'**
  String get styleTeamTopPicks;

  /// On Sale promo card title
  ///
  /// In en, this message translates to:
  /// **'On Sale'**
  String get onSale;

  /// On Sale promo card subtitle
  ///
  /// In en, this message translates to:
  /// **'Our Finest deals'**
  String get finestDeals;

  /// Sort option - Latest
  ///
  /// In en, this message translates to:
  /// **'Latest'**
  String get latest;

  /// Sort option - Oldest
  ///
  /// In en, this message translates to:
  /// **'Oldest'**
  String get oldest;

  /// Price filter option - Any
  ///
  /// In en, this message translates to:
  /// **'Price Any'**
  String get priceAny;

  /// Price filter option - Low to High
  ///
  /// In en, this message translates to:
  /// **'Price Low to High'**
  String get priceLowToHigh;

  /// Price filter option - High to Low
  ///
  /// In en, this message translates to:
  /// **'Price High to Low'**
  String get priceHighToLow;

  /// Price range filter label
  ///
  /// In en, this message translates to:
  /// **'Price Range'**
  String get priceRange;

  /// Minimum price input label
  ///
  /// In en, this message translates to:
  /// **'Min Price'**
  String get minPrice;

  /// Maximum price input label
  ///
  /// In en, this message translates to:
  /// **'Max Price'**
  String get maxPrice;

  /// Apply button text
  ///
  /// In en, this message translates to:
  /// **'Apply'**
  String get apply;

  /// Reset button text
  ///
  /// In en, this message translates to:
  /// **'Reset'**
  String get reset;

  /// Empty state title when no products found
  ///
  /// In en, this message translates to:
  /// **'No Products Found'**
  String get noProductsFound;

  /// Empty state message when no products found
  ///
  /// In en, this message translates to:
  /// **'Try adjusting your filters or search\nto find what you\'re looking for'**
  String get tryAdjustingFilters;

  /// Error message when products fail to load
  ///
  /// In en, this message translates to:
  /// **'Failed to load products'**
  String get failedToLoadProducts;

  /// Retry button text
  ///
  /// In en, this message translates to:
  /// **'Retry'**
  String get retry;

  /// Sort filter header
  ///
  /// In en, this message translates to:
  /// **'Sort'**
  String get sort;

  /// Price filter header
  ///
  /// In en, this message translates to:
  /// **'Price'**
  String get price;

  /// Free listing or returns accordion title
  ///
  /// In en, this message translates to:
  /// **'FREE LISTING OR RETURNS'**
  String get freeListingOrReturns;

  /// Free relisting section title
  ///
  /// In en, this message translates to:
  /// **'Free Relisting'**
  String get freeRelisting;

  /// Free relisting description text
  ///
  /// In en, this message translates to:
  /// **'Relisting is free if there\'s a problem with the item. Eligible reasons (report within 6 hours):'**
  String get freeRelistingDescription;

  /// Wrong item sent reason
  ///
  /// In en, this message translates to:
  /// **'Wrong item sent'**
  String get wrongItemSent;

  /// Fake or not authentic reason
  ///
  /// In en, this message translates to:
  /// **'Fake / not authentic'**
  String get fakeNotAuthentic;

  /// Item arrived damaged reason
  ///
  /// In en, this message translates to:
  /// **'Item arrived damaged'**
  String get itemArrivedDamaged;

  /// Free returns section title
  ///
  /// In en, this message translates to:
  /// **'Free Returns (Buyer Protection)'**
  String get freeReturnsBuyerProtection;

  /// Free returns description text
  ///
  /// In en, this message translates to:
  /// **'If you add the Buyer Protection Fee to this item, you can return the item for a full refund and we\'ll cover the return delivery cost.'**
  String get freeReturnsDescription;

  /// 6 hours return policy
  ///
  /// In en, this message translates to:
  /// **'Return issues must be reported within 6 hours'**
  String get returnIssues48Hours;

  /// Return delivery coverage text
  ///
  /// In en, this message translates to:
  /// **'We cover the return delivery to the seller'**
  String get weCoverReturnDelivery;

  /// Buyer protection fee checkbox title
  ///
  /// In en, this message translates to:
  /// **'Include Buyer Protection Fee'**
  String get includeBuyerProtectionFee;

  /// Buyer protection description text
  ///
  /// In en, this message translates to:
  /// **'Our Buyer Protection is a value added optional service to every purchase you make. Buyer Protection includes our Refund Policy.'**
  String get buyerProtectionDescription;

  /// Learn more link text
  ///
  /// In en, this message translates to:
  /// **'Learn more'**
  String get learnMore;

  /// Follow button text
  ///
  /// In en, this message translates to:
  /// **'Follow'**
  String get follow;

  /// Usually ships in text
  ///
  /// In en, this message translates to:
  /// **'Usually ships in {hours}'**
  String usuallyShipsIn(String hours);

  /// Sales history section title
  ///
  /// In en, this message translates to:
  /// **'Sales history'**
  String get salesHistory;

  /// Items sold label
  ///
  /// In en, this message translates to:
  /// **'Items sold'**
  String get itemsSold;

  /// Shipped label
  ///
  /// In en, this message translates to:
  /// **'Shipped'**
  String get shipped;

  /// Cancelled label
  ///
  /// In en, this message translates to:
  /// **'Cancelled'**
  String get cancelled;

  /// Similar products section title
  ///
  /// In en, this message translates to:
  /// **'You may also like'**
  String get youMayAlsoLike;

  /// Add to bag button text
  ///
  /// In en, this message translates to:
  /// **'Add to bag'**
  String get addToBag;

  /// Auth home registration prompt
  ///
  /// In en, this message translates to:
  /// **'Register today for a special discount off your first purchase'**
  String get registerDiscount;

  /// Register with email button text
  ///
  /// In en, this message translates to:
  /// **'Register with Email'**
  String get registerWithEmail;

  /// Login link text
  ///
  /// In en, this message translates to:
  /// **'Already have an account? Log in'**
  String get alreadyHaveAccount;

  /// Skip registration link text
  ///
  /// In en, this message translates to:
  /// **'Register later'**
  String get registerLater;

  /// Login screen title
  ///
  /// In en, this message translates to:
  /// **'Welcome back!'**
  String get welcomeBack;

  /// Email input placeholder
  ///
  /// In en, this message translates to:
  /// **'Enter your email'**
  String get enterYourEmail;

  /// Password input placeholder
  ///
  /// In en, this message translates to:
  /// **'Enter your password'**
  String get enterYourPassword;

  /// Login button text
  ///
  /// In en, this message translates to:
  /// **'Log In'**
  String get logIn;

  /// Or divider text
  ///
  /// In en, this message translates to:
  /// **'Or'**
  String get or;

  /// Sign up link text
  ///
  /// In en, this message translates to:
  /// **'Not yet a member? Sign up'**
  String get notYetMember;

  /// Forgot password screen title
  ///
  /// In en, this message translates to:
  /// **'Forgot password'**
  String get forgotPasswordTitle;

  /// Forgot password description text
  ///
  /// In en, this message translates to:
  /// **'Enter your email address and we\'ll send you a link to reset your password.'**
  String get forgotPasswordDescription;

  /// Send reset link button text
  ///
  /// In en, this message translates to:
  /// **'Send reset link'**
  String get sendResetLink;

  /// Back to login link text
  ///
  /// In en, this message translates to:
  /// **'Back to login'**
  String get backToLogin;

  /// Success title after sending reset link
  ///
  /// In en, this message translates to:
  /// **'Check your email'**
  String get checkYourEmail;

  /// Success message after sending reset link
  ///
  /// In en, this message translates to:
  /// **'We\'ve sent a password reset link to {email}'**
  String resetLinkSent(String email);

  /// Resend email link text
  ///
  /// In en, this message translates to:
  /// **'Didn\'t receive the email? Try again'**
  String get didntReceiveEmail;

  /// Register screen title
  ///
  /// In en, this message translates to:
  /// **'Join Dres'**
  String get joinUs;

  /// First name label
  ///
  /// In en, this message translates to:
  /// **'First name'**
  String get firstName;

  /// First name input placeholder
  ///
  /// In en, this message translates to:
  /// **'eg. Julie'**
  String get firstNameHint;

  /// Last name label
  ///
  /// In en, this message translates to:
  /// **'Last name'**
  String get lastName;

  /// Last name input placeholder
  ///
  /// In en, this message translates to:
  /// **'eg. Smith'**
  String get lastNameHint;

  /// Shop name label
  ///
  /// In en, this message translates to:
  /// **'Shop name (optional)'**
  String get shopName;

  /// Shop name input placeholder
  ///
  /// In en, this message translates to:
  /// **'eg. Julie\'s Boutique'**
  String get shopNameHint;

  /// Password requirement - minimum length
  ///
  /// In en, this message translates to:
  /// **'At least 8 characters'**
  String get atLeast8Characters;

  /// Password requirement - contains number
  ///
  /// In en, this message translates to:
  /// **'At least 1 number'**
  String get atLeast1Number;

  /// Password requirement - mixed case
  ///
  /// In en, this message translates to:
  /// **'Both upper and lower case letters'**
  String get upperAndLowerCase;

  /// Marketing consent text
  ///
  /// In en, this message translates to:
  /// **'Sign up for personalised edits, exclusive offers and all the latest news from us. You can opt-out at any time.'**
  String get marketingConsent;

  /// Terms acceptance prefix
  ///
  /// In en, this message translates to:
  /// **'I accept the '**
  String get iAcceptThe;

  /// Terms link text
  ///
  /// In en, this message translates to:
  /// **'Terms'**
  String get terms;

  /// Terms acceptance middle text
  ///
  /// In en, this message translates to:
  /// **' and I have read the '**
  String get andIHaveReadThe;

  /// Privacy policy link text
  ///
  /// In en, this message translates to:
  /// **'Privacy Policy & cookies'**
  String get privacyPolicyCookies;

  /// Register button text
  ///
  /// In en, this message translates to:
  /// **'Join us'**
  String get joinUsButton;

  /// Login link text on register screen
  ///
  /// In en, this message translates to:
  /// **'Already a member? Log in'**
  String get alreadyMember;

  /// Success message after registration
  ///
  /// In en, this message translates to:
  /// **'Registration successful! Please log in.'**
  String get registrationSuccessful;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
