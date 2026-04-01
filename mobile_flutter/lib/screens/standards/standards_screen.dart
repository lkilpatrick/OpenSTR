import 'package:flutter/material.dart';
import '../../theme.dart';
import '../../services/api_service.dart';

class _Standard {
  final String id;
  final String name;
  final String? description;
  final int taskCount;

  _Standard({
    required this.id,
    required this.name,
    this.description,
    required this.taskCount,
  });

  factory _Standard.fromJson(Map<String, dynamic> json) => _Standard(
    id: json['id'] as String,
    name: json['name'] as String,
    description: json['description'] as String?,
    taskCount: int.tryParse('${json['task_count']}') ?? 0,
  );
}

class _StandardTask {
  final String id;
  final String label;
  final String roomType;
  final String? category;
  final String? frequency;
  final bool isHighTouch;
  final bool isMandatory;
  final int displayOrder;

  _StandardTask({
    required this.id,
    required this.label,
    required this.roomType,
    this.category,
    this.frequency,
    this.isHighTouch = false,
    this.isMandatory = false,
    required this.displayOrder,
  });

  factory _StandardTask.fromJson(Map<String, dynamic> json) => _StandardTask(
    id: json['id'] as String,
    label: (json['label'] ?? '') as String,
    roomType: (json['room_type'] ?? '') as String,
    category: json['category'] as String?,
    frequency: json['frequency'] as String?,
    isHighTouch: (json['is_high_touch'] ?? false) as bool,
    isMandatory: (json['is_mandatory'] ?? false) as bool,
    displayOrder: (json['display_order'] ?? 0) as int,
  );
}

class StandardsScreen extends StatefulWidget {
  const StandardsScreen({super.key});

  @override
  State<StandardsScreen> createState() => _StandardsScreenState();
}

class _StandardsScreenState extends State<StandardsScreen> {
  final _api = ApiService();

  List<_Standard> _standards = [];
  bool _loadingList = true;

  String? _selectedStandardId;
  String? _selectedStandardName;
  String? _selectedStandardDesc;
  List<_StandardTask> _tasks = [];
  bool _loadingDetail = false;
  final Set<String> _checkedItems = {};

  @override
  void initState() {
    super.initState();
    _fetchStandards();
  }

  Future<void> _fetchStandards() async {
    try {
      final response = await _api.dio.get('/standards');
      final list = (response.data as List)
          .map((e) => _Standard.fromJson(e as Map<String, dynamic>))
          .toList();
      setState(() {
        _standards = list;
        _loadingList = false;
      });
    } catch (_) {
      setState(() => _loadingList = false);
    }
  }

  Future<void> _selectStandard(_Standard standard) async {
    setState(() {
      _selectedStandardId = standard.id;
      _selectedStandardName = standard.name;
      _selectedStandardDesc = standard.description;
      _loadingDetail = true;
      _checkedItems.clear();
    });
    try {
      final response = await _api.dio.get('/standards/${standard.id}');
      final data = response.data as Map<String, dynamic>;
      final tasks = (data['tasks'] as List? ?? [])
          .map((t) => _StandardTask.fromJson(t as Map<String, dynamic>))
          .toList();
      setState(() {
        _tasks = tasks;
        _loadingDetail = false;
      });
    } catch (_) {
      setState(() => _loadingDetail = false);
    }
  }

  void _goBack() {
    setState(() {
      _selectedStandardId = null;
      _tasks = [];
      _checkedItems.clear();
    });
  }

  Color _categoryColor(String? cat) {
    switch (cat) {
      case 'Cleaning':
        return const Color(0xFF3B82F6);
      case 'Sanitise':
        return OceanTheme.error;
      case 'Laundry':
        return const Color(0xFF8B5CF6);
      case 'Restocking':
        return OceanTheme.warning;
      case 'Check':
        return OceanTheme.success;
      case 'Photography':
        return const Color(0xFF06B6D4);
      default:
        return OceanTheme.textSecondary;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_selectedStandardId != null) return _buildDetailView();
    return _buildListView();
  }

