-- Frontier Database Schema
-- PostgreSQL 16

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- ENUMS
-- =============================================

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('OWNER', 'MANAGER', 'EMPLOYEE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE area_type AS ENUM ('SOURCE', 'PROCESSOR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE event_type AS ENUM ('DEMAND', 'SUPPLY', 'CORRECTION');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- TABLES
-- =============================================

-- Companies (multi-tenant root)
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (admin authentication)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL DEFAULT 'EMPLOYEE',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employees (PIN authentication)
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    full_name VARCHAR(100) NOT NULL,
    employee_code VARCHAR(20) NOT NULL,
    access_pin_hash VARCHAR(255) NOT NULL,
    access_pin_plain VARCHAR(10) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, employee_code)
);

-- Employee Sessions
CREATE TABLE IF NOT EXISTS employee_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id),
    token_hash VARCHAR(255) NOT NULL,
    device_fingerprint VARCHAR(255),
    expires_at TIMESTAMPTZ NOT NULL,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Operational Areas
CREATE TABLE IF NOT EXISTS operational_areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    name VARCHAR(100) NOT NULL,
    type area_type NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, name)
);

-- Employee Areas (N:M)
CREATE TABLE IF NOT EXISTS employee_areas (
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    area_id UUID NOT NULL REFERENCES operational_areas(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (employee_id, area_id)
);

-- Catalog Items
CREATE TABLE IF NOT EXISTS catalog_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    icon_ref VARCHAR(50) NOT NULL,
    unit VARCHAR(20) DEFAULT 'piece',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, name)
);

-- Operational Events (THE IMMUTABLE LEDGER)
CREATE TABLE IF NOT EXISTS operational_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    employee_id UUID NOT NULL REFERENCES employees(id),
    area_id UUID NOT NULL REFERENCES operational_areas(id),
    event_type event_type NOT NULL,
    session_id UUID REFERENCES employee_sessions(id),
    notes TEXT
);

-- Event Details (line items)
CREATE TABLE IF NOT EXISTS event_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES operational_events(id) ON DELETE RESTRICT,
    item_id UUID NOT NULL REFERENCES catalog_items(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0)
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_employees_company ON employees(company_id);
CREATE INDEX IF NOT EXISTS idx_areas_company ON operational_areas(company_id);
CREATE INDEX IF NOT EXISTS idx_items_company ON catalog_items(company_id);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON operational_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_events_employee ON operational_events(employee_id);
CREATE INDEX IF NOT EXISTS idx_events_area ON operational_events(area_id);
CREATE INDEX IF NOT EXISTS idx_event_details_event ON event_details(event_id);

-- =============================================
-- SEED DATA
-- =============================================

-- Insert company
INSERT INTO companies (id, name, code, updated_at) 
VALUES ('11111111-1111-1111-1111-111111111111', 'Hotel Frontier', 'FRONTIER', NOW())
ON CONFLICT (code) DO NOTHING;

-- Insert admin user (password: Admin123!)
INSERT INTO users (id, company_id, email, password_hash, full_name, role, updated_at)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'admin@hotel.com',
    '$2b$10$Uombyvp7NvL.HyUOTc3sku8LtykSX90NrfppAXRDn8fgbWnuZYI4zK',
    'Administrador',
    'OWNER',
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Insert areas
INSERT INTO operational_areas (id, company_id, name, type, description) VALUES
    ('aaaa1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Limpieza', 'SOURCE', 'Limpieza de áreas públicas y profunda'),
    ('aaaa2222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Camareras', 'SOURCE', 'Habitaciones y pisos'),
    ('aaaa3333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Lavandería', 'PROCESSOR', 'Procesamiento de ropa'),
    ('aaaa4444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Cocina', 'PROCESSOR', 'Alimentos y Bebidas')
ON CONFLICT DO NOTHING;

-- Insert employees (PINs: María=1234, Pedro=5678, Ana=9012)
INSERT INTO employees (id, company_id, full_name, employee_code, access_pin_hash, updated_at) VALUES
    ('eeee1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'María García', 'EMP-001', '$2b$10$zTDBhTuIHNVttrxUybv83eNxLX94TwarzUAiXSonUpkOdg24/4BoO', NOW()),
    ('eeee2222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Pedro López', 'EMP-002', '$2b$10$NGeW8u3K/f.8d6OtQhbPounOSONGTeq3GkQW58jkOWMiSm78Zzpzq', NOW()),
    ('eeee3333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Ana Martínez', 'EMP-003', '$2b$10$9fQdq566DoLXSPZ19o5CDuGryzu1/nZflNgn67uiR.iiRCeYhMiXu', NOW())
ON CONFLICT DO NOTHING;

-- Assign employees to areas
INSERT INTO employee_areas (employee_id, area_id, updated_at) VALUES
    ('eeee1111-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111', NOW()),
    ('eeee2222-2222-2222-2222-222222222222', 'aaaa3333-3333-3333-3333-333333333333', NOW()),
    ('eeee3333-3333-3333-3333-333333333333', 'aaaa2222-2222-2222-2222-222222222222', NOW())
ON CONFLICT DO NOTHING;

-- Insert catalog items
INSERT INTO catalog_items (id, company_id, name, category, icon_ref, unit) VALUES
    ('bbbb1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Sábanas', 'Ropa de Cama', 'bed', 'piece'),
    ('bbbb2222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Toallas', 'Baño', 'bath', 'piece'),
    ('bbbb3333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Almohadas', 'Ropa de Cama', 'pillow', 'piece'),
    ('bbbb4444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Edredones', 'Ropa de Cama', 'blanket', 'piece')
ON CONFLICT DO NOTHING;

-- Done
SELECT 'Database initialized successfully!' as status;
