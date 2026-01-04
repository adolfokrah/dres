import 'package:flutter/foundation.dart';

class RegisterRequest {
  final String firstName;
  final String lastName;
  final String? shopName;
  final String email;
  final String password;

  RegisterRequest({
    required this.firstName,
    required this.lastName,
    this.shopName,
    required this.email,
    required this.password,
  });

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = {
      'firstName': firstName,
      'lastName': lastName,
      'email': email,
      'password': password,
    };
    
    // Only add shopName if it's not null and not empty
    if (shopName != null && shopName!.trim().isNotEmpty) {
      data['shopName'] = shopName!.trim();
    }
    
    return data;
  }
}

class LoginRequest {
  final String email;
  final String password;

  LoginRequest({
    required this.email,
    required this.password,
  });

  Map<String, dynamic> toJson() {
    return {
      'email': email,
      'password': password,
    };
  }
}

class AuthUser {
  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final String? shopName;
  final String? username;
  final String? photo;
  final String? language;
  final AuthCountry? country;
  final bool vacationMode;
  final int followersCount;
  final int followingCount;
  final int reviewsCount;

  AuthUser({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    this.shopName,
    this.username,
    this.photo,
    this.language,
    this.country,
    this.vacationMode = false,
    this.followersCount = 0,
    this.followingCount = 0,
    this.reviewsCount = 0,
  });

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    debugPrint('🔵 AuthUser.fromJson: $json');
    
    // Handle photo - can be a string URL, an object with url, or null
    String? photoUrl;
    final photo = json['photo'];
    if (photo is String) {
      photoUrl = photo;
    } else if (photo is Map) {
      photoUrl = photo['url'] as String?;
    }

    // Handle country - can be a string ID, an object, or null
    AuthCountry? country;
    final countryData = json['country'];
    if (countryData is Map<String, dynamic>) {
      country = AuthCountry.fromJson(countryData);
    }
    
    return AuthUser(
      id: json['id']?.toString() ?? '',
      email: json['email'] ?? '',
      firstName: json['firstName'] ?? '',
      lastName: json['lastName'] ?? '',
      shopName: json['shopName'],
      username: json['username'],
      photo: photoUrl,
      language: json['language'] as String?,
      country: country,
      vacationMode: json['vacationMode'] ?? false,
      followersCount: json['followersCount'] ?? 0,
      followingCount: json['followingCount'] ?? 0,
      reviewsCount: json['reviewsCount'] ?? 0,
    );
  }

  String get fullName {
    final first = firstName.trim();
    final last = lastName.trim();
    if (first.isNotEmpty && last.isNotEmpty) {
      return '$first $last';
    } else if (first.isNotEmpty) {
      return first;
    } else if (last.isNotEmpty) {
      return last;
    }
    return email.split('@').first; // Fallback to email username
  }
}

class AuthResponse {
  final AuthUser user;
  final String token;
  final DateTime? exp;

  AuthResponse({
    required this.user,
    required this.token,
    this.exp,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      user: AuthUser.fromJson(json['user'] ?? {}),
      token: json['token'] ?? '',
      exp: json['exp'] != null ? DateTime.fromMillisecondsSinceEpoch(json['exp'] * 1000) : null,
    );
  }
}

/// Country model for auth user
class AuthCountry {
  final String id;
  final String name;
  final String code;
  final AuthCurrency? currency;

  AuthCountry({
    required this.id,
    required this.name,
    required this.code,
    this.currency,
  });

  factory AuthCountry.fromJson(Map<String, dynamic> json) {
    AuthCurrency? currency;
    final currencyData = json['currency'];
    if (currencyData is Map<String, dynamic>) {
      currency = AuthCurrency.fromJson(currencyData);
    }
    
    return AuthCountry(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? '',
      code: json['code'] ?? '',
      currency: currency,
    );
  }
}

/// Currency model for auth user's country
class AuthCurrency {
  final String id;
  final String name;
  final String code;
  final String symbol;

  AuthCurrency({
    required this.id,
    required this.name,
    required this.code,
    required this.symbol,
  });

  factory AuthCurrency.fromJson(Map<String, dynamic> json) {
    return AuthCurrency(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? '',
      code: json['code'] ?? '',
      symbol: json['symbol'] ?? '',
    );
  }
}
