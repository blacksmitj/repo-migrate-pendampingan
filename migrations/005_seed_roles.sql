-- Seed roles with English names
INSERT INTO roles (id, name, guard_name) VALUES
    (uuid_generate_v4(), 'super_admin', 'web'),
    (uuid_generate_v4(), 'university_admin', 'web'),
    (uuid_generate_v4(), 'mentor', 'web'),
    (uuid_generate_v4(), 'supervisor', 'web')
ON CONFLICT (name) DO NOTHING;
