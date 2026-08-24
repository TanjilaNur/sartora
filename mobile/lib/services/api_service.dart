import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../core/constants/api_constants.dart';

class ApiService {
  static const _storage = FlutterSecureStorage();
  static const _tokenKey = 'access_token';
  static const _refreshKey = 'refresh_token';
  static const _guestIdKey = 'guest_id';

  // How long to wait on one candidate host before moving to the next one.
  // Without this, an unreachable candidate (e.g. a stale LAN IP, or 10.0.2.2
  // tried from a real device) can hang far longer than a real request ever
  // takes, which is what made "loading" feel randomly stuck.
  static const _requestTimeout = Duration(seconds: 6);

  // Once a candidate host is found to work, remember it and try it first on
  // every later call — only the very first call (or one after the network
  // changes) pays the cost of walking the fallback chain.
  static String? _resolvedHost;

  static Future<void> saveTokens(String accessToken, String refreshToken) async {
    await Future.wait([
      _storage.write(key: _tokenKey, value: accessToken),
      _storage.write(key: _refreshKey, value: refreshToken),
    ]);
  }

  static Future<String?> getAccessToken() => _storage.read(key: _tokenKey);
  static Future<String?> getRefreshToken() => _storage.read(key: _refreshKey);

  static Future<void> clearTokens() async {
    await Future.wait([
      _storage.delete(key: _tokenKey),
      _storage.delete(key: _refreshKey),
    ]);
  }

  static Future<void> saveGuestId(String guestId) =>
      _storage.write(key: _guestIdKey, value: guestId);

  static Future<String?> getGuestId() => _storage.read(key: _guestIdKey);

  static Future<void> clearGuestId() => _storage.delete(key: _guestIdKey);

  static Future<Map<String, dynamic>> post(
    String url,
    Map<String, dynamic> body, {
    bool withAuth = false,
  }) async {
    final headers = {'Content-Type': 'application/json'};
    if (withAuth) {
      final token = await getAccessToken();
      if (token != null) headers['Authorization'] = 'Bearer $token';
    }

    final bodyJson = jsonEncode(body);
    final result = await _sendWithFallback(
      url,
      (candidate) => http.post(
        Uri.parse(candidate),
        headers: headers,
        body: bodyJson,
      ),
    );
    final response = result.response;

    final data = _parseJsonMap(response.body);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return data;
    }

    if (response.statusCode == 401 && withAuth) {
      final refreshed = await _tryRefresh();
      if (refreshed) {
        return post(url, body, withAuth: true);
      }
    }

