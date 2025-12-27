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

  /// Email field label
  ///
  /// In en, this message translates to:
  /// **'Email'**
  String get email;

  /// Password field label
  ///
  /// In en, this message translates to:
  /// **'Password'**
  String get password;

  /// Forgot password link text
  ///
  /// In en, this message translates to:
  /// **'Forgot Password?'**
  String get forgotPassword;

  /// We Love promo card title
  ///
  /// In en, this message translates to:
  /// **'We Love'**
  String get weLove;

  /// Google sign in button text
  ///
  /// In en, this message translates to:
  /// **'Continue with Google'**
  String get continueWithGoogle;

  /// Apple sign in button text
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
