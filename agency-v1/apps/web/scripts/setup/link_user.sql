-- First, create the company if it doesn't exist
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
)
ON CONFLICT (slug) DO UPDATE SET updated_at = NOW()
RETURNING id;

-- Then link the user to the company
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
  AND NOT EXISTS (
    SELECT 1 FROM company_users cu 
    WHERE cu.user_id = u.id AND cu.company_id = c.id
  );

-- Verify the setup
SELECT 
    u.email,
    c.name as company_name,
    cu.role
FROM users u
JOIN company_users cu ON u.id = cu.user_id
JOIN companies c ON cu.company_id = c.id
WHERE u.email = 'administrador@legacymark.com';
