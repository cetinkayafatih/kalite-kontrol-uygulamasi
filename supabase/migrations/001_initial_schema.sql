-- ============================================
-- KALITE KONTROL YONETIM SISTEMI
-- Supabase Database Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. SUPPLIERS (Tedarikciler)
-- ============================================
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  contact_person VARCHAR(255) DEFAULT '',
  phone VARCHAR(50) DEFAULT '',
  email VARCHAR(255) DEFAULT '',
  address TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Index for faster lookups
CREATE INDEX idx_suppliers_code ON suppliers(code);
CREATE INDEX idx_suppliers_is_active ON suppliers(is_active);

-- ============================================
-- 2. MATERIALS (Malzeme Turleri)
-- ============================================
CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  unit VARCHAR(50) DEFAULT 'adet',
  default_aql VARCHAR(10) DEFAULT '2.5',
  criteria JSONB DEFAULT '[]'::JSONB,
  defect_types JSONB DEFAULT '[]'::JSONB
);

-- Index
CREATE INDEX idx_materials_code ON materials(code);

-- ============================================
-- 3. LOTS (Partiler)
-- ============================================
CREATE TABLE IF NOT EXISTS lots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lot_number VARCHAR(50) NOT NULL UNIQUE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  material_type_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  sample_size INTEGER NOT NULL,
  sample_code VARCHAR(10) NOT NULL,
  aql VARCHAR(10) NOT NULL,
  inspection_level VARCHAR(5) DEFAULT 'II',
  acceptance_number INTEGER NOT NULL,
  rejection_number INTEGER NOT NULL,
  order_number VARCHAR(100),
  received_date DATE NOT NULL,
  inspection_date TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed')),
  decision VARCHAR(20) CHECK (decision IN ('accepted', 'rejected', NULL)),
  inspected_by VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  defect_count INTEGER DEFAULT 0,
  package_config JSONB,
  sample_positions JSONB,
  current_sample_index INTEGER DEFAULT 0
);

-- Indexes for common queries
CREATE INDEX idx_lots_supplier_id ON lots(supplier_id);
CREATE INDEX idx_lots_material_type_id ON lots(material_type_id);
CREATE INDEX idx_lots_status ON lots(status);
CREATE INDEX idx_lots_decision ON lots(decision);
CREATE INDEX idx_lots_created_at ON lots(created_at DESC);
CREATE INDEX idx_lots_lot_number ON lots(lot_number);

-- ============================================
-- 4. INSPECTIONS (Muayeneler)
-- ============================================
CREATE TABLE IF NOT EXISTS inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
  sample_number INTEGER NOT NULL,
  is_defective BOOLEAN DEFAULT FALSE,
  defects JSONB DEFAULT '[]'::JSONB,
  notes TEXT,
  photo_base64 TEXT,
  inspected_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_inspections_lot_id ON inspections(lot_id);
CREATE INDEX idx_inspections_is_defective ON inspections(is_defective);

-- ============================================
-- 5. SWITCHING_STATES (ISO 2859-1 Switching Rules)
-- ============================================
CREATE TABLE IF NOT EXISTS switching_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  material_type_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  current_level VARCHAR(20) DEFAULT 'normal' CHECK (current_level IN ('normal', 'tightened', 'reduced')),
  consecutive_accepted INTEGER DEFAULT 0,
  consecutive_rejected INTEGER DEFAULT 0,
  recent_results JSONB DEFAULT '[]'::JSONB,
  history JSONB DEFAULT '[]'::JSONB,
  should_stop_production BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(supplier_id, material_type_id)
);

-- Index
CREATE INDEX idx_switching_supplier ON switching_states(supplier_id);
CREATE INDEX idx_switching_material ON switching_states(material_type_id);

-- ============================================
-- 6. SETTINGS (Ayarlar)
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name VARCHAR(255) DEFAULT 'Kalite Kontrol Yonetim Sistemi',
  company_logo TEXT,
  default_aql VARCHAR(10) DEFAULT '2.5',
  default_inspection_level VARCHAR(5) DEFAULT 'II',
  dark_mode BOOLEAN DEFAULT FALSE,
  language VARCHAR(5) DEFAULT 'tr'
);

