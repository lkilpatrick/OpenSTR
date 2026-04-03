import 'dart:async';
import 'package:dio/dio.dart' show Options;
import 'package:flutter/foundation.dart';
import 'api_service.dart';

/// Detects whether the device is on the local network (same WiFi as the server).
/// When remote, the app allows viewing the schedule but blocks starting/continuing cleans.
class NetworkService extends ChangeNotifier {
  static final NetworkService _instance = NetworkService._();
  factory NetworkService() => _instance;

  bool _isLocal = false;
  bool _checking = false;
  bool _devOverride = false;
  DateTime? _lastCheck;

  bool get isLocal => _devOverride || _isLocal;
  bool get checking => _checking;
  bool get devOverride => _devOverride;

  /// Toggle dev override — forces isLocal to true for localhost testing
  void setDevOverride(bool value) {
    _devOverride = value;
    notifyListeners();
  }

  /// How often to re-check (don't hammer the server)
  static const _checkInterval = Duration(minutes: 2);

  NetworkService._();

  /// Call from the API base URL — nginx returns {"is_local": 0 or 1}
  Future<bool> checkNetwork({bool force = false}) async {
    if (!force &&
        _lastCheck != null &&
        DateTime.now().difference(_lastCheck!) < _checkInterval) {
      return _isLocal;
    }

    _checking = true;
    notifyListeners();

    try {
      final api = ApiService();
      final res = await api.dio.get(
        '/network-check',
        options: Options(receiveTimeout: const Duration(seconds: 5)),
      );
      final data = res.data as Map<String, dynamic>;
      // nginx geo module returns 1 for local, 0 for remote
      final local = data['is_local'] == 1 || data['is_local'] == '1';
      _isLocal = local;
    } catch (_) {
      // If we can't reach the endpoint, assume remote
      _isLocal = false;
    }

    _checking = false;
    _lastCheck = DateTime.now();
    notifyListeners();
    return _isLocal;
  }

  /// Quick check without network call — uses cached value
  bool get cachedIsLocal => _isLocal;
}
