import 'package:flutter/material.dart';
import '../../theme.dart';
import '../../services/api_service.dart';
import '../common/photo_viewer.dart';
import '../session/active_session_screen.dart';

class CleanDetailScreen extends StatefulWidget {
  final String sessionId;

  const CleanDetailScreen({super.key, required this.sessionId});

  @override
  State<CleanDetailScreen> createState() => _CleanDetailScreenState();
}

class _CleanDetailScreenState extends State<CleanDetailScreen> {
  final _api = ApiService();
  Map<String, dynamic>? _detail;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchDetail();
  }

  Future<void> _fetchDetail() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await _api.dio.get('/sessions/${widget.sessionId}/detail');
      setState(() {
        _detail = res.data as Map<String, dynamic>;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load clean details';
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_detail?['property_name'] ?? 'Clean Detail')),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: OceanTheme.primary),
            )
          : _error != null
          ? Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    _error!,
                    style: const TextStyle(color: OceanTheme.textSecondary),
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: _fetchDetail,
                    child: const Text('Retry'),
                  ),
                ],
              ),
            )
          : RefreshIndicator(onRefresh: _fetchDetail, child: _buildContent()),
    );
  }

  Widget _buildContent() {
    final d = _detail!;
    final rooms = (d['rooms'] as List?) ?? [];
    final notes = (d['notes'] as List?) ?? [];
    final rating = d['rating'] as Map<String, dynamic>?;
    final status = d['status'] as String? ?? '';

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Session header card
        _buildHeaderCard(d, status, rating),
        const SizedBox(height: 16),

        // Rejection action card
        if (status == 'rejected') ...[
          _buildRejectionCard(d),
          const SizedBox(height: 16),
        ],

        // Timeline card
        _buildTimelineCard(d),
        const SizedBox(height: 16),

        // Room-by-room breakdown
        if (rooms.isNotEmpty) ...[
          const Text(
            'Room Breakdown',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: OceanTheme.text,
            ),
          ),
          const SizedBox(height: 10),
          ...rooms.asMap().entries.map(
            (e) => _buildRoomCard(
              e.value as Map<String, dynamic>,
              e.key + 1,
              rooms.length,
            ),
          ),
          const SizedBox(height: 16),
        ],

        // Notes
        if (notes.isNotEmpty) ...[
          const Text(
            'Cleaner Notes',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: OceanTheme.text,
            ),
          ),
          const SizedBox(height: 10),
          ...notes.map((n) => _buildNoteCard(n as Map<String, dynamic>)),
          const SizedBox(height: 16),
        ],

        // Guest rating
        if (rating != null) ...[
          _buildRatingCard(rating),
          const SizedBox(height: 16),
        ],

        const SizedBox(height: 32),
      ],
    );
  }

  Future<void> _redoClean(String sessionId) async {
    try {
      await _api.dio.patch(
        '/sessions/$sessionId/status',
        data: {'status': 'in_progress'},
      );
      if (mounted) {
        await Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => ActiveSessionScreen(sessionId: sessionId),
          ),
        );
        _fetchDetail();
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not reopen this clean')),
        );
      }
    }
  }

  Widget _buildRejectionCard(Map<String, dynamic> d) {
    final reason = d['rejection_reason'] as String?;
    final sessionId = d['id'] as String;
    return Card(
      color: const Color(0xFFFEF2F2),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: OceanTheme.error.withValues(alpha: 0.3)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.cancel, size: 18, color: OceanTheme.error),
                const SizedBox(width: 8),
                const Text(
                  'Clean Rejected',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: OceanTheme.error,
                  ),
                ),
              ],
            ),
            if (reason != null && reason.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                reason,
                style: const TextStyle(fontSize: 13, color: OceanTheme.error),
              ),
            ],
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => _redoClean(sessionId),
                icon: const Icon(Icons.replay, size: 18),
                label: const Text(
                  'Redo This Clean',
                  style: TextStyle(fontWeight: FontWeight.w700),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: OceanTheme.error,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeaderCard(
    Map<String, dynamic> d,
    String status,
    Map<String, dynamic>? rating,
  ) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.waves, size: 20, color: OceanTheme.primary),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    d['property_name'] ?? 'Property',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: OceanTheme.text,
                    ),
                  ),
                ),
                _statusBadge(status),
              ],
            ),
            const SizedBox(height: 12),
            _infoRow(
              Icons.calendar_today,
              'Scheduled',
              _formatDate(d['scheduled_date'] ?? d['created_at']),
            ),
            if (d['session_type'] != null)
              _infoRow(
                Icons.cleaning_services,
                'Type',
                (d['session_type'] as String).replaceAll('_', ' '),
              ),
            if (d['cleaner_name'] != null)
              _infoRow(Icons.badge_outlined, 'Cleaner', d['cleaner_name']),
            if (d['triggered_by'] != null)
              _infoRow(
                Icons.bolt,
                'Triggered by',
                (d['triggered_by'] as String).replaceAll('_', ' '),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildTimelineCard(Map<String, dynamic> d) {
    final startTime = d['cleaner_start_time'] as String?;
    final endTime = d['cleaner_end_time'] as String?;
    final submittedAt = d['submitted_at'] as String?;
    final reviewedAt = d['reviewed_at'] as String?;
    final createdAt = d['created_at'] as String?;

    final events = <_TimelineEvent>[];

    if (createdAt != null) {
      events.add(
        _TimelineEvent(
          'Session Created',
          createdAt,
          Icons.add_circle,
          const Color(0xFF6B7280),
        ),
      );
    }
    if (startTime != null) {
      events.add(
        _TimelineEvent(
          'Cleaning Started',
          startTime,
          Icons.play_circle,
          OceanTheme.primary,
        ),
      );
    }
    if (endTime != null) {
      events.add(
        _TimelineEvent(
          'Cleaning Finished',
          endTime,
          Icons.stop_circle,
          OceanTheme.success,
        ),
      );
    }
    if (submittedAt != null) {
      events.add(
        _TimelineEvent(
          'Submitted for Review',
          submittedAt,
          Icons.upload,
          OceanTheme.statusSubmitted,
        ),
      );
    }
    if (reviewedAt != null) {
      final status = d['status'] as String? ?? '';
      events.add(
        _TimelineEvent(
          status == 'approved' ? 'Approved' : 'Reviewed',
          reviewedAt,
          status == 'approved' ? Icons.check_circle : Icons.rate_review,
          status == 'approved' ? OceanTheme.success : OceanTheme.warning,
        ),
      );
    }

    // Calculate duration
    String? duration;
    if (startTime != null && endTime != null) {
      try {
        final start = DateTime.parse(startTime);
        final end = DateTime.parse(endTime);
        final diff = end.difference(start);
        final hours = diff.inHours;
        final mins = diff.inMinutes % 60;
        duration = hours > 0 ? '${hours}h ${mins}m' : '${mins}m';
      } catch (_) {}
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.timeline, size: 18, color: OceanTheme.primary),
                const SizedBox(width: 8),
                const Text(
                  'Timeline',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: OceanTheme.text,
                  ),
                ),
                if (duration != null) ...[
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: OceanTheme.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      'Duration: $duration',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: OceanTheme.primary,
                      ),
                    ),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 12),
            ...events.asMap().entries.map((e) {
              final event = e.value;
              final isLast = e.key == events.length - 1;
              return IntrinsicHeight(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(
                      width: 28,
                      child: Column(
                        children: [
                          Icon(event.icon, size: 20, color: event.color),
                          if (!isLast)
                            Expanded(
                              child: Container(
                                width: 2,
                                margin: const EdgeInsets.symmetric(vertical: 2),
                                color: const Color(0xFFE5E7EB),
                              ),
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Padding(
                        padding: EdgeInsets.only(bottom: isLast ? 0 : 14),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              event.label,
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: OceanTheme.text,
                              ),
                            ),
                            Text(
                              _formatDateTime(event.timestamp),
                              style: const TextStyle(
                                fontSize: 12,
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
            }),
          ],
        ),
      ),
    );
  }

  Widget _buildRoomCard(Map<String, dynamic> room, int index, int total) {
    final photos = (room['photos'] as List?) ?? [];
    final tasks = (room['tasks'] as List?) ?? [];
    final beforePhotos = photos
        .where((p) => (p as Map<String, dynamic>)['type'] == 'before')
        .toList();
    final afterPhotos = photos
        .where((p) => (p as Map<String, dynamic>)['type'] == 'after')
        .toList();
    final issuePhotos = photos
        .where((p) => (p as Map<String, dynamic>)['type'] == 'issue')
        .toList();
    final roomStatus = room['status'] as String? ?? 'pending';
    final startedAt = room['started_at'] as String?;
    final completedAt = room['completed_at'] as String?;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Room header
            Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: OceanTheme.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    '$index',
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: OceanTheme.primary,
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        room['display_name'] ?? 'Room $index',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: OceanTheme.text,
                        ),
                      ),
                      if (startedAt != null || completedAt != null)
                        Text(
                          [
                            if (startedAt != null)
                              'Started ${_formatTime(startedAt)}',
                            if (completedAt != null)
                              'Done ${_formatTime(completedAt)}',
                          ].join(' · '),
                          style: const TextStyle(
                            fontSize: 11,
                            color: OceanTheme.textSecondary,
                          ),
                        ),
                    ],
                  ),
                ),
                _statusBadge(roomStatus),
              ],
            ),

            // Before photos
            if (beforePhotos.isNotEmpty) ...[
              const SizedBox(height: 14),
              _photoSection(
                'Before',
                beforePhotos,
                Icons.camera_alt,
                OceanTheme.warning,
              ),
            ],

            // Tasks
            if (tasks.isNotEmpty) ...[
              const SizedBox(height: 14),
              const Text(
                'Tasks',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: OceanTheme.textSecondary,
                  letterSpacing: 0.5,
                ),
              ),
              const SizedBox(height: 6),
              ...tasks.map((t) {
                final task = t as Map<String, dynamic>;
                final completed = task['completed'] == true;
                final label = task['label'] ?? 'Task';
                final notes = task['notes'] as String?;
                final isRequired = task['is_required'] == true;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(
                        completed
                            ? Icons.check_circle
                            : Icons.radio_button_unchecked,
                        size: 18,
                        color: completed
                            ? OceanTheme.success
                            : OceanTheme.textSecondary,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text.rich(
                              TextSpan(
                                text: label as String,
                                style: TextStyle(
                                  fontSize: 13,
                                  color: completed
                                      ? OceanTheme.text
                                      : OceanTheme.textSecondary,
                                  decoration: completed
                                      ? null
                                      : TextDecoration.lineThrough,
                                ),
                                children: [
                                  if (isRequired)
                                    const TextSpan(
                                      text: ' *',
                                      style: TextStyle(
                                        color: OceanTheme.error,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                ],
                              ),
                            ),
                            if (notes != null && notes.isNotEmpty)
                              Padding(
                                padding: const EdgeInsets.only(top: 2),
                                child: Text(
                                  notes,
                                  style: const TextStyle(
                                    fontSize: 11,
                                    fontStyle: FontStyle.italic,
                                    color: OceanTheme.textSecondary,
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              }),
            ],

            // After photos
            if (afterPhotos.isNotEmpty) ...[
              const SizedBox(height: 14),
              _photoSection(
                'After',
                afterPhotos,
                Icons.camera_alt,
                OceanTheme.success,
              ),
            ],

            // Issue photos
            if (issuePhotos.isNotEmpty) ...[
              const SizedBox(height: 14),
              _photoSection(
                'Issues',
                issuePhotos,
                Icons.warning_amber,
                OceanTheme.error,
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _photoSection(
    String label,
    List<dynamic> photos,
    IconData icon,
    Color color,
  ) {
    final baseUrl = _api.dio.options.baseUrl;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 14, color: color),
            const SizedBox(width: 6),
            Text(
              '$label Photos',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: color,
                letterSpacing: 0.5,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        SizedBox(
          height: 100,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: photos.length,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (context, index) {
              final photo = photos[index] as Map<String, dynamic>;
              final storagePath = photo['storage_path'] as String? ?? '';
              final photoUrl = '$baseUrl$storagePath';
              return GestureDetector(
                onTap: () => _openPhotoViewer(context, photos, index),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.network(
                    photoUrl,
                    width: 100,
                    height: 100,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      width: 100,
                      height: 100,
                      color: const Color(0xFFF1F5F9),
                      child: Icon(
                        Icons.broken_image,
                        color: OceanTheme.textSecondary.withValues(alpha: 0.5),
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  void _openPhotoViewer(
    BuildContext context,
    List<dynamic> photos,
    int initialIndex,
  ) {
    final baseUrl = _api.dio.options.baseUrl;
    final photoList = photos.map((p) {
      final photo = p as Map<String, dynamic>;
      return PhotoViewItem(
        url: '$baseUrl${photo['storage_path']}',
        type: photo['type'] as String? ?? 'photo',
        takenAt: photo['taken_at'] as String?,
        uploadedAt: photo['uploaded_at'] as String?,
        fileSizeKb: photo['file_size_kb'] as int?,
      );
    }).toList();

    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) =>
            PhotoViewerScreen(photos: photoList, initialIndex: initialIndex),
      ),
    );
  }

  Widget _buildNoteCard(Map<String, dynamic> note) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                color: OceanTheme.primary.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.note,
                size: 14,
                color: OceanTheme.primary,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    (note['note'] ?? note['content'] ?? '') as String,
                    style: const TextStyle(
                      fontSize: 14,
                      color: OceanTheme.text,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    [
                      if (note['author_name'] != null) note['author_name'],
                      _formatDateTime((note['created_at'] ?? '') as String),
                    ].join(' · '),
                    style: const TextStyle(
                      fontSize: 11,
                      color: OceanTheme.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRatingCard(Map<String, dynamic> rating) {
    final ratingValue = rating['rating'] as int? ?? 0;
    final reviewText = rating['review_text'] as String?;
    final color = OceanTheme.ratingColor(ratingValue);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Guest Rating',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: OceanTheme.text,
              ),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                ...List.generate(
                  5,
                  (i) => Icon(
                    i < ratingValue ? Icons.star : Icons.star_border,
                    color: i < ratingValue ? color : const Color(0xFFD1D5DB),
                    size: 28,
                  ),
                ),
                const SizedBox(width: 10),
                Text(
                  '$ratingValue/5',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
              ],
            ),
            if (reviewText != null && reviewText.isNotEmpty) ...[
              const SizedBox(height: 10),
              Text(
                reviewText,
                style: const TextStyle(
                  fontSize: 14,
                  fontStyle: FontStyle.italic,
                  color: OceanTheme.textSecondary,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _statusBadge(String status) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: OceanTheme.statusColor(status).withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        status.replaceAll('_', ' '),
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          color: OceanTheme.statusColor(status),
        ),
      ),
    );
  }

  Widget _infoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          Icon(icon, size: 14, color: OceanTheme.textSecondary),
          const SizedBox(width: 8),
          Text(
            '$label: ',
            style: const TextStyle(
              fontSize: 13,
              color: OceanTheme.textSecondary,
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: OceanTheme.text,
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return 'Unknown';
    try {
      final d = DateTime.parse(dateStr);
      const months = [
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

  String _formatDateTime(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return '';
    try {
      final d = DateTime.parse(dateStr).toLocal();
      const months = [
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
      final hour = d.hour > 12 ? d.hour - 12 : (d.hour == 0 ? 12 : d.hour);
      final amPm = d.hour >= 12 ? 'PM' : 'AM';
      final min = d.minute.toString().padLeft(2, '0');
      return '${months[d.month - 1]} ${d.day} at $hour:$min $amPm';
    } catch (_) {
      return dateStr;
    }
  }

  String _formatTime(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return '';
    try {
      final d = DateTime.parse(dateStr).toLocal();
      final hour = d.hour > 12 ? d.hour - 12 : (d.hour == 0 ? 12 : d.hour);
      final amPm = d.hour >= 12 ? 'PM' : 'AM';
      final min = d.minute.toString().padLeft(2, '0');
      return '$hour:$min $amPm';
    } catch (_) {
      return dateStr;
    }
  }
}

class _TimelineEvent {
  final String label;
  final String timestamp;
  final IconData icon;
  final Color color;

  _TimelineEvent(this.label, this.timestamp, this.icon, this.color);
}
