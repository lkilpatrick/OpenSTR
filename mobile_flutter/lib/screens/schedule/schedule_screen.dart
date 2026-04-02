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
  List<UpcomingClean> _cleans = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchUpcoming();
  }

  Future<void> _fetchUpcoming() async {
    setState(() => _loading = true);
    try {
      final res = await _api.dio.get('/sessions/upcoming-cleans');
      final items = (res.data as List)
          .map((e) => UpcomingClean.fromJson(e as Map<String, dynamic>))
          .toList();
      setState(() {
        _cleans = items;
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
      _fetchUpcoming();
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
      _fetchUpcoming();
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not submit backup request')),
        );
      }
    }
  }

  Future<void> _claimClean(UpcomingClean clean) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Claim This Clean'),
        content: Text(
          'Assign yourself to clean ${clean.propertyName} on ${_formatDate(clean.checkoutDate)}?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Claim'),
          ),
        ],
      ),
    );
    if (confirm != true) return;
    try {
      await _api.dio.post(
        '/sessions/claim',
        data: {
          'property_id': clean.propertyId,
          'reservation_id': clean.reservationId,
          'scheduled_date': clean.checkoutDate,
        },
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Clean claimed! You can start when ready.'),
          ),
        );
      }
      _fetchUpcoming();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not claim this clean')),
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

    if (_cleans.isEmpty) {
      return RefreshIndicator(
        color: OceanTheme.primary,
        onRefresh: _fetchUpcoming,
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

    final todayCleans = <UpcomingClean>[];
    final thisWeekCleans = <UpcomingClean>[];
    final laterCleans = <UpcomingClean>[];

    for (final c in _cleans) {
      final dt = DateTime.tryParse(c.checkoutDate);
      if (dt == null) {
        laterCleans.add(c);
        continue;
      }
      final date = DateTime(dt.year, dt.month, dt.day);
      if (date == today) {
        todayCleans.add(c);
      } else if (date.isAfter(today) && date.isBefore(weekEnd)) {
        thisWeekCleans.add(c);
      } else {
        laterCleans.add(c);
      }
    }

    return RefreshIndicator(
      color: OceanTheme.primary,
      onRefresh: _fetchUpcoming,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (todayCleans.isNotEmpty) ...[
            _sectionHeader('Today'),
            ...todayCleans.map((c) => _buildCleanCard(c, isToday: true)),
            const SizedBox(height: 16),
          ],
          if (thisWeekCleans.isNotEmpty) ...[
            _sectionHeader('This Week'),
            ...thisWeekCleans.map((c) => _buildCleanCard(c)),
            const SizedBox(height: 16),
          ],
          if (laterCleans.isNotEmpty) ...[
            _sectionHeader(
              todayCleans.isEmpty && thisWeekCleans.isEmpty
                  ? 'Upcoming Cleans'
                  : 'Later',
            ),
            ...laterCleans.map((c) => _buildCleanCard(c)),
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

  Widget _buildCleanCard(UpcomingClean clean, {bool isToday = false}) {
    final hasSession = clean.sessionId != null;
    final isPending = clean.sessionStatus == 'pending';
    final isAccepted = clean.sessionStatus == 'accepted';
    final isInProgress = clean.sessionStatus == 'in_progress';
    final canOpen = (isAccepted || isInProgress) && clean.sessionId != null;
    final nights = _nightsBetween(clean.checkinDate, clean.checkoutDate);
    final guestLabel = clean.guestName ?? clean.summary ?? 'Guest';

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
            onTap: canOpen
                ? () async {
                    await Navigator.of(
                      context,
                    ).pushNamed('/session', arguments: clean.sessionId);
                    _fetchUpcoming();
                  }
                : null,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Property name + status badge
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
                          clean.propertyName,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: OceanTheme.text,
                          ),
                        ),
                      ),
                      if (hasSession)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: OceanTheme.statusColor(
                              clean.sessionStatus ?? '',
                            ),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            (clean.sessionStatus ?? '').replaceAll('_', ' '),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        )
                      else
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFF94A3B8),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Text(
                            'not assigned',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  // Guest name + nights
                  Row(
                    children: [
                      const Icon(
                        Icons.person_outline,
                        size: 14,
                        color: OceanTheme.textSecondary,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        guestLabel,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          color: OceanTheme.text,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        '$nights night${nights == 1 ? '' : 's'}',
                        style: const TextStyle(
                          fontSize: 13,
                          color: OceanTheme.textSecondary,
                        ),
                      ),
                      if (clean.numGuests != null) ...[
                        const SizedBox(width: 8),
                        Text(
                          '· ${clean.numGuests} guest${clean.numGuests == 1 ? '' : 's'}',
                          style: const TextStyle(
                            fontSize: 13,
                            color: OceanTheme.textSecondary,
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 6),
                  // Clean date (checkout) + stay dates
                  Row(
                    children: [
                      Icon(
                        Icons.cleaning_services,
                        size: 14,
                        color: OceanTheme.primary.withValues(alpha: 0.7),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'Clean: ${_formatDate(clean.checkoutDate)}',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: OceanTheme.primary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Stay: ${_formatShort(clean.checkinDate)} → ${_formatShort(clean.checkoutDate)}',
                    style: const TextStyle(
                      fontSize: 12,
                      color: OceanTheme.textSecondary,
                    ),
                  ),
                  // Assigned cleaner
                  if (clean.cleanerName != null) ...[
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        const Icon(
                          Icons.badge_outlined,
                          size: 14,
                          color: OceanTheme.textSecondary,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          clean.cleanerName!,
                          style: const TextStyle(
                            fontSize: 12,
                            color: OceanTheme.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ),
          // Action buttons for pending sessions
          if (isPending && clean.sessionId != null)
            Container(
              decoration: const BoxDecoration(
                border: Border(top: BorderSide(color: Color(0xFFF1F5F9))),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: InkWell(
                      onTap: () => _acceptSession(clean.sessionId!),
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
                      onTap: () => _requestBackup(clean.sessionId!),
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
          if (isAccepted && clean.sessionId != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () async {
                    await Navigator.of(
                      context,
                    ).pushNamed('/session', arguments: clean.sessionId);
                    _fetchUpcoming();
                  },
                  child: const Text(
                    'Start Clean →',
                    style: TextStyle(fontWeight: FontWeight.w700),
                  ),
                ),
              ),
            ),
          // Continue button for in-progress sessions
          if (isInProgress && clean.sessionId != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () async {
                    await Navigator.of(
                      context,
                    ).pushNamed('/session', arguments: clean.sessionId);
                    _fetchUpcoming();
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF16A34A),
                    foregroundColor: Colors.white,
                  ),
                  child: const Text(
                    'Continue Clean →',
                    style: TextStyle(fontWeight: FontWeight.w700),
                  ),
                ),
              ),
            ),
          // Claim button for unassigned cleans (no session yet)
          if (!hasSession)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () => _claimClean(clean),
                  icon: const Icon(Icons.back_hand, size: 18),
                  label: const Text(
                    'Claim This Clean',
                    style: TextStyle(fontWeight: FontWeight.w700),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: OceanTheme.primary,
                    foregroundColor: Colors.white,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  int _nightsBetween(String checkin, String checkout) {
    try {
      final a = DateTime.parse(checkin);
      final b = DateTime.parse(checkout);
      return b.difference(a).inDays;
    } catch (_) {
      return 0;
    }
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

  String _formatShort(String iso) {
    try {
      final dt = DateTime.parse(iso);
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
      return '${months[dt.month - 1]} ${dt.day}';
    } catch (_) {
      return '';
    }
  }
}
