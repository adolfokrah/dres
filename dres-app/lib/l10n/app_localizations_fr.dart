// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for French (`fr`).
class AppLocalizationsFr extends AppLocalizations {
  AppLocalizationsFr([String locale = 'fr']) : super(locale);

  @override
  String get appName => 'DRES';

  @override
  String get splashTagline => 'Achetez et Vendez de la Mode,\nFacilement';

  @override
  String get login => 'Connexion';

  @override
  String get signUp => 'S\'inscrire';

  @override
  String get email => 'Email';

  @override
  String get password => 'Mot de passe';

  @override
  String get forgotPassword => 'Mot de passe oublié ?';

  @override
  String get weLove => 'NOUS AIMONS';

  @override
  String get continueWithGoogle => 'Continuer avec Google';

  @override
  String get continueWithApple => 'Continuer avec Apple';

  @override
  String get orContinueWith => 'Ou continuer avec';

  @override
  String get home => 'Accueil';

  @override
  String get search => 'Rechercher';

  @override
  String get sell => 'Vendre';

  @override
  String get inbox => 'Messages';

  @override
  String get profile => 'Profil';

  @override
  String get searchPlaceholder => 'Rechercher des articles, membres';

  @override
  String get discover => 'Découvrir';

  @override
  String get favourite => 'Favoris';

  @override
  String get me => 'Moi';

  @override
  String get shop => 'Boutique';

  @override
  String get favorites => 'Favoris';

  @override
  String get firstTimeTitle => 'Première fois ?';

  @override
  String get firstTimeDescription =>
      'Achat : 10% de réduction avec le code WELCOMEVC. VENDRE : SANS FRAIS POUR COMMENCER.*';

  @override
  String get getStarted => 'Commencer';

  @override
  String get failedToLoadMenu => 'Échec du chargement du menu';

  @override
  String get pullToRefresh => 'Tirez pour actualiser';

  @override
  String get noCollectionsAvailable => 'Aucune collection disponible';

  @override
  String get newArrivalsForYou => 'Nouveautés pour vous';

  @override
  String get dailyDropPersonalized =>
      'Une sélection quotidienne, personnalisée pour vous';

  @override
  String get designers => 'Créateurs';

  @override
  String get azOfBrands => 'A-Z des marques et partenaires officiels';

  @override
  String get styleTeamTopPicks => 'Les coups de cœur de l\'équipe style';

  @override
  String get onSale => 'En Solde';

  @override
  String get finestDeals => 'Nos meilleures offres';

  @override
  String get latest => 'Plus récent';

  @override
  String get oldest => 'Plus ancien';

  @override
  String get priceAny => 'Tout prix';

  @override
  String get priceLowToHigh => 'Prix croissant';

  @override
  String get priceHighToLow => 'Prix décroissant';

  @override
  String get priceRange => 'Fourchette de prix';

  @override
  String get minPrice => 'Prix minimum';

  @override
  String get maxPrice => 'Prix maximum';

  @override
  String get apply => 'Appliquer';

  @override
  String get reset => 'Réinitialiser';

  @override
  String get noProductsFound => 'Aucun produit trouvé';

  @override
  String get tryAdjustingFilters =>
      'Essayez d\'ajuster vos filtres ou votre recherche\npour trouver ce que vous cherchez';

  @override
  String get failedToLoadProducts => 'Échec du chargement des produits';

  @override
  String get retry => 'Réessayer';

  @override
  String get sort => 'Trier';

  @override
  String get price => 'Prix';

  @override
  String get freeListingOrReturns => 'ANNONCE OU RETOURS GRATUITS';

  @override
  String get freeRelisting => 'Remise en vente gratuite';

  @override
  String get freeRelistingDescription =>
      'La remise en vente est gratuite en cas de problème avec l\'article. Motifs éligibles (signaler dans les 6 heures) :';

  @override
  String get wrongItemSent => 'Mauvais article envoyé';

  @override
  String get fakeNotAuthentic => 'Faux / non authentique';

  @override
  String get itemArrivedDamaged => 'Article arrivé endommagé';

  @override
  String get freeReturnsBuyerProtection =>
      'Retours gratuits (Protection acheteur)';

  @override
  String get freeReturnsDescription =>
      'Si vous ajoutez les frais de protection acheteur à cet article, vous pouvez retourner l\'article pour un remboursement complet et nous couvrons les frais de retour.';

  @override
  String get returnIssues48Hours =>
      'Les problèmes de retour doivent être signalés dans les 6 heures';

  @override
  String get weCoverReturnDelivery =>
      'Nous couvrons les frais de retour au vendeur';

  @override
  String get includeBuyerProtectionFee =>
      'Inclure la Protection Acheteur';

  @override
  String get buyerProtectionDescription =>
      'Remboursement COMPLET en cas de retour. Nous couvrons tous les frais.';

  @override
  String get buyerProtectionTitle => 'Protection Acheteur';

  @override
  String get buyerProtectionWhatYouGet => 'Ce que vous obtenez :';

  @override
  String get buyerProtectionBenefit1 => 'Remboursement intégral du prix de l\'article en cas de retour';

