// Data models matching the OpenSTR API

class AuthUser {
  final String id;
  final String name;
  final String email;
  final String role;

  AuthUser({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
  });

  factory AuthUser.fromJson(Map<String, dynamic> json) => AuthUser(
    id: json['id'] as String,
    name: json['name'] as String? ?? '',
    email: json['email'] as String,
    role: json['role'] as String? ?? 'cleaner',
  );
}

class CleanSession {
  final String id;
  final String propertyId;
  final String assignedTo;
  final String status;
  final String? sessionType;
  final String? propertyName;
  final String? cleanerName;
  final String? scheduledDate;
  final String? notes;
  final String? createdAt;
  final String? completedAt;
  final int? guestRating;

  CleanSession({
    required this.id,
    required this.propertyId,
    required this.assignedTo,
    required this.status,
    this.sessionType,
    this.propertyName,
    this.cleanerName,
    this.scheduledDate,
    this.notes,
    this.createdAt,
    this.completedAt,
    this.guestRating,
  });

  factory CleanSession.fromJson(Map<String, dynamic> json) => CleanSession(
    id: json['id'] as String,
    propertyId: (json['propertyId'] ?? json['property_id'] ?? '') as String,
    assignedTo: (json['assignedTo'] ?? json['assigned_to'] ?? '') as String,
    status: json['status'] as String,
    sessionType: (json['sessionType'] ?? json['session_type']) as String?,
    propertyName: json['property_name'] as String?,
    cleanerName: json['cleaner_name'] as String?,
    scheduledDate: (json['scheduledDate'] ?? json['scheduled_date']) as String?,
    notes: json['notes'] as String?,
    createdAt: (json['createdAt'] ?? json['created_at']) as String?,
    completedAt: (json['completedAt'] ?? json['completed_at']) as String?,
    guestRating: (json['guestRating'] ?? json['guest_rating']) as int?,
  );
}

class RoomClean {
  final String id;
  final String roomId;
  final String sessionId;
  final String status;
  final String displayName;
  final String? themeName;
  final int displayOrder;

  RoomClean({
    required this.id,
    required this.roomId,
    required this.sessionId,
    required this.status,
    required this.displayName,
    this.themeName,
    required this.displayOrder,
  });

  factory RoomClean.fromJson(Map<String, dynamic> json) => RoomClean(
    id: json['id'] as String,
    roomId: (json['roomId'] ?? json['room_id'] ?? '') as String,
    sessionId: (json['sessionId'] ?? json['session_id'] ?? '') as String,
    status: json['status'] as String? ?? 'pending',
    displayName: (json['displayName'] ?? json['display_name'] ?? '') as String,
    themeName: (json['themeName'] ?? json['theme_name']) as String?,
    displayOrder: (json['displayOrder'] ?? json['display_order'] ?? 0) as int,
  );
}

class Task {
  final String id;
  final String label;
  final String taskType;
  final bool required;
  final int displayOrder;
  final String? category;
  final bool? isHighTouch;
  final String? frequency;

  Task({
    required this.id,
    required this.label,
    required this.taskType,
    required this.required,
    required this.displayOrder,
    this.category,
    this.isHighTouch,
    this.frequency,
  });

  factory Task.fromJson(Map<String, dynamic> json) => Task(
    id: json['id'] as String,
    label: (json['label'] ?? json['description'] ?? '') as String,
    taskType:
        (json['taskType'] ?? json['task_type'] ?? json['type'] ?? 'checkbox')
            as String,
    required:
        (json['required'] ?? json['isRequired'] ?? json['is_required'] ?? false)
            as bool,
    displayOrder: (json['displayOrder'] ?? json['display_order'] ?? 0) as int,
    category: json['category'] as String?,
    isHighTouch: (json['isHighTouch'] ?? json['is_high_touch']) as bool?,
    frequency: json['frequency'] as String?,
  );
}

class Photo {
  final String id;
  final String type; // 'before', 'after', 'issue'
  final String storagePath;

  Photo({required this.id, required this.type, required this.storagePath});

  factory Photo.fromJson(Map<String, dynamic> json) => Photo(
    id: json['id'] as String,
    type: json['type'] as String,
    storagePath: (json['storagePath'] ?? json['storage_path'] ?? '') as String,
  );
}
