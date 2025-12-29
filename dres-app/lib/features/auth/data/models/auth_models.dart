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

  AuthUser({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    this.shopName,
    this.username,
    this.photo,
  });

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: json['id']?.toString() ?? '',
      email: json['email'] ?? '',
      firstName: json['firstName'] ?? '',
      lastName: json['lastName'] ?? '',
      shopName: json['shopName'],
      username: json['username'],
      photo: json['photo']?['url'],
    );
  }

  String get fullName => '$firstName $lastName';
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
