/* eslint-disable camelcase */
exports.up = (pgm) => {
  // Properties: add slug and guest-facing fields
  pgm.addColumns('properties', {
    slug: { type: 'varchar(100)' },
    welcome_message: { type: 'text' },
    house_rules: { type: 'text' },
    checkin_instructions: { type: 'text' },
    checkout_instructions: { type: 'text' },
    wifi_password: { type: 'varchar(100)' },
  });
  pgm.createIndex('properties', 'slug', { unique: true, where: 'slug IS NOT NULL' });

  // Issues: add guest-submitted issue fields
  pgm.addColumns('issues', {
    room_id: { type: 'uuid', references: '"rooms"', onDelete: 'SET NULL' },
    reporter_type: { type: 'varchar(20)', default: "'user'" },
    reporter_name: { type: 'varchar(100)' },
    photo_path: { type: 'text' },
  });

  // Guest messages: add subject and sender_email
  pgm.addColumns('guest_messages', {
    subject: { type: 'varchar(200)' },
    sender_email: { type: 'varchar(255)' },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('guest_messages', ['subject', 'sender_email']);
  pgm.dropColumns('issues', ['room_id', 'reporter_type', 'reporter_name', 'photo_path']);
  pgm.dropIndex('properties', 'slug');
  pgm.dropColumns('properties', ['slug', 'welcome_message', 'house_rules', 'checkin_instructions', 'checkout_instructions', 'wifi_password']);
};
