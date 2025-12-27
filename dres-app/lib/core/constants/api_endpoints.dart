const String apiBaseUrl = '/api';

// Users
const String users = '$apiBaseUrl/users';
const String me = '$users/me';
const String refreshToken = '$users/refresh-token';
const String login = '$users/login';
const String logout = '$users/logout';

// Categories
const String categories = '$apiBaseUrl/categories';
const String categoriesByDepartment = '$categories?where[departments][contains]=\$department';

// Pages
const String pages = '$apiBaseUrl/pages';
const String pageBySlug = '$pages?where[slug][equals]=';
const String pageById = '$pages/';

// Variations
const String trendingVariations = '/variations/trending';
