import 'package:flutter/material.dart';
import '../../theme.dart';
import '../../services/api_service.dart';
import '../../models/models.dart';

class ScheduleScreen extends StatefulWidget {
  const ScheduleScreen({super.key});

  @override
  State<ScheduleScreen> createState() => _ScheduleScreenState();
}

class _ScheduleScreenState extends State<ScheduleScreen> {
  final _api = ApiService();
  List<CleanSession> _sessions = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchSessions();
  }

  Future<void> _fetchSessions() async {
    setState(() => _loading = true);
    try {
      // Fetch pending and accepted sessions
      final pendingRes = await _api.dio.get(
        '/sessions',
        queryParameters: {'status': 'pending'},
      );
      final acceptedRes = await _api.dio.get(
        '/sessions',
        queryParameters: {'status': 'accepted'},
      );
      final pending = (pendingRes.data as List).map(
        (e) => CleanSession.fromJson(e as Map<String, dynamic>),
      );
      final accepted = (acceptedRes.data as List).map(
        (e) => CleanSession.fromJson(e as Map<String, dynamic>),
      );
      final all = [...pending, ...accepted];
      // Sort: soonest scheduled date first, then created_at
      all.sort((a, b) {
        final da = a.scheduledDate ?? a.createdAt ?? '';
        final db = b.scheduledDate ?? b.createdAt ?? '';
        return da.compareTo(db);
      });
      setState(() {
        _sessions = all;
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Future<void> _acceptSession(String sessionId) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Accept Clean'),
        content: const Text('Confirm that you will handle this clean?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Accept'),
          ),
        ],
      ),
    );
    if (confirm != true) return;
    try {
      await _api.dio.post('/sessions/$sessionId/accept');
      _fetchSessions();
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not accept this clean')),
        );
      }
    }
  }

  Future<void> _requestBackup(String sessionId) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Request Backup'),
        content: const Text(
          'Let the manager know you need help with this clean?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: OceanTheme.error),
            child: const Text('Request'),
          ),
        ],
      ),
    );
    if (confirm != true) return;
    try {
      await _api.dio.post('/sessions/$sessionId/request-backup', data: {});
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Backup request sent to manager')),
        );
      }
      _fetchSessions();
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not submit backup request')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(
        child: CircularProgressIndicator(color: OceanTheme.primary),
      );
    }

    if (_sessions.isEmpty) {
      return RefreshIndicator(
        color: OceanTheme.primary,
        onRefresh: _fetchSessions,
        child: ListView(
          children: [
            SizedBox(
              height: MediaQuery.of(context).size.height * 0.6,
              child: const Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.waves, size: 48, color: OceanTheme.primary),
                    SizedBox(height: 12),
                    Text(
                      'No upcoming cleans',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: OceanTheme.text,
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      "You're all caught up!",
                      style: TextStyle(
                        fontSize: 14,
                        color: OceanTheme.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      );
    }

    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final weekEnd = today.add(const Duration(days: 7));

    final todaySessions = <CleanSession>[];
    final thisWeekSessions = <CleanSession>[];
    final laterSessions = <CleanSession>[];

    for (final s in _sessions) {
      final dateStr = s.scheduledDate ?? s.createdAt;
      if (dateStr == null) {
        laterSessions.add(s);
        continue;
      }
      final dt = DateTime.tryParse(dateStr);
      if (dt == null) {
        laterSessions.add(s);
        continue;
      }
      final date = DateTime(dt.year, dt.month, dt.day);
      if (date == today) {
        todaySessions.add(s);
      } else if (date.isAfter(today) && date.isBefore(weekEnd)) {
        thisWeekSessions.add(s);
      } else {
        laterSessions.add(s);
      }
    }

    return RefreshIndicator(
      color: OceanTheme.primary,
      onRefresh: _fetchSessions,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (todaySessions.isNotEmpty) ...[
            _sectionHeader('Today'),
            ...todaySessions.map((s) => _buildSessionCard(s, isToday: true)),
            const SizedBox(height: 16),
          ],
          if (thisWeekSessions.isNotEmpty) ...[
            _sectionHeader('This Week'),
            ...thisWeekSessions.map((s) => _buildSessionCard(s)),
            const SizedBox(height: 16),
          ],
          if (laterSessions.isNotEmpty) ...[
            _sectionHeader(
              todaySessions.isEmpty && thisWeekSessions.isEmpty
                  ? 'Upcoming Cleans'
                  : 'Later',
            ),
            ...laterSessions.map((s) => _buildSessionCard(s)),
          ],
        ],
      ),
    );
  }

  Widget _sectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w700,
          color: OceanTheme.text,
        ),
      ),
    );
  }

  Widget _buildSessionCard(CleanSession session, {bool isToday = false}) {
    final isPending = session.status == 'pending';
    final isAccepted = session.status == 'accepted';
    final sessionType = (session.sessionType ?? 'turnover').replaceAll(
      '_',
      ' ',
    );

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: isToday
            ? const BorderSide(color: OceanTheme.primary, width: 2)
            : BorderSide.none,
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          InkWell(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
            onTap: isAccepted
                ? () => Navigator.of(
                    context,
                  ).pushNamed('/session', arguments: session.id)
                : null,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(
                        Icons.waves,
                        size: 18,
                        color: OceanTheme.primary,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          session.propertyName ?? 'Property',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: OceanTheme.text,
                          ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: OceanTheme.statusColor(session.status),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          session.status.replaceAll('_', ' '),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(
                        Icons.calendar_today,
                        size: 14,
                        color: OceanTheme.primary.withValues(alpha: 0.7),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        _formatDate(
                          session.scheduledDate ?? session.createdAt ?? '',
                        ),
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: OceanTheme.primary,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Text(
                        sessionType[0].toUpperCase() + sessionType.substring(1),
                        style: const TextStyle(
                          fontSize: 13,
                          color: OceanTheme.textSecondary,
                        ),
                      ),
                    ],
                  ),
                  if (session.notes != null && session.notes!.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text(
                      session.notes!,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 12,
                        color: OceanTheme.textSecondary,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
          // Action buttons for pending sessions
          if (isPending)
            Container(
              decoration: const BoxDecoration(
                border: Border(top: BorderSide(color: Color(0xFFF1F5F9))),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: InkWell(
                      onTap: () => _acceptSession(session.id),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        decoration: const BoxDecoration(
                          color: Color(0xFFF0FDF4),
                          border: Border(
                            right: BorderSide(color: Color(0xFFF1F5F9)),
                          ),
                        ),
                        alignment: Alignment.center,
                        child: const Text(
                          '✓ Accept',
                          style: TextStyle(
                            color: Color(0xFF16A34A),
                            fontWeight: FontWeight.w700,
                            fontSize: 14,
                          ),
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: InkWell(
                      onTap: () => _requestBackup(session.id),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        color: const Color(0xFFFEFCE8),
                        alignment: Alignment.center,
                        child: const Text(
                          'Request Backup',
                          style: TextStyle(
                            color: Color(0xFFA16207),
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          // Start button for accepted sessions
          if (isAccepted)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.of(
                    context,
                  ).pushNamed('/session', arguments: session.id),
                  child: const Text(
                    'Start Clean →',
                    style: TextStyle(fontWeight: FontWeight.w700),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  String _formatDate(String iso) {
    if (iso.isEmpty) return 'No date set';
    try {
      final dt = DateTime.parse(iso);
      final now = DateTime.now();
      final today = DateTime(now.year, now.month, now.day);
      final tomorrow = today.add(const Duration(days: 1));
      final date = DateTime(dt.year, dt.month, dt.day);

      if (date == today) return 'Today';
      if (date == tomorrow) return 'Tomorrow';

      final weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
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
      return '${weekdays[dt.weekday - 1]}, ${months[dt.month - 1]} ${dt.day}';
    } catch (_) {
      return '';
    }
  }
}