  Widget _buildListView() {
    if (_loadingList) {
      return const Center(
        child: CircularProgressIndicator(color: OceanTheme.primary),
      );
    }

    if (_standards.isEmpty) {
      return const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.checklist, size: 48, color: OceanTheme.textSecondary),
            SizedBox(height: 8),
            Text(
              'No standards configured yet',
              style: TextStyle(color: OceanTheme.textSecondary),
            ),
          ],
        ),
      );
    }

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text(
          'Cleaning Standards',
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.bold,
            color: OceanTheme.text,
          ),
        ),
        const SizedBox(height: 4),
        const Text(
          'Preview checklists for reference',
          style: TextStyle(fontSize: 13, color: OceanTheme.textSecondary),
        ),
        const SizedBox(height: 16),
        ..._standards.map(
          (s) => Card(
            margin: const EdgeInsets.only(bottom: 10),
            child: InkWell(
              borderRadius: BorderRadius.circular(12),
              onTap: () => _selectStandard(s),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            s.name,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: OceanTheme.text,
                            ),
                          ),
                          if (s.description != null &&
                              s.description!.isNotEmpty) ...[
                            const SizedBox(height: 4),
                            Text(
                              s.description!,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontSize: 12,
                                color: OceanTheme.textSecondary,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: OceanTheme.surface,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Column(
                        children: [
                          Text(
                            '${s.taskCount}',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: OceanTheme.primary,
                            ),
                          ),
                          const Text(
                            'tasks',
                            style: TextStyle(
                              fontSize: 10,
                              color: OceanTheme.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDetailView() {
    if (_loadingDetail) {
      return const Center(
        child: CircularProgressIndicator(color: OceanTheme.primary),
      );
    }

    // Group tasks by room_type
    final roomTypes = <String>{};
    for (final t in _tasks) {
      roomTypes.add(t.roomType);
    }
    final sections = roomTypes.map((rt) {
      final tasks = _tasks.where((t) => t.roomType == rt).toList()
        ..sort((a, b) => a.displayOrder.compareTo(b.displayOrder));
      return (roomType: rt, tasks: tasks);
    }).toList();

    final totalTasks = _tasks.length;
    final checkedCount = _checkedItems
        .where((id) => _tasks.any((t) => t.id == id))
        .length;

    return Column(
      children: [
        Container(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
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
              Text(
                '$checkedCount/$totalTasks reviewed',
                style: const TextStyle(
                  fontSize: 13,
                  color: OceanTheme.textSecondary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: totalTasks > 0 ? checkedCount / totalTasks : 0,
              backgroundColor: OceanTheme.accent,
              color: OceanTheme.success,
              minHeight: 6,
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
          child: Align(
            alignment: Alignment.centerLeft,
            child: Text(
              _selectedStandardName ?? '',
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: OceanTheme.text,
              ),
            ),
          ),
        ),
        if (_selectedStandardDesc != null && _selectedStandardDesc!.isNotEmpty)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text(
                _selectedStandardDesc!,
                style: const TextStyle(
                  fontSize: 13,
                  color: OceanTheme.textSecondary,
                ),
              ),
            ),
          ),
        Expanded(
          child: _tasks.isEmpty
              ? const Center(
                  child: Text(
                    'No tasks in this standard',
                    style: TextStyle(color: OceanTheme.textSecondary),
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                  itemCount: sections.length,
                  itemBuilder: (context, sectionIdx) {
                    final section = sections[sectionIdx];
                    final sectionChecked = section.tasks
                        .where((t) => _checkedItems.contains(t.id))
                        .length;
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          margin: const EdgeInsets.only(top: 8),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 10,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFE5E7EB),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Text(
                                  section.roomType,
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                    color: OceanTheme.text,
                                  ),
                                ),
                              ),
                              Text(
                                '$sectionChecked/${section.tasks.length}',
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: OceanTheme.textSecondary,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                        ...section.tasks.map((task) {
                          final checked = _checkedItems.contains(task.id);
                          return InkWell(
                            onTap: () => setState(() {
                              if (checked) {
                                _checkedItems.remove(task.id);
                              } else {
                                _checkedItems.add(task.id);
                              }
                            }),
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 14,
                              ),
                              decoration: const BoxDecoration(
                                color: Colors.white,
                                border: Border(
                                  bottom: BorderSide(color: Color(0xFFF1F5F9)),
                                ),
                              ),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    width: 24,
                                    height: 24,
                                    margin: const EdgeInsets.only(
                                      right: 12,
                                      top: 2,
                                    ),
                                    decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(6),
                                      border: Border.all(
                                        color: checked
                                            ? OceanTheme.success
                                            : const Color(0xFFCBD5E1),
                                        width: 2,
                                      ),
                                      color: checked
                                          ? OceanTheme.success
                                          : Colors.transparent,
                                    ),
                                    alignment: Alignment.center,
                                    child: checked
                                        ? const Icon(
                                            Icons.check,
                                            size: 16,
                                            color: Colors.white,
                                          )
                                        : null,
                                  ),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Expanded(
                                              child: Text(
                                                task.label,
                                                style: TextStyle(
                                                  fontSize: 14,
                                                  fontWeight: FontWeight.w500,
                                                  color: checked
                                                      ? OceanTheme.textSecondary
                                                      : OceanTheme.text,
                                                  decoration: checked
                                                      ? TextDecoration
                                                            .lineThrough
                                                      : null,
                                                ),
                                              ),
                                            ),
                                            if (task.isMandatory)
                                              Container(
                                                padding:
                                                    const EdgeInsets.symmetric(
                                                      horizontal: 6,
                                                      vertical: 2,
                                                    ),
                                                decoration: BoxDecoration(
                                                  color: OceanTheme.error
                                                      .withValues(alpha: 0.1),
                                                  borderRadius:
                                                      BorderRadius.circular(4),
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
                                        const SizedBox(height: 4),
                                        Wrap(
                                          spacing: 6,
                                          children: [
                                            if (task.category != null) ...[
                                              Row(
                                                mainAxisSize: MainAxisSize.min,
                                                children: [
                                                  Container(
                                                    width: 8,
                                                    height: 8,
                                                    decoration: BoxDecoration(
                                                      color: _categoryColor(
                                                        task.category,
                                                      ),
                                                      shape: BoxShape.circle,
                                                    ),
                                                  ),
                                                  const SizedBox(width: 4),
                                                  Text(
                                                    task.category!,
                                                    style: const TextStyle(
                                                      fontSize: 11,
                                                      color: OceanTheme
                                                          .textSecondary,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ],
                                            if (task.isHighTouch)
                                              _badge(
                                                'High Touch',
                                                OceanTheme.error,
                                              ),
                                            if (task.frequency != null &&
                                                task.frequency != 'every_clean')
                                              _badge(
                                                task.frequency!.replaceAll(
                                                  '_',
                                                  ' ',
                                                ),
                                                OceanTheme.secondary,
                                              ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        }),
                      ],
                    );
                  },
                ),
        ),
      ],
    );
  }

  Widget _badge(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }
}
