-- Frontier Seed Data (Prisma 7 schema-compatible)
-- Run AFTER prisma db push

-- Company
INSERT INTO companies (id, name, code, is_active, created_at, updated_at)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Hotel Demo Frontier',
    'HTLDEMO',
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Admin user (password: Admin123!)
INSERT INTO users (id, company_id, email, password_hash, full_name, role, is_active, created_at, updated_at)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'admin@hotel.com',
    '$2b$10$9C3RQ25TQ9hb2hAuWARIsOMsGhOe3jycB76Ldn3cDRrBU7OHu7JWC',
    'Administrador',
    'OWNER',
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Operational Areas
INSERT INTO operational_areas (id, company_id, name, type, is_active, created_at, updated_at) VALUES
    ('aaaa1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Limpieza', 'SOURCE', true, NOW(), NOW()),
    ('aaaa2222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Camareras', 'SOURCE', true, NOW(), NOW()),
    ('aaaa3333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Lavandería', 'PROCESSOR', true, NOW(), NOW()),
    ('aaaa4444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Cocina', 'PROCESSOR', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Employees (PINs: María=1234, Pedro=5678, Ana=9012)
INSERT INTO employees (id, company_id, full_name, employee_code, access_pin_hash, is_active, created_at, updated_at) VALUES
    ('eeee1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'María García', 'EMP-001', '$2b$10$zTDBhTuIHNVttrxUybv83eNxLX94TwarzUAiXSonUpkOdg24/4BoO', true, NOW(), NOW()),
    ('eeee2222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Pedro López', 'EMP-002', '$2b$10$NGeW8u3K/f.8d6OtQhbPounOSONGTeq3GkQW58jkOWMiSm78Zzpzq', true, NOW(), NOW()),
    ('eeee3333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Ana Martínez', 'EMP-003', '$2b$10$9fQdq566DoLXSPZ19o5CDuGryzu1/nZflNgn67uiR.iiRCeYhMiXu', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Assign employees to areas
INSERT INTO employee_areas (employee_id, area_id) VALUES
    ('eeee1111-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111'),
    ('eeee2222-2222-2222-2222-222222222222', 'aaaa2222-2222-2222-2222-222222222222'),
    ('eeee3333-3333-3333-3333-333333333333', 'aaaa3333-3333-3333-3333-333333333333')
ON CONFLICT DO NOTHING;

-- Catalog items
INSERT INTO catalog_items (id, company_id, name, category, created_at) VALUES
    ('cccc1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Sábana King', 'LINEN', NOW()),
    ('cccc2222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Toalla Baño', 'LINEN', NOW()),
    ('cccc3333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Almohada Estándar', 'LINEN', NOW()),
    ('cccc4444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Jabón Amenity', 'AMENITY', NOW()),
    ('cccc5555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'Shampoo Amenity', 'AMENITY', NOW())
ON CONFLICT (id) DO NOTHING;

SELECT 'Seed data loaded successfully!' as status;
