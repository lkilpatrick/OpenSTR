exports.up = (pgm) => {
  pgm.addColumns('clean_sessions', {
    scheduled_date: { type: 'date' },
    photo_required: { type: 'boolean', default: true, notNull: true },
    recurrence: { type: 'varchar(30)' },
    notes: { type: 'text' },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('clean_sessions', ['scheduled_date', 'photo_required', 'recurrence', 'notes']);
};