  @override
  String get buyerProtectionBenefit2 => 'Remboursement intégral des frais de livraison';

  @override
  String get buyerProtectionBenefit3 => 'Nous couvrons tous les frais de transfert - vous ne payez rien de plus';

  @override
  String get buyerProtectionWithout => 'Sans Protection Acheteur :';

  @override
  String get buyerProtectionWithoutItem1 => 'Des frais de traitement (3% + 1¢) sont déduits de votre remboursement';

  @override
  String get buyerProtectionWithoutItem2 => 'Les frais de livraison ne sont pas remboursés';

  @override
  String buyerProtectionCostInfo(String rate) => 'La Protection Acheteur ne coûte que $rate% du prix de l\'article. Un petit frais pour une tranquillité d\'esprit totale.';

  @override
  String get gotIt => 'Compris';

  @override
  String get learnMore => 'En savoir plus';

  @override
  String get follow => 'Suivre';

  @override
  String get following => 'Suivi';

  @override
  String usuallyShipsIn(String hours) {
    return 'Expédié généralement en $hours';
  }

  @override
  String get salesHistory => 'Historique des ventes';

  @override
  String get itemsSold => 'Articles vendus';

  @override
  String get shipped => 'Expédié';

  @override
  String get cancelled => 'Annulé';

  @override
  String get youMayAlsoLike => 'Vous aimerez peut-être aussi';

  @override
  String get recentlyViewed => 'Vus récemment';

  @override
  String get addToBag => 'Ajouter au panier';

  @override
  String get outOfStock => 'Rupture de stock';

  @override
  String get registerDiscount =>
      'Inscrivez-vous aujourd\'hui pour une réduction spéciale sur votre premier achat';

  @override
  String get registerWithEmail => 'S\'inscrire avec Email';

  @override
  String get alreadyHaveAccount => 'Déjà un compte ? Connexion';

  @override
  String get registerLater => 'S\'inscrire plus tard';

  @override
  String get welcomeBack => 'Bon retour !';

  @override
  String get enterYourEmail => 'Entrez votre email';

  @override
  String get enterYourPassword => 'Entrez votre mot de passe';

  @override
  String get logIn => 'Se connecter';

  @override
  String get or => 'Ou';

  @override
  String get notYetMember => 'Pas encore membre ? S\'inscrire';

  @override
  String get forgotPasswordTitle => 'Mot de passe oublié';

  @override
  String get forgotPasswordDescription =>
      'Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.';

  @override
  String get sendResetLink => 'Envoyer le lien';

  @override
  String get backToLogin => 'Retour à la connexion';

  @override
  String get checkYourEmail => 'Vérifiez votre email';

  @override
  String resetLinkSent(String email) {
    return 'Nous avons envoyé un lien de réinitialisation à $email';
  }

  @override
  String get didntReceiveEmail => 'Vous n\'avez pas reçu l\'email ? Réessayer';

  @override
  String get joinUs => 'Rejoignez Dres';

  @override
  String get firstName => 'Prénom';

  @override
  String get firstNameHint => 'ex. Julie';

  @override
  String get lastName => 'Nom';

  @override
  String get lastNameHint => 'ex. Dupont';

  @override
  String get shopName => 'Nom de boutique (optionnel)';

  @override
  String get shopNameHint => 'ex. Boutique de Julie';

  @override
  String get atLeast8Characters => 'Au moins 8 caractères';

  @override
  String get atLeast1Number => 'Au moins 1 chiffre';

  @override
  String get upperAndLowerCase => 'Lettres majuscules et minuscules';

  @override
  String get marketingConsent =>
      'Inscrivez-vous pour recevoir des sélections personnalisées, des offres exclusives et toutes les dernières nouvelles. Vous pouvez vous désinscrire à tout moment.';

  @override
  String get iAcceptThe => 'J\'accepte les ';

  @override
  String get terms => 'Conditions';

  @override
  String get andIHaveReadThe => ' et j\'ai lu la ';

  @override
  String get privacyPolicyCookies => 'Politique de confidentialité & cookies';

  @override
  String get joinUsButton => 'Nous rejoindre';

  @override
  String get alreadyMember => 'Déjà membre ? Connexion';

  @override
  String get registrationSuccessful =>
      'Inscription réussie ! Veuillez vous connecter.';

  @override
  String get personalInfo => 'Informations personnelles';

  @override
  String get accountPreference => 'Préférences du compte';

  @override
  String get shoppingPreference => 'Préférences d\'achat';

  @override
  String get vacationMode => 'Mode vacances';

  @override
  String get savedSearches => 'Recherches sauvegardées';

  @override
  String get withdrawalAccount => 'Compte de retrait';

  @override
  String get info => 'Info';

  @override
  String get privacyPolicy => 'Politique de confidentialité';

  @override
  String get termsOfService => 'Conditions d\'utilisation';

  @override
  String get logout => 'Déconnexion';

  @override
  String get logoutConfirmation =>
      'Êtes-vous sûr de vouloir vous déconnecter ?';

  @override
  String get cancel => 'Annuler';

  @override
  String get viewProfile => 'Voir le profil';

  @override
  String get women => 'Femmes';

  @override
  String get men => 'Hommes';
}
