import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:image_picker/image_picker.dart';
import '../../theme.dart';
import '../../services/api_service.dart';
import '../../models/models.dart';
import 'guest_rating_screen.dart';

enum RoomStep { beforePhoto, tasks, afterPhoto, issuePhoto }

class ActiveSessionScreen extends StatefulWidget {
  final String sessionId;

  const ActiveSessionScreen({super.key, required this.sessionId});

  @override
  State<ActiveSessionScreen> createState() => _ActiveSessionScreenState();
}

class _ActiveSessionScreenState extends State<ActiveSessionScreen> {
  final _api = ApiService();
  final _picker = ImagePicker();

  List<RoomClean> _rooms = [];
  List<Task> _tasks = [];
  String? _propertyId;
  bool _loadingRooms = true;
  bool _loadingTasks = false;
  bool _uploading = false;
  bool _started = false;
  bool _showRating = false;

  int _currentRoomIdx = 0;
  RoomStep _roomStep = RoomStep.beforePhoto;
  final Map<String, Set<String>> _completedTasks = {};
  final Map<String, List<Photo>> _roomPhotos = {};
  final Map<String, String> _roomNotes = {};

  @override
  void initState() {
    super.initState();
    _fetchRooms();
  }

  Future<void> _fetchRooms() async {
    try {
      final response = await _api.dio.get(
        '/sessions/${widget.sessionId}/rooms',
      );
      final list = (response.data as List)
          .map((e) => RoomClean.fromJson(e as Map<String, dynamic>))
          .toList();
      // Also fetch property_id and check session status
      final sessionRes = await _api.dio.get('/sessions/${widget.sessionId}');
      final sessionData = sessionRes.data as Map<String, dynamic>;
      _propertyId = sessionData['property_id'] as String?;
      final status = sessionData['status'] as String?;
      setState(() {
        _rooms = list;
        _loadingRooms = false;
        // Auto-resume if session is already in progress
        if (status == 'in_progress') {
          _started = true;
        }
      });
    } catch (_) {
      setState(() => _loadingRooms = false);
    }
  }

  Future<void> _fetchTasks(String roomId) async {
    if (_propertyId == null) return;
    setState(() => _loadingTasks = true);
    try {
      final tasksRes = await _api.dio.get(
        '/properties/$_propertyId/rooms/$roomId/tasks',
      );
      final list = (tasksRes.data as List)
          .map((e) => Task.fromJson(e as Map<String, dynamic>))
          .toList();
      setState(() {
        _tasks = list;
        _loadingTasks = false;
      });
    } catch (_) {
      setState(() => _loadingTasks = false);
    }
  }

  RoomClean? get _currentRoom =>
      _rooms.isNotEmpty ? _rooms[_currentRoomIdx] : null;

  bool get _allRequiredTasksDone {
    final room = _currentRoom;
    if (room == null) return false;
    final completed = _completedTasks[room.id] ?? {};
    return _tasks
        .where((t) => t.required)
        .every((t) => completed.contains(t.id));
  }

  Future<Photo?> _takePhoto(String type) async {
    final room = _currentRoom;
    if (room == null) return null;

    final XFile? image = await _picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 70,
    );
    if (image == null) return null;

