import 'package:flutter/material.dart';
import '../../theme.dart';
import '../../services/api_service.dart';
import '../../models/models.dart';
import 'clean_detail_screen.dart';

class PastCleansScreen extends StatefulWidget {
  const PastCleansScreen({super.key});

  @override
  State<PastCleansScreen> createState() => _PastCleansScreenState();
}

class _PastCleansScreenState extends State<PastCleansScreen> {
  final _api = ApiService();

  List<CleanSession> _sessions = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchPastCleans();
  }

  Future<void> _fetchPastCleans() async {
    try {
      final futures = await Future.wait([
        _api.dio.get('/sessions', queryParameters: {'status': 'submitted'}),
        _api.dio.get('/sessions', queryParameters: {'status': 'approved'}),
        _api.dio.get('/sessions', queryParameters: {'status': 'rejected'}),
      ]);

      final all = <CleanSession>[];
      for (final r in futures) {
        final list = (r.data as List)
            .map((e) => CleanSession.fromJson(e as Map<String, dynamic>))
            .toList();
        all.addAll(list);
      }

      all.sort((a, b) {
        final da = a.completedAt ?? a.createdAt ?? '';
        final db = b.completedAt ?? b.createdAt ?? '';
        return db.compareTo(da);
      });

      setState(() {
        _sessions = all;
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  void _openDetail(CleanSession session) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => CleanDetailScreen(sessionId: session.id),
      ),
    );
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'approved':
        return OceanTheme.success;
      case 'rejected':
        return OceanTheme.error;
      case 'submitted':
        return OceanTheme.warning;
      default:
        return OceanTheme.textSecondary;
    }
  }

  IconData _statusIcon(String status) {
    switch (status) {
      case 'approved':
        return Icons.check_circle;
      case 'rejected':
        return Icons.cancel;
      case 'submitted':
        return Icons.schedule;
      default:
        return Icons.help_outline;
    }
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return 'Unknown date';
    try {
      final d = DateTime.parse(dateStr);
      final months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      return '${months[d.month - 1]} ${d.day}, ${d.year}';
    } catch (_) {
      return dateStr;
    }
  }

  @override
  Widget build(BuildContext context) {
    return _buildListView();
  }

  Widget _buildListView() {
    if (_loading) {
      return const Center(
        child: CircularProgressIndicator(color: OceanTheme.primary),
      );
    }

    if (_sessions.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.history,
              size: 48,
              color: OceanTheme.textSecondary.withValues(alpha: 0.5),
            ),
            const SizedBox(height: 8),
            const Text(
              'No past cleans yet',
              style: TextStyle(color: OceanTheme.textSecondary),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () async {
        setState(() => _loading = true);
        await _fetchPastCleans();
      },
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text(
            'Past Cleans',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: OceanTheme.text,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            '${_sessions.length} completed session${_sessions.length == 1 ? '' : 's'}',
            style: const TextStyle(
              fontSize: 13,
              color: OceanTheme.textSecondary,
            ),
          ),
          const SizedBox(height: 16),
          ..._sessions.map(
            (s) => Card(
              margin: const EdgeInsets.only(bottom: 10),
              child: InkWell(
                borderRadius: BorderRadius.circular(12),
                onTap: () => _openDetail(s),
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: _statusColor(s.status).withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        alignment: Alignment.center,
                        child: Icon(
                          _statusIcon(s.status),
                          color: _statusColor(s.status),
                          size: 22,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              s.propertyName ?? 'Property',
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                                color: OceanTheme.text,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              _formatDate(
                                s.completedAt ?? s.scheduledDate ?? s.createdAt,
                              ),
                              style: const TextStyle(
                                fontSize: 12,
                                color: OceanTheme.textSecondary,
                              ),
                            ),
                            if (s.sessionType != null) ...[
                              const SizedBox(height: 2),
                              Text(
                                s.sessionType!.replaceAll('_', ' '),
                                style: const TextStyle(
                                  fontSize: 11,
                                  color: OceanTheme.textSecondary,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: _statusColor(s.status).withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          s.status.toUpperCase(),
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: _statusColor(s.status),
                          ),
                        ),
                      ),
                      if (s.guestRating != null) ...[
                        const SizedBox(width: 8),
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.star,
                              size: 14,
                              color: Color(0xFFF59E0B),
                            ),
                            Text(
                              '${s.guestRating}',
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ],
                      const SizedBox(width: 4),
                      const Icon(
                        Icons.chevron_right,
                        size: 20,
                        color: OceanTheme.textSecondary,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
