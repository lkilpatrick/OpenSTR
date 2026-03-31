exports.up = (pgm) => {
  pgm.addColumns('property_cleaners', {
    priority: { type: 'smallint', default: 0, notNull: true },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('property_cleaners', ['priority']);
};