    setState(() => _uploading = true);
    try {
      final bytes = await image.readAsBytes();
      final formData = FormData.fromMap({
        'photo': MultipartFile.fromBytes(
          bytes,
          filename: '${type}_${DateTime.now().millisecondsSinceEpoch}.jpg',
        ),
        'type': type,
        'taken_at': DateTime.now().toIso8601String(),
      });

      final response = await _api.dio.post(
        '/photos/${room.id}',
        data: formData,
      );
      final photo = Photo.fromJson(response.data as Map<String, dynamic>);

      setState(() {
        _roomPhotos.putIfAbsent(room.id, () => []);
        _roomPhotos[room.id]!.add(photo);
        _uploading = false;
      });
      return photo;
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not upload photo. Try again.')),
        );
        setState(() => _uploading = false);
      }
      return null;
    }
  }

  Future<void> _handleBeforePhoto() async {
    final photo = await _takePhoto('before');
    if (photo != null) {
      setState(() => _roomStep = RoomStep.tasks);
      final room = _currentRoom;
      if (room != null) _fetchTasks(room.roomId);
    }
  }

  Future<void> _handleTaskComplete(String taskId) async {
    final room = _currentRoom;
    if (room == null) return;
    try {
      await _api.dio.post(
        '/photos/${room.id}/tasks/$taskId/complete',
        data: {},
      );
      setState(() {
        _completedTasks.putIfAbsent(room.id, () => {});
        _completedTasks[room.id]!.add(taskId);
      });
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to complete task')),
        );
      }
    }
  }

  Future<void> _handleTaskUncomplete(String taskId) async {
    final room = _currentRoom;
    if (room == null) return;
    try {
      await _api.dio.delete('/photos/${room.id}/tasks/$taskId/complete');
      setState(() {
        _completedTasks[room.id]?.remove(taskId);
      });
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to uncheck task')),
        );
      }
    }
  }

  Future<void> _handleAfterPhoto() async {
    final photo = await _takePhoto('after');
    if (photo != null) {
      setState(() => _roomStep = RoomStep.issuePhoto);
    }
  }

  Future<void> _handleIssuePhoto() async {
    await _takePhoto('issue');
  }

  // Submitted issues for this session (title + id for display)
  final List<Map<String, String>> _submittedIssues = [];

  Future<void> _showReportIssueSheet() async {
    final titleCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    String severity = 'medium';
    XFile? pickedPhoto;
    bool submitting = false;

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheet) => Padding(
          padding: EdgeInsets.only(
            left: 20, right: 20, top: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('Report an Issue',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                TextField(
                  controller: titleCtrl,
                  decoration: InputDecoration(
                    labelText: 'Title *',
                    hintText: 'e.g. Broken shower head',
                    filled: true,
                    fillColor: OceanTheme.surface,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: descCtrl,
                  maxLines: 3,
                  decoration: InputDecoration(
                    labelText: 'Notes (optional)',
                    hintText: 'Describe the issue in detail...',
                    filled: true,
                    fillColor: OceanTheme.surface,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                const Text('Severity', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                const SizedBox(height: 6),
                Row(
                  children: [
                    for (final s in ['low', 'medium', 'high'])
                      Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(s[0].toUpperCase() + s.substring(1)),
                          selected: severity == s,
                          selectedColor: s == 'high'
                              ? OceanTheme.error
                              : s == 'medium'
                              ? OceanTheme.warning
                              : OceanTheme.success,
                          labelStyle: TextStyle(
                            color: severity == s ? Colors.white : OceanTheme.text,
                            fontWeight: FontWeight.w600,
                          ),
                          onSelected: (_) => setSheet(() => severity = s),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: () async {
                    final img = await _picker.pickImage(
                      source: ImageSource.camera,
                      imageQuality: 70,
                    );
                    if (img != null) setSheet(() => pickedPhoto = img);
                  },
                  icon: Icon(
                    pickedPhoto != null ? Icons.check_circle : Icons.camera_alt,
                    color: pickedPhoto != null ? OceanTheme.success : OceanTheme.warning,
                  ),
                  label: Text(
                    pickedPhoto != null ? 'Photo attached' : 'Add Photo (optional)',
                    style: TextStyle(
                      color: pickedPhoto != null ? OceanTheme.success : OceanTheme.warning,
                    ),
                  ),
                  style: OutlinedButton.styleFrom(
                    side: BorderSide(
                      color: pickedPhoto != null ? OceanTheme.success : OceanTheme.warning,
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: submitting
                        ? null
                        : () async {
                            if (titleCtrl.text.trim().isEmpty) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Please enter a title')),
                              );
                              return;
                            }
                            setSheet(() => submitting = true);
                            try {
                              // Create the issue record
                              final res = await _api.dio.post('/issues', data: {
                                'property_id': _propertyId,
                                'session_id': widget.sessionId,
                                'title': titleCtrl.text.trim(),
                                'description': descCtrl.text.trim().isEmpty
                                    ? null
                                    : descCtrl.text.trim(),
                                'severity': severity,
                              });
                              final issueId = res.data['id'] as String;

                              // Upload photo if one was taken
                              if (pickedPhoto != null && _currentRoom != null) {
                                final bytes = await pickedPhoto!.readAsBytes();
                                final formData = FormData.fromMap({
                                  'photo': MultipartFile.fromBytes(
                                    bytes,
                                    filename: 'issue_${DateTime.now().millisecondsSinceEpoch}.jpg',
                                  ),
                                  'type': 'issue',
                                  'taken_at': DateTime.now().toIso8601String(),
                                });
                                await _api.dio.post('/photos/${_currentRoom!.id}', data: formData);
                              }

                              setState(() {
                                _submittedIssues.add({
                                  'id': issueId,
                                  'title': titleCtrl.text.trim(),
                                  'severity': severity,
                                });
                              });
                              if (ctx.mounted) Navigator.of(ctx).pop();
                            } catch (_) {
                              setSheet(() => submitting = false);
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Failed to submit issue')),
                                );
                              }
                            }
                          },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: OceanTheme.error,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: Text(
                      submitting ? 'Submitting...' : 'Submit Issue',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                        fontSize: 15,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _handleFinishRoom() {
    // Mark current room visually done, but allow revisiting
    if (_currentRoomIdx < _rooms.length - 1) {
      setState(() {
        _currentRoomIdx++;
        _roomStep = RoomStep.beforePhoto;
        _tasks = [];
      });
    } else {
      _promptSubmit();
    }
  }

  void _promptSubmit() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('All Rooms Complete'),
        content: const Text('Submit this session for review?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              _submitSession();
            },
            child: const Text('Submit'),
          ),
        ],
      ),
    );
  }

  void _goToRoom(int index) {
    if (index < 0 || index >= _rooms.length) return;
    setState(() {
      _currentRoomIdx = index;
      _roomStep = RoomStep.beforePhoto;
      _tasks = [];
    });
    // Pre-fetch tasks for the room
    _fetchTasks(_rooms[index].roomId);
  }

  Future<void> _startSession() async {
    try {
      await _api.dio.patch(
        '/sessions/${widget.sessionId}/status',
        data: {'status': 'in_progress'},
      );
      setState(() {
        _started = true;
        _currentRoomIdx = 0;
        _roomStep = RoomStep.beforePhoto;
      });
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to start session')),
        );
      }
    }
  }

  Future<void> _submitSession() async {
    try {
      await _api.dio.patch(
        '/sessions/${widget.sessionId}/status',
        data: {'status': 'submitted'},
      );
      setState(() => _showRating = true);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to submit session')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_showRating) {
      return GuestRatingScreen(
        sessionId: widget.sessionId,
        onDone: () => Navigator.of(context).pop(),
      );
    }

    if (_loadingRooms) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(color: OceanTheme.primary),
        ),
      );
    }

    if (!_started) return _buildOverview();

    final room = _currentRoom;
    if (room == null) {
      return const Scaffold(body: Center(child: Text('No rooms found')));
    }

    return _buildActiveSession(room);
  }

  // --- Overview (before start) ---
  Widget _buildOverview() {
    return Scaffold(
      appBar: AppBar(title: const Text('Session Overview')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: OceanTheme.accent,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                const Icon(Icons.waves, color: OceanTheme.primary, size: 32),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${_rooms.length} rooms to clean',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: OceanTheme.text,
                        ),
                      ),
                      const SizedBox(height: 2),
                      const Text(
                        'Before Photo \u2192 Checklist \u2192 After Photo',
                        style: TextStyle(
                          fontSize: 13,
                          color: OceanTheme.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          ..._rooms.asMap().entries.map((entry) {
            final idx = entry.key;
            final room = entry.value;
            return Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: InkWell(
                onTap: () async {
                  await _startSession();
                  if (_started) _goToRoom(idx);
                },
                borderRadius: BorderRadius.circular(12),
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Row(
                    children: [
                      Container(
                        width: 32,
                        height: 32,
                        decoration: const BoxDecoration(
                          color: OceanTheme.primary,
                          shape: BoxShape.circle,
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          '${idx + 1}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                            fontSize: 14,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              room.displayName,
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            if (room.themeName != null)
                              Text(
                                room.themeName!,
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: OceanTheme.textSecondary,
                                ),
                              ),
                          ],
                        ),
                      ),
                      const Icon(
                        Icons.chevron_right,
                        color: OceanTheme.textSecondary,
                      ),
                    ],
                  ),
                ),
              ),
            );
          }),
          const SizedBox(height: 20),
          ElevatedButton.icon(
            onPressed: () {
              showDialog(
                context: context,
                builder: (ctx) => AlertDialog(
                  title: const Text('Start Session'),
                  content: const Text('Begin this clean session?'),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(ctx),
                      child: const Text('Cancel'),
                    ),
                    TextButton(
                      onPressed: () {
                        Navigator.pop(ctx);
                        _startSession();
                      },
                      child: const Text('Start'),
                    ),
                  ],
                ),
              );
            },
            icon: const Icon(Icons.play_arrow),
            label: const Text(
              'Start Session',
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
            ),
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 18),
            ),
          ),
        ],
      ),
    );
  }

  // --- Active session: room-by-room flow with free navigation ---
  Widget _buildActiveSession(RoomClean room) {
    final roomNum = _currentRoomIdx + 1;
    final totalRooms = _rooms.length;
    final photos = _roomPhotos[room.id] ?? [];

    return Scaffold(
      appBar: AppBar(
        title: Text('Room $roomNum of $totalRooms'),
        actions: [
          // Submit button always accessible
          TextButton(
            onPressed: _promptSubmit,
            child: const Text(
              'Submit',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Room selector strip
          _buildRoomStrip(),
          // Main content
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Room header
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: const BoxDecoration(
                          color: OceanTheme.accent,
                          shape: BoxShape.circle,
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          '$roomNum',
                          style: const TextStyle(
                            color: OceanTheme.primary,
                            fontWeight: FontWeight.w700,
                            fontSize: 18,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              room.displayName,
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: OceanTheme.text,
                              ),
                            ),
                            if (room.themeName != null)
                              Text(
                                room.themeName!,
                                style: const TextStyle(
                                  fontSize: 13,
                                  color: OceanTheme.textSecondary,
                                ),
                              ),
                          ],
                        ),
                      ),
                      // Step indicator
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: OceanTheme.accent,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          _stepLabel(_roomStep),
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: OceanTheme.primary,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Step navigation row
                _buildStepNav(room),
                const SizedBox(height: 16),

                // Step content
                if (_roomStep == RoomStep.beforePhoto) _buildBeforePhotoStep(),
                if (_roomStep == RoomStep.tasks) _buildTasksStep(room),
                if (_roomStep == RoomStep.afterPhoto) _buildAfterPhotoStep(),
                if (_roomStep == RoomStep.issuePhoto)
                  _buildIssuePhotoStep(room, photos),

                // Photo summary
                if (photos.isNotEmpty && _roomStep != RoomStep.issuePhoto) ...[
                  const SizedBox(height: 16),
                  _buildPhotoSummary(photos),
                ],
              ],
            ),
          ),
          // Bottom navigation row
          _buildBottomNav(),
        ],
      ),
    );
  }

  String _stepLabel(RoomStep step) {
    switch (step) {
      case RoomStep.beforePhoto:
        return 'Before Photo';
      case RoomStep.tasks:
        return 'Checklist';
      case RoomStep.afterPhoto:
        return 'After Photo';
      case RoomStep.issuePhoto:
        return 'Issues';
    }
  }

  Widget _buildRoomStrip() {
    return Container(
      height: 52,
      color: Colors.white,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
        itemCount: _rooms.length,
        itemBuilder: (context, index) {
          final isSelected = index == _currentRoomIdx;
          final room = _rooms[index];
          final hasPhotos = (_roomPhotos[room.id]?.isNotEmpty ?? false);
          return Padding(
            padding: const EdgeInsets.only(right: 6),
            child: InkWell(
              onTap: () => _goToRoom(index),
              borderRadius: BorderRadius.circular(20),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14),
                decoration: BoxDecoration(
                  color: isSelected ? OceanTheme.primary : OceanTheme.surface,
                  borderRadius: BorderRadius.circular(20),
                  border: hasPhotos && !isSelected
                      ? Border.all(color: OceanTheme.success, width: 2)
                      : null,
                ),
                alignment: Alignment.center,
                child: Text(
                  room.displayName,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: isSelected ? Colors.white : OceanTheme.text,
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildStepNav(RoomClean room) {
    final steps = RoomStep.values;
    return Row(
      children: steps.map((step) {
        final isActive = step == _roomStep;
        final idx = steps.indexOf(step);
        return Expanded(
          child: GestureDetector(
            onTap: () {
              setState(() => _roomStep = step);
              if (step == RoomStep.tasks) _fetchTasks(room.roomId);
            },
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 8),
              decoration: BoxDecoration(
                border: Border(
                  bottom: BorderSide(
                    color: isActive ? OceanTheme.primary : Colors.transparent,
                    width: 3,
                  ),
                ),
              ),
              alignment: Alignment.center,
              child: Text(
                ['📷 Before', '✓ Tasks', '📷 After', '⚠ Issues'][idx],
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
                  color: isActive
                      ? OceanTheme.primary
                      : OceanTheme.textSecondary,
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildBottomNav() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        children: [
          // Previous room
          if (_currentRoomIdx > 0)
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () => _goToRoom(_currentRoomIdx - 1),
                icon: const Icon(Icons.arrow_back, size: 18),
                label: Text(
                  _rooms[_currentRoomIdx - 1].displayName,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 13),
                ),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            )
          else
            const Spacer(),
          const SizedBox(width: 10),
          // Next room / Finish
          if (_currentRoomIdx < _rooms.length - 1)
            Expanded(
              child: ElevatedButton.icon(
                onPressed: () => _goToRoom(_currentRoomIdx + 1),
                icon: Text(
                  _rooms[_currentRoomIdx + 1].displayName,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                label: const Icon(Icons.arrow_forward, size: 18),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            )
          else
            Expanded(
              child: ElevatedButton.icon(
                onPressed: _promptSubmit,
                icon: const Icon(Icons.check_circle, size: 18),
                label: const Text(
                  'Submit',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: OceanTheme.success,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildBeforePhotoStep() {
    return _stepCard(
      icon: Icons.camera_alt,
      iconColor: OceanTheme.primary,
      title: 'Before Photo',
      description:
          'Take a photo showing the current state of this room before cleaning begins.',
      child: Column(
        children: [
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _uploading ? null : _handleBeforePhoto,
              icon: const Icon(Icons.camera_alt),
              label: Text(_uploading ? 'Uploading...' : 'Take Before Photo'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
            ),
          ),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: TextButton(
              onPressed: () {
                setState(() => _roomStep = RoomStep.tasks);
                final room = _currentRoom;
                if (room != null) _fetchTasks(room.roomId);
              },
              child: const Text(
                'Skip to Checklist →',
                style: TextStyle(color: OceanTheme.textSecondary),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTasksStep(RoomClean room) {
    if (_loadingTasks) {
      return _stepCard(
        title: 'Checklist',
        child: const Padding(
          padding: EdgeInsets.symmetric(vertical: 24),
          child: Center(
            child: CircularProgressIndicator(color: OceanTheme.primary),
          ),
        ),
      );
    }

    if (_tasks.isEmpty) {
      return _stepCard(
        title: 'Checklist',
        description: 'No tasks for this room.',
        child: _nextButton(
          label: 'Continue \u2192 Take After Photo',
          onPressed: () => setState(() => _roomStep = RoomStep.afterPhoto),
        ),
      );
    }

    final completed = _completedTasks[room.id] ?? {};

    return _stepCard(
      title: 'Checklist',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Progress indicator
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Text(
              '${completed.length} of ${_tasks.length} tasks done',
              style: const TextStyle(
                fontSize: 13,
                color: OceanTheme.textSecondary,
              ),
            ),
          ),
          ..._tasks.map((task) {
            final done = completed.contains(task.id);
            final isHighTouch = task.isHighTouch == true;
            final isSupplyCheck = task.taskType == 'supply_check';

            return Container(
              margin: const EdgeInsets.only(bottom: 2),
              decoration: BoxDecoration(
                color: isHighTouch && !done ? OceanTheme.accent : null,
                borderRadius: BorderRadius.circular(8),
              ),
              child: InkWell(
                onTap: () => done ? _handleTaskUncomplete(task.id) : _handleTaskComplete(task.id),
                borderRadius: BorderRadius.circular(8),
                child: Opacity(
                  opacity: done ? 0.5 : 1.0,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      vertical: 12,
                      horizontal: 8,
                    ),
                    child: Row(
                      children: [
                        // Checkbox
                        Container(
                          width: 26,
                          height: 26,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(
                              color: done
                                  ? OceanTheme.success
                                  : OceanTheme.primary,
                              width: 2,
                            ),
                            color: done
                                ? OceanTheme.success
                                : Colors.transparent,
                          ),
                          alignment: Alignment.center,
                          child: done
                              ? const Icon(
                                  Icons.check,
                                  size: 16,
                                  color: Colors.white,
                                )
                              : null,
                        ),
                        const SizedBox(width: 12),
                        // Task info
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  if (isHighTouch) ...[
                                    const Text(
                                      '\u{1F590} ',
                                      style: TextStyle(fontSize: 14),
                                    ),
                                  ],
                                  Expanded(
                                    child: Text(
                                      task.label,
                                      style: TextStyle(
                                        fontSize: 14,
                                        fontWeight: isHighTouch
                                            ? FontWeight.w600
                                            : FontWeight.w500,
                                        decoration: done
                                            ? TextDecoration.lineThrough
                                            : null,
                                        color: done
                                            ? OceanTheme.textSecondary
                                            : OceanTheme.text,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              if (isSupplyCheck)
                                const Padding(
                                  padding: EdgeInsets.only(top: 2),
                                  child: Text(
                                    'Supply check',
                                    style: TextStyle(
                                      fontSize: 11,
                                      color: OceanTheme.warning,
                                    ),
                                  ),
                                ),
                              if (task.frequency != null &&
                                  task.frequency != 'every_clean')
                                Padding(
                                  padding: const EdgeInsets.only(top: 2),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 6,
                                      vertical: 1,
                                    ),
                                    decoration: BoxDecoration(
                                      color: OceanTheme.secondary.withValues(
                                        alpha: 0.1,
                                      ),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      task.frequency!.replaceAll('_', ' '),
                                      style: const TextStyle(
                                        fontSize: 10,
                                        color: OceanTheme.secondary,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ),
                        if (task.required && !done)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: OceanTheme.error.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Text(
                              'Required',
                              style: TextStyle(
                                fontSize: 10,
                                color: OceanTheme.error,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              ),
            );
          }),

          // Notes field
          const SizedBox(height: 16),
          TextField(
            onChanged: (val) => _roomNotes[room.id] = val,
            decoration: InputDecoration(
              hintText: 'Other notes (optional)',
              filled: true,
              fillColor: OceanTheme.surface,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide.none,
              ),
              contentPadding: const EdgeInsets.all(14),
            ),
            maxLines: 3,
          ),

          // Next button — always shown, highlighted when all done
          const SizedBox(height: 16),
          _nextButton(
            label: _allRequiredTasksDone
                ? 'All Tasks Done → Take After Photo'
                : 'Continue → Take After Photo',
            onPressed: () => setState(() => _roomStep = RoomStep.afterPhoto),
          ),
          if (!_allRequiredTasksDone) ...[
            const SizedBox(height: 4),
            const Center(
              child: Text(
                'Some required tasks are not yet completed',
                style: TextStyle(fontSize: 11, color: OceanTheme.warning),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildAfterPhotoStep() {
    return _stepCard(
      icon: Icons.camera_alt,
      iconColor: OceanTheme.success,
      title: 'After Photo Required',
      description: 'Take a photo showing this room after cleaning is complete.',
      child: SizedBox(
        width: double.infinity,
        child: ElevatedButton.icon(
          onPressed: _uploading ? null : _handleAfterPhoto,
          icon: const Icon(Icons.camera_alt),
          label: Text(_uploading ? 'Uploading...' : 'Take After Photo'),
          style: ElevatedButton.styleFrom(
            backgroundColor: OceanTheme.success,
            padding: const EdgeInsets.symmetric(vertical: 16),
          ),
        ),
      ),
    );
  }

  Widget _buildIssuePhotoStep(RoomClean room, List<Photo> photos) {
    return _stepCard(
      icon: Icons.search,
      iconColor: OceanTheme.warning,
      title: 'Anything to Report?',
      description: 'Report anything broken, damaged, or needing attention. Optional.',
      child: Column(
        children: [
          // Show submitted issues for this session
          if (_submittedIssues.isNotEmpty) ...[
            ..._submittedIssues.map((issue) => Container(
              margin: const EdgeInsets.only(bottom: 6),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: OceanTheme.surface,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: issue['severity'] == 'high'
                      ? OceanTheme.error
                      : issue['severity'] == 'medium'
                      ? OceanTheme.warning
                      : OceanTheme.success,
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.check_circle,
                    size: 16,
                    color: issue['severity'] == 'high'
                        ? OceanTheme.error
                        : OceanTheme.warning,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      issue['title']!,
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: issue['severity'] == 'high'
                          ? OceanTheme.error
                          : issue['severity'] == 'medium'
                          ? OceanTheme.warning
                          : OceanTheme.success,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      issue['severity']!,
                      style: const TextStyle(fontSize: 10, color: Colors.white, fontWeight: FontWeight.w700),
                    ),
                  ),
                ],
              ),
            )),
            const SizedBox(height: 8),
          ],
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: _showReportIssueSheet,
              icon: const Icon(Icons.add_circle_outline),
              label: const Text('Report an Issue'),
              style: OutlinedButton.styleFrom(
                foregroundColor: OceanTheme.warning,
                side: const BorderSide(color: OceanTheme.warning, width: 2),
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
          ),
          const SizedBox(height: 10),
          _nextButton(
            label: _currentRoomIdx < _rooms.length - 1
                ? 'Next Room \u2192'
                : 'Finish & Submit',
            onPressed: _handleFinishRoom,
          ),
        ],
      ),
    );
  }

  Widget _buildPhotoSummary(List<Photo> photos) {
    final baseUrl = _api.dio.options.baseUrl;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Photos: ${photos.length}',
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: OceanTheme.textSecondary,
            ),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: photos.map((p) {
              final borderColor = p.type == 'issue'
                  ? OceanTheme.error
                  : p.type == 'before'
                  ? OceanTheme.primary
                  : OceanTheme.success;
              final imageUrl = '$baseUrl${p.storagePath}';
              return Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: borderColor, width: 2),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(6),
                  child: Image.network(
                    imageUrl,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      color: OceanTheme.surface,
                      alignment: Alignment.center,
                      child: Text(
                        p.type.toUpperCase(),
                        style: const TextStyle(
                          fontSize: 8,
                          fontWeight: FontWeight.w700,
                          color: OceanTheme.textSecondary,
                        ),
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  // --- Reusable widgets ---

  Widget _stepCard({
    required String title,
    IconData? icon,
    Color? iconColor,
    String? description,
    Widget? child,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              if (icon != null) ...[
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: (iconColor ?? OceanTheme.primary).withValues(
                      alpha: 0.12,
                    ),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  alignment: Alignment.center,
                  child: Icon(
                    icon,
                    size: 20,
                    color: iconColor ?? OceanTheme.primary,
                  ),
                ),
                const SizedBox(width: 10),
              ],
              Text(
                title,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: OceanTheme.text,
                ),
              ),
            ],
          ),
          if (description != null) ...[
            const SizedBox(height: 8),
            Text(
              description,
              style: const TextStyle(
                fontSize: 14,
                color: OceanTheme.textSecondary,
                height: 1.4,
              ),
            ),
          ],
          if (child != null) ...[const SizedBox(height: 16), child],
        ],
      ),
    );
  }

  Widget _nextButton({required String label, VoidCallback? onPressed}) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: OceanTheme.success,
          padding: const EdgeInsets.symmetric(vertical: 16),
        ),
        child: Text(
          label,
          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
        ),
      ),
    );
  }
}
