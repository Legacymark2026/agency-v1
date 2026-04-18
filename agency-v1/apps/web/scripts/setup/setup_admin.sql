-- Create admin user
INSERT INTO users (id, email, name, password_hash, role, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'administrador@legacymark.com',
    'Admin User',
    '$2a$10$YourHashedPasswordHere', -- This will be replaced by the app
    'ADMIN',
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Create company
INSERT INTO companies (id, name, slug, industry, size, status, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'LegacyMark',
    'legacymark',
    'Technology',
    'SMALL',
    'ACTIVE',
    NOW(),
    NOW()
) ON CONFLICT (slug) DO NOTHING;

-- Link admin to company
INSERT INTO company_users (id, user_id, company_id, role, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    u.id,
    c.id,
    'OWNER',
    NOW(),
    NOW()
FROM users u
CROSS JOIN companies c
WHERE u.email = 'administrador@legacymark.com'
  AND c.slug = 'legacymark'
ON CONFLICT DO NOTHING;