    throw ApiException(
      message: data['message'] as String? ?? 'Request failed',
      statusCode: response.statusCode,
    );
  }

  static Future<Map<String, dynamic>> get(
    String url, {
    bool withAuth = false,
  }) async {
    final headers = <String, String>{};
    if (withAuth) {
      final token = await getAccessToken();
      if (token != null) headers['Authorization'] = 'Bearer $token';
    }

    final result = await _sendWithFallback(
      url,
      (candidate) => http.get(Uri.parse(candidate), headers: headers),
    );
    final response = result.response;

    final data = _parseJsonMap(response.body);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return data;
    }

    if (response.statusCode == 401 && withAuth) {
      final refreshed = await _tryRefresh();
      if (refreshed) return get(url, withAuth: true);
    }

    throw ApiException(
      message: data['message'] as String? ?? 'Request failed',
      statusCode: response.statusCode,
    );
  }

  static Future<Map<String, dynamic>> put(
    String url,
    Map<String, dynamic> body, {
    bool withAuth = false,
  }) async {
    final headers = {'Content-Type': 'application/json'};
    if (withAuth) {
      final token = await getAccessToken();
      if (token != null) headers['Authorization'] = 'Bearer $token';
    }

    final bodyJson = jsonEncode(body);
    final result = await _sendWithFallback(
      url,
      (candidate) => http.put(
        Uri.parse(candidate),
        headers: headers,
        body: bodyJson,
      ),
    );
    final response = result.response;

    final data = _parseJsonMap(response.body);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return data;
    }

    if (response.statusCode == 401 && withAuth) {
      final refreshed = await _tryRefresh();
      if (refreshed) return put(url, body, withAuth: true);
    }

    throw ApiException(
      message: data['message'] as String? ?? 'Request failed',
      statusCode: response.statusCode,
    );
  }

  static Future<Map<String, dynamic>> patch(
    String url,
    Map<String, dynamic> body, {
    bool withAuth = false,
  }) async {
    final headers = {'Content-Type': 'application/json'};
    if (withAuth) {
      final token = await getAccessToken();
      if (token != null) headers['Authorization'] = 'Bearer $token';
    }

    final bodyJson = jsonEncode(body);
    final result = await _sendWithFallback(
      url,
      (candidate) => http.patch(
        Uri.parse(candidate),
        headers: headers,
        body: bodyJson,
      ),
    );
    final response = result.response;

    final data = _parseJsonMap(response.body);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return data;
    }

    if (response.statusCode == 401 && withAuth) {
      final refreshed = await _tryRefresh();
      if (refreshed) return patch(url, body, withAuth: true);
    }

    throw ApiException(
      message: data['message'] as String? ?? 'Request failed',
      statusCode: response.statusCode,
    );
  }

  static Future<Map<String, dynamic>> delete(
    String url, {
    Map<String, dynamic>? body,
    bool withAuth = false,
  }) async {
    final headers = <String, String>{};
    if (body != null) headers['Content-Type'] = 'application/json';
    if (withAuth) {
      final token = await getAccessToken();
      if (token != null) headers['Authorization'] = 'Bearer $token';
    }

    final result = await _sendWithFallback(
      url,
      (candidate) => http.delete(
        Uri.parse(candidate),
        headers: headers,
        body: body != null ? jsonEncode(body) : null,
      ),
    );
    final response = result.response;

    final data = _parseJsonMap(response.body);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return data;
    }

    if (response.statusCode == 401 && withAuth) {
      final refreshed = await _tryRefresh();
      if (refreshed) return delete(url, body: body, withAuth: true);
    }

    throw ApiException(
      message: data['message'] as String? ?? 'Request failed',
      statusCode: response.statusCode,
    );
  }

  static Future<bool> _tryRefresh() async {
    final refreshToken = await getRefreshToken();
    if (refreshToken == null) return false;

    try {
      final result = await _sendWithFallback(
        ApiConstants.refresh,
        (candidate) => http.post(
          Uri.parse(candidate),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({'refreshToken': refreshToken}),
        ),
      );
      if (result.response.statusCode == 200) {
        final data = jsonDecode(result.response.body) as Map<String, dynamic>;
        await _storage.write(key: _tokenKey, value: data['token'] as String);
        return true;
      }
    } catch (_) {}

    await clearTokens();
    return false;
  }

  static Future<_HttpResult> _sendWithFallback(
    String url,
    _RequestSender send,
  ) async {
    final candidates = _orderedCandidateUrls(url);
    Object? lastError;

    for (final candidate in candidates) {
      try {
        final response = await send(candidate).timeout(_requestTimeout);
        _resolvedHost = Uri.parse(candidate).host;
        return _HttpResult(response: response, usedUrl: candidate);
      } catch (e) {
        lastError = e;
      }
    }

    _resolvedHost = null;
    throw ApiException(
      message:
          'Unable to reach server at ${candidates.join(', ')}. Set API_BASE_URL if needed.',
      statusCode: 0,
      cause: lastError,
    );
  }

  /// Puts the host that worked last time first in line. Otherwise every
  /// call re-walks the whole fallback chain (and re-pays every unreachable
  /// candidate's timeout) even after we already know which host is live.
  static List<String> _orderedCandidateUrls(String url) {
    final candidates = _candidateUrls(url);
    final resolved = _resolvedHost;
    if (resolved == null) return candidates;

    final resolvedIndex = candidates.indexWhere((c) => Uri.parse(c).host == resolved);
    if (resolvedIndex <= 0) return candidates;

    final reordered = List<String>.from(candidates);
    final winner = reordered.removeAt(resolvedIndex);
    reordered.insert(0, winner);
    return reordered;
  }

  static List<String> _candidateUrls(String url) {
    final uri = Uri.parse(url);
    final host = uri.host;
    final hostsToTry = <String>[host];

    final isPrivateLan =
        host.startsWith('192.168.') ||
        host.startsWith('10.') ||
        RegExp(r'^172\.(1[6-9]|2\d|3[0-1])\.').hasMatch(host);

    if (host == 'localhost' || host == '127.0.0.1' || host == '10.0.2.2' || isPrivateLan) {
      hostsToTry
        ..add('10.0.2.2')
        ..add('127.0.0.1')
        ..add('localhost');
    }

    final uniqueHosts = <String>[];
    for (final h in hostsToTry) {
      if (!uniqueHosts.contains(h)) uniqueHosts.add(h);
    }

    return uniqueHosts
        .map((h) => uri.replace(host: h).toString())
        .toList(growable: false);
  }
}

typedef _RequestSender = Future<http.Response> Function(String url);

class _HttpResult {
  final http.Response response;
  final String usedUrl;

  const _HttpResult({required this.response, required this.usedUrl});
}

Map<String, dynamic> _parseJsonMap(String body) {
  if (body.isEmpty) return {};

  try {
    final decoded = jsonDecode(body);
    if (decoded is Map<String, dynamic>) return decoded;
    return {'message': 'Unexpected response from server'};
  } catch (_) {
    return {'message': 'Unexpected response from server'};
  }
}

class ApiException implements Exception {
  final String message;
  final int statusCode;
  final Object? cause;
  const ApiException({
    required this.message,
    required this.statusCode,
    this.cause,
  });

  @override
  String toString() => message;
}
