/* eslint-disable camelcase */
exports.up = (pgm) => {
  pgm.createTable('guest_ratings', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    session_id: {
      type: 'uuid',
      notNull: true,
      unique: true,
      references: '"clean_sessions"',
      onDelete: 'CASCADE',
    },
    rating: { type: 'smallint', notNull: true },
    review_text: { type: 'text' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.addConstraint('guest_ratings', 'guest_ratings_rating_check',
    'CHECK (rating BETWEEN 1 AND 5)');
};

exports.down = (pgm) => {
  pgm.dropTable('guest_ratings');
};
