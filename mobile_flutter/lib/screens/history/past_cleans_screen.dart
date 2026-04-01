import 'package:flutter/material.dart';
import '../../theme.dart';
import '../../services/api_service.dart';
import '../../models/models.dart';

class PastCleansScreen extends StatefulWidget {
  const PastCleansScreen({super.key});

  @override
  State<PastCleansScreen> createState() => _PastCleansScreenState();
}

class _PastCleansScreenState extends State<PastCleansScreen> {
  final _api = ApiService();

  List<CleanSession> _sessions = [];
  bool _loading = true;
  CleanSession? _selectedSession;
  List<Map<String, dynamic>> _notes = [];
  bool _loadingDetail = false;
  final _noteController = TextEditingController();
  bool _submittingNote = false;

  @override
  void initState() {
    super.initState();
    _fetchPastCleans();
  }

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
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

  Future<void> _selectSession(CleanSession session) async {
    setState(() {
      _selectedSession = session;
      _loadingDetail = true;
      _notes = [];
    });
    try {
      final response = await _api.dio.get('/sessions/${session.id}/notes');
      final list = (response.data as List)
          .map((e) => e as Map<String, dynamic>)
          .toList();
      setState(() {
        _notes = list;
        _loadingDetail = false;
      });
    } catch (_) {
      setState(() => _loadingDetail = false);
    }
  }

  Future<void> _addNote() async {
    final text = _noteController.text.trim();
    if (text.isEmpty) return;
    setState(() => _submittingNote = true);
    try {
      await _api.dio.post(
        '/sessions/${_selectedSession!.id}/notes',
        data: {'content': text},
      );
      _noteController.clear();
      await _selectSession(_selectedSession!);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Failed to add note')));
      }
    } finally {
      if (mounted) setState(() => _submittingNote = false);
    }
  }

  void _goBack() {
    setState(() {
      _selectedSession = null;
      _notes = [];
    });
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
    if (_selectedSession != null) return _buildDetailView();
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
                onTap: () => _selectSession(s),
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

  Widget _buildDetailView() {
    final s = _selectedSession!;
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.fromLTRB(8, 8, 16, 0),
          child: Row(
            children: [
              TextButton.icon(
                onPressed: _goBack,
                icon: const Icon(Icons.arrow_back, size: 18),
                label: const Text('Back'),
                style: TextButton.styleFrom(
                  foregroundColor: OceanTheme.primary,
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: _statusColor(s.status).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  s.status.toUpperCase(),
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: _statusColor(s.status),
                  ),
                ),
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
          child: Align(
            alignment: Alignment.centerLeft,
            child: Text(
              s.propertyName ?? 'Property',
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: OceanTheme.text,
              ),
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 4),
          child: Row(
            children: [
              const Icon(
                Icons.calendar_today,
                size: 14,
                color: OceanTheme.textSecondary,
              ),
              const SizedBox(width: 4),
              Text(
                _formatDate(s.scheduledDate ?? s.createdAt),
                style: const TextStyle(
                  fontSize: 13,
                  color: OceanTheme.textSecondary,
                ),
              ),
              if (s.guestRating != null) ...[
                const SizedBox(width: 16),
                const Icon(Icons.star, size: 14, color: Color(0xFFF59E0B)),
                const SizedBox(width: 2),
                Text(
                  '${s.guestRating}/5',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ],
          ),
        ),
        const Divider(height: 16),
        // Notes section
        Expanded(
          child: _loadingDetail
              ? const Center(
                  child: CircularProgressIndicator(color: OceanTheme.primary),
                )
              : ListView(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                  children: [
                    const Text(
                      'Notes',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: OceanTheme.text,
                      ),
                    ),
                    const SizedBox(height: 8),
                    if (_notes.isEmpty)
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 12),
                        child: Text(
                          'No notes yet',
                          style: TextStyle(
                            color: OceanTheme.textSecondary,
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                      ),
                    ..._notes.map(
                      (n) => Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: OceanTheme.surface,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              (n['content'] ?? '') as String,
                              style: const TextStyle(
                                fontSize: 14,
                                color: OceanTheme.text,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _formatDate(
                                (n['created_at'] ?? n['createdAt'] ?? '')
                                    as String,
                              ),
                              style: const TextStyle(
                                fontSize: 11,
                                color: OceanTheme.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
        ),
        // Add note input
        Container(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
          decoration: const BoxDecoration(
            color: Colors.white,
            border: Border(top: BorderSide(color: Color(0xFFE5E7EB))),
          ),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _noteController,
                  decoration: InputDecoration(
                    hintText: 'Add a note...',
                    hintStyle: const TextStyle(color: OceanTheme.textSecondary),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 10,
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(
                        color: OceanTheme.primary,
                        width: 2,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              IconButton(
                onPressed: _submittingNote ? null : _addNote,
                icon: _submittingNote
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: OceanTheme.primary,
                        ),
                      )
                    : const Icon(Icons.send, color: OceanTheme.primary),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
