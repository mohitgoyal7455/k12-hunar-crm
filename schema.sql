-- =====================================================================
-- K12 Hunar — EdTech CRM & Inquiry System
-- PostgreSQL schema (tested on PostgreSQL 15/16, Supabase compatible)
--
-- Run once against your Supabase database:
--   Supabase Dashboard → SQL Editor → paste this file → Run
--   or:  psql "$DATABASE_URL" -f schema.sql
--
-- The script is idempotent: running it again will not duplicate data.
-- =====================================================================

-- Trigram index support for fast ILIKE '%term%' search on name.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ---------------------------------------------------------------------
-- admins: dashboard users. Passwords are stored ONLY as bcrypt hashes.
-- There is no public sign-up; admins are seeded here or created with
-- `npm run create-admin` in /server.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name           VARCHAR(100)  NOT NULL,
    email          VARCHAR(255)  NOT NULL,
    password_hash  VARCHAR(255)  NOT NULL,
    is_active      BOOLEAN       NOT NULL DEFAULT TRUE,
    last_login_at  TIMESTAMPTZ,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT admins_email_format CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

-- Case-insensitive uniqueness on email.
CREATE UNIQUE INDEX IF NOT EXISTS admins_email_lower_uq ON admins (LOWER(email));

-- ---------------------------------------------------------------------
-- inquiries: submissions from the public inquiry form.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inquiries (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_type   VARCHAR(20)   NOT NULL,
    category    VARCHAR(30)   NOT NULL,
    name        VARCHAR(100)  NOT NULL,
    email       VARCHAR(255)  NOT NULL,
    phone       VARCHAR(15)   NOT NULL,  -- normalised to 10 digits by the API
    message     TEXT          NOT NULL,
    status      VARCHAR(20)   NOT NULL DEFAULT 'new',
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT inquiries_user_type_chk
        CHECK (user_type IN ('parent', 'student', 'school')),
    CONSTRAINT inquiries_category_chk
        CHECK (category IN ('scholarship', 'concert', 'admission', 'general_query')),
    CONSTRAINT inquiries_status_chk
        CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
    CONSTRAINT inquiries_phone_chk
        CHECK (phone ~ '^[6-9][0-9]{9}$'),
    CONSTRAINT inquiries_email_chk
        CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
    CONSTRAINT inquiries_message_len_chk
        CHECK (char_length(message) BETWEEN 10 AND 2000)
);

-- Filter / sort indexes used by the admin dashboard.
CREATE INDEX IF NOT EXISTS inquiries_category_idx   ON inquiries (category);
CREATE INDEX IF NOT EXISTS inquiries_user_type_idx  ON inquiries (user_type);
CREATE INDEX IF NOT EXISTS inquiries_status_idx     ON inquiries (status);
CREATE INDEX IF NOT EXISTS inquiries_created_at_idx ON inquiries (created_at DESC);
-- Search indexes: name (partial, case-insensitive) and phone (prefix/partial).
CREATE INDEX IF NOT EXISTS inquiries_name_trgm_idx  ON inquiries USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS inquiries_phone_trgm_idx ON inquiries USING GIN (phone gin_trgm_ops);

-- Keep updated_at current on every UPDATE.
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS inquiries_set_updated_at ON inquiries;
CREATE TRIGGER inquiries_set_updated_at
    BEFORE UPDATE ON inquiries
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =====================================================================
-- Seed data
-- =====================================================================

-- Demo admin  →  email: admin@k12hunar.com   password: Admin@123
-- (bcrypt, cost 10). Change or remove this account after evaluation.
INSERT INTO admins (name, email, password_hash)
VALUES ('Demo Admin', 'admin@k12hunar.com',
        '$2b$10$DXKeZhJ9vlfP1RTsVHwFDeXgX1h/U0NWL/b8n.C6X0TWpdjsfc6fW')
ON CONFLICT (LOWER(email)) DO NOTHING;

-- Sample inquiries, inserted only when the table is empty.
INSERT INTO inquiries (user_type, category, name, email, phone, message, status, created_at)
SELECT v.user_type, v.category, v.name, v.email, v.phone, v.message, v.status,
       NOW() - v.age
FROM (VALUES
    ('parent',  'admission',     'Priya Sharma',          'priya.sharma@gmail.com',      '9810012345', 'Looking for Grade 6 admission for my daughter for the next academic session. What is the process?', 'new',         INTERVAL '2 hours'),
    ('student', 'scholarship',   'Rohan Verma',           'rohan.verma17@yahoo.com',     '9876543210', 'I scored 94% in Class 10 boards. Am I eligible for the merit scholarship?',                    'in_progress', INTERVAL '1 day'),
    ('school',  'concert',       'Delhi Public School',   'events@dpsnoida.edu.in',      '9711122233', 'We would like to register 40 students for the annual inter-school music concert.',             'new',         INTERVAL '1 day 5 hours'),
    ('parent',  'general_query', 'Anil Kapoor',           'anil.kapoor@outlook.com',     '9899001122', 'Do you offer weekend coding classes for children aged 10 to 12?',                              'resolved',    INTERVAL '3 days'),
    ('student', 'admission',     'Sneha Gupta',           'sneha.g2009@gmail.com',       '8826543219', 'Please share the fee structure and seat availability for the Class 11 science stream.',        'new',         INTERVAL '4 days'),
    ('school',  'scholarship',   'Ryan International',    'admin@ryangzb.edu.in',        '9312345678', 'Interested in a partnership for need-based scholarships for our Class 9 students.',             'in_progress', INTERVAL '5 days'),
    ('parent',  'concert',       'Meera Iyer',            'meera.iyer@gmail.com',        '7042233445', 'Can parents attend the December concert, and are passes required for entry?',                  'closed',      INTERVAL '7 days'),
    ('student', 'general_query', 'Aditya Singh',          'aditya.singh@gmail.com',      '9560011223', 'Is there a mobile app to access recorded classes and study material?',                         'resolved',    INTERVAL '9 days'),
    ('parent',  'scholarship',   'Ramesh Yadav',          'ramesh.yadav64@gmail.com',    '9958877665', 'What documents are needed to apply for the financial aid scholarship for my son?',            'new',         INTERVAL '11 days'),
    ('school',  'admission',     'Amity International',   'principal@amityghz.edu.in',   '9654321870', 'We want to discuss bulk enrolment of our students into your skill development programme.',      'in_progress', INTERVAL '14 days'),
    ('student', 'concert',       'Kavya Nair',            'kavya.nair@gmail.com',        '8130456789', 'I play the violin. How can I audition to perform at the annual concert?',                      'new',         INTERVAL '18 days'),
    ('parent',  'admission',     'Sunil Mehta',           'sunil.mehta@rediffmail.com',  '9871234560', 'Are there mid-year admissions for Grade 3? We are relocating to Noida in January.',              'closed',      INTERVAL '25 days')
) AS v(user_type, category, name, email, phone, message, status, age)
WHERE NOT EXISTS (SELECT 1 FROM inquiries);
