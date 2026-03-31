exports.up = (pgm) => {
  pgm.addColumns('reservations', {
    guest_name: { type: 'varchar(100)' },
    phone: { type: 'varchar(30)' },
    num_guests: { type: 'smallint' },
    description: { type: 'text' },
    location: { type: 'text' },
    is_blocked: { type: 'boolean', default: false, notNull: true },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('reservations', ['guest_name', 'phone', 'num_guests', 'description', 'location', 'is_blocked']);
};
