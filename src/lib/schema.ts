/**
 * Schema migrations, applied in order. The number of applied migrations is
 * stored in SQLite's `user_version`, so only ever append new entries.
 */
export const MIGRATIONS: string[] = [
  /* sql */ `
  CREATE TABLE users (
    id            INTEGER PRIMARY KEY,
    email         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    name          TEXT    NOT NULL,
    password_hash TEXT    NOT NULL,
    role          TEXT    NOT NULL CHECK (role IN ('customer', 'chef')),
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  -- Session ids are SHA-256 hashes of the random token kept in the cookie.
  CREATE TABLE sessions (
    id         TEXT    PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  );
  CREATE INDEX sessions_user ON sessions (user_id);

  CREATE TABLE chefs (
    id               INTEGER PRIMARY KEY,
    user_id          INTEGER NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    headline         TEXT    NOT NULL DEFAULT '',
    bio              TEXT    NOT NULL DEFAULT '',
    city             TEXT    NOT NULL DEFAULT '',
    years_experience INTEGER NOT NULL DEFAULT 0,
    cuisines         TEXT    NOT NULL DEFAULT '[]', -- JSON array of strings
    dietary          TEXT    NOT NULL DEFAULT '[]'  -- JSON array of strings
  );

  CREATE TABLE packages (
    id                     INTEGER PRIMARY KEY,
    chef_id                INTEGER NOT NULL REFERENCES chefs (id) ON DELETE CASCADE,
    name                   TEXT    NOT NULL,
    description            TEXT    NOT NULL DEFAULT '',
    dishes                 INTEGER NOT NULL CHECK (dishes > 0),
    portions_per_dish      INTEGER NOT NULL CHECK (portions_per_dish > 0),
    duration_minutes       INTEGER NOT NULL CHECK (duration_minutes > 0),
    price_cents            INTEGER NOT NULL CHECK (price_cents >= 0),
    grocery_estimate_cents INTEGER NOT NULL DEFAULT 0 CHECK (grocery_estimate_cents >= 0),
    active                 INTEGER NOT NULL DEFAULT 1
  );
  CREATE INDEX packages_chef ON packages (chef_id);

  -- One working window per weekday, in the chef's local time.
  CREATE TABLE availability (
    chef_id      INTEGER NOT NULL REFERENCES chefs (id) ON DELETE CASCADE,
    weekday      INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
    start_minute INTEGER NOT NULL,
    end_minute   INTEGER NOT NULL,
    PRIMARY KEY (chef_id, weekday),
    CHECK (start_minute >= 0 AND end_minute <= 1440 AND start_minute < end_minute)
  );

  -- Package details and prices are copied onto the booking so later menu
  -- edits never change what a customer agreed to.
  CREATE TABLE bookings (
    id                     INTEGER PRIMARY KEY,
    customer_id            INTEGER NOT NULL REFERENCES users (id),
    chef_id                INTEGER NOT NULL REFERENCES chefs (id),
    package_id             INTEGER NOT NULL REFERENCES packages (id),
    package_name           TEXT    NOT NULL,
    dishes                 INTEGER NOT NULL,
    portions_per_dish      INTEGER NOT NULL,
    date                   TEXT    NOT NULL,
    start_minute           INTEGER NOT NULL,
    end_minute             INTEGER NOT NULL,
    address                TEXT    NOT NULL,
    groceries              TEXT    NOT NULL CHECK (groceries IN ('chef', 'customer')),
    dietary                TEXT    NOT NULL DEFAULT '[]',
    allergies              TEXT    NOT NULL DEFAULT '',
    notes                  TEXT    NOT NULL DEFAULT '',
    chef_fee_cents         INTEGER NOT NULL,
    grocery_estimate_cents INTEGER NOT NULL,
    service_fee_cents      INTEGER NOT NULL,
    total_cents            INTEGER NOT NULL,
    status                 TEXT    NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending', 'confirmed', 'declined', 'cancelled', 'completed')),
    cancelled_by           TEXT    CHECK (cancelled_by IN ('customer', 'chef')),
    created_at             TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at             TEXT    NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX bookings_chef_date ON bookings (chef_id, date);
  CREATE INDEX bookings_customer ON bookings (customer_id);

  CREATE TABLE reviews (
    id          INTEGER PRIMARY KEY,
    booking_id  INTEGER NOT NULL UNIQUE REFERENCES bookings (id) ON DELETE CASCADE,
    chef_id     INTEGER NOT NULL REFERENCES chefs (id),
    customer_id INTEGER NOT NULL REFERENCES users (id),
    rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT    NOT NULL DEFAULT '',
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX reviews_chef ON reviews (chef_id);
  `,
];
