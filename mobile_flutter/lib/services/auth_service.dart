import 'package:flutter/foundation.dart';
import 'api_service.dart';
import 'storage_service.dart';
import '../models/models.dart';

class AuthService extends ChangeNotifier {
  final ApiService _api = ApiService();
  final StorageService _storage = StorageService();

  AuthUser? _user;
  bool _loading = true;
  String? _error;

  AuthUser? get user => _user;
  bool get loading => _loading;
  String? get error => _error;
  bool get isAuthenticated => _user != null;

  AuthService() {
    _api.onUnauthenticated = () {
      _user = null;
      notifyListeners();
    };
    _checkSession();
  }

  Future<void> _checkSession() async {
    _loading = true;
    notifyListeners();

    try {
      final token = await _storage.getAccessToken();
      if (token == null) {
        _loading = false;
        notifyListeners();
        return;
      }
      final response = await _api.dio.get('/api/auth/get-session');
      final data = response.data as Map<String, dynamic>;
      if (data['user'] != null) {
        _user = AuthUser.fromJson(data['user'] as Map<String, dynamic>);
      }
    } catch (_) {
      await _storage.clearAccessToken();
    }

    _loading = false;
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    _error = null;
    _loading = true;
    notifyListeners();

    try {
      final response = await _api.dio.post('/api/auth/sign-in/email', data: {
        'email': email,
        'password': password,
      });

      final data = response.data as Map<String, dynamic>;
      if (data['token'] != null) {
        await _storage.saveAccessToken(data['token'] as String);
      }
      if (data['user'] != null) {
        _user = AuthUser.fromJson(data['user'] as Map<String, dynamic>);
      }

      _loading = false;
      notifyListeners();
      return true;
    } catch (e) {
      debugPrint('Login error: $e');
      _error = 'Invalid email or password';
      _loading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    try {
      await _api.dio.post('/api/auth/sign-out');
    } catch (_) {}
    await _storage.clearAccessToken();
    _user = null;
    _error = null;
    notifyListeners();
  }
}