-- Insert default settings
INSERT INTO settings (id, company_name, default_aql, default_inspection_level, dark_mode, language)
VALUES (uuid_generate_v4(), 'Kalite Kontrol Yonetim Sistemi', '2.5', 'II', FALSE, 'tr')
ON CONFLICT DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
-- Enable RLS on all tables
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE switching_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow public access for anon users (for demo purposes)
-- In production, you would restrict this based on user authentication
CREATE POLICY "Allow all for suppliers" ON suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for materials" ON materials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for lots" ON lots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for inspections" ON inspections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for switching_states" ON switching_states FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for settings" ON settings FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- DEFAULT DATA (Ornek Veriler)
-- ============================================

-- Sample Suppliers
INSERT INTO suppliers (id, name, code, contact_person, phone, email, address, is_active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'ABC Tekstil', 'ABC001', 'Ahmet Yilmaz', '0532 111 2233', 'ahmet@abctekstil.com', 'Istanbul, Turkiye', TRUE),
  ('22222222-2222-2222-2222-222222222222', 'XYZ Iplik', 'XYZ001', 'Mehmet Demir', '0533 222 3344', 'mehmet@xyziplik.com', 'Bursa, Turkiye', TRUE),
  ('33333333-3333-3333-3333-333333333333', 'Beta Etiket', 'BETA01', 'Ayse Kara', '0534 333 4455', 'ayse@betaetiket.com', 'Izmir, Turkiye', TRUE)
ON CONFLICT DO NOTHING;

-- Sample Materials
INSERT INTO materials (id, name, code, unit, default_aql, criteria, defect_types) VALUES
  (
    '44444444-4444-4444-4444-444444444444',
    'Etiket',
    'ETK001',
    'adet',
    '2.5',
    '[
      {"id": "crt-1", "name": "Baski Kalitesi", "description": "Barkod ve yazilarin netligi", "acceptanceCriteria": "Net ve okunabilir olmali", "inspectionMethod": "Gorsel", "isCritical": true},
      {"id": "crt-2", "name": "Kesim Olcusu", "description": "Etiket boyutlari", "acceptanceCriteria": "Tolerans: +/- 1mm", "inspectionMethod": "Olcum", "isCritical": false},
      {"id": "crt-3", "name": "Yapiskanlık", "description": "Yapiskan tabaka kalitesi", "acceptanceCriteria": "Duzgun yapismali, kabarcik olmamali", "inspectionMethod": "Dokunma", "isCritical": true}
    ]'::JSONB,
    '[
      {"id": "def-1", "code": "ETK-01", "name": "Baski Hatasi", "description": "Barkod/yazi okunamiyor", "severity": "critical"},
      {"id": "def-2", "code": "ETK-02", "name": "Kesim Hatasi", "description": "Boyut tolerans disi", "severity": "major"},
      {"id": "def-3", "code": "ETK-03", "name": "Yapiskan Hatasi", "description": "Yapiskan tabakada sorun", "severity": "major"},
      {"id": "def-4", "code": "ETK-04", "name": "Renk Farki", "description": "Renk uyumsuzlugu", "severity": "minor"}
    ]'::JSONB
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    'Iplik (Bobin)',
    'IPL001',
    'bobin',
    '2.5',
    '[
      {"id": "crt-4", "name": "Iplik Kalinligi", "description": "Ne/Nm degeri kontrolu", "acceptanceCriteria": "Belirtilen tolerans icinde", "inspectionMethod": "Olcum", "isCritical": true},
      {"id": "crt-5", "name": "Renk Kontrolu", "description": "Renk kodu uyumu", "acceptanceCriteria": "Numune ile eslesme", "inspectionMethod": "Gorsel", "isCritical": true},
      {"id": "crt-6", "name": "Bobin Sarimi", "description": "Sarim duzgunlugu", "acceptanceCriteria": "Duzgun sarim, dugum yok", "inspectionMethod": "Gorsel", "isCritical": false}
    ]'::JSONB,
    '[
      {"id": "def-5", "code": "IPL-01", "name": "Kalinlik Hatasi", "description": "Tolerans disi kalinlik", "severity": "critical"},
      {"id": "def-6", "code": "IPL-02", "name": "Renk Hatasi", "description": "Yanlis renk/lot", "severity": "critical"},
      {"id": "def-7", "code": "IPL-03", "name": "Dugum", "description": "Iplikte dugum var", "severity": "major"},
      {"id": "def-8", "code": "IPL-04", "name": "Sarim Bozuklugu", "description": "Duzensiz sarim", "severity": "minor"}
    ]'::JSONB
  )
ON CONFLICT DO NOTHING;
