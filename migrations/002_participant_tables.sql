-- 4. BATCH & GROUPS
CREATE TABLE batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE, -- legacy batchID
    start_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE participant_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    legacy_tkm_id VARCHAR(50), -- for reference
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. PARTICIPANTS LAYER (Normalized from 'peserta' and 'peserta_detail')
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES batches(id),
    group_id UUID REFERENCES participant_groups(id),
    legacy_tkm_id VARCHAR(100) UNIQUE, -- ID TKM from legacy system
    status VARCHAR(50), -- legacy status
    last_education VARCHAR(100),
    disability_status BOOLEAN DEFAULT FALSE,
    disability_type VARCHAR(150),
    current_activity TEXT,
    -- Fields from peserta_detail
    communication_status VARCHAR(255),
    fund_disbursement VARCHAR(255),
    presence_status VARCHAR(255),
    willing_to_be_assisted VARCHAR(255),
    reason_not_willing TEXT,
    status_applicant VARCHAR(255),
    reason_drop TEXT,
    submission_status VARCHAR(50),
    submission_date TIMESTAMP WITH TIME ZONE,
    registration_date TIMESTAMP WITH TIME ZONE,
    id_pendaftar VARCHAR(100),
    link_detail_tkm TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_participants_tkm ON participants(legacy_tkm_id);

CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    legacy_tkm_id VARCHAR(100), -- For direct TKM lookup
    name VARCHAR(255),
    sector VARCHAR(100),
    type VARCHAR(100),
    description TEXT,
    main_product VARCHAR(200),
    location_ownership VARCHAR(100),
    nib_number VARCHAR(50),
    marketing_channels TEXT,
    marketing_areas TEXT,
    marketing_countries TEXT,
    detailed_location TEXT,
    partner_name VARCHAR(200),
    partner_count INTEGER,
    revenue_per_period DECIMAL(15, 2),
    profit_per_period DECIMAL(15, 2),
    production_volume INTEGER,
    production_unit VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_businesses_tkm ON businesses(legacy_tkm_id);

-- 6. EMERGENCY CONTACTS (from kerabat_1, kerabat_2)
CREATE TABLE emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    legacy_tkm_id VARCHAR(100), -- For direct TKM lookup
    full_name VARCHAR(255),
    phone_number VARCHAR(20),
    relationship VARCHAR(100),
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_emergency_contacts_tkm ON emergency_contacts(legacy_tkm_id);

-- 6b. BUSINESS EMPLOYEES (from tkm_new_employee)
CREATE TABLE business_employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255),
    nik VARCHAR(32),
    gender VARCHAR(2),
    role VARCHAR(100),
    employment_status VARCHAR(50),
    bpjs_status VARCHAR(50),
    bpjs_number VARCHAR(50),
    bpjs_type VARCHAR(50),
    disability BOOLEAN DEFAULT FALSE,
    disability_type VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    legacy_id BIGINT
);

-- 7. DOCUMENTS LAYER
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id UUID NOT NULL, -- Flexible ID for participant, business, etc.
    entity_type VARCHAR(50) NOT NULL, -- 'participant', 'business', 'report'
    label VARCHAR(255) NOT NULL, -- 'KTP', 'KK', 'NIB', 'PROPOSAL'
    file_url TEXT NOT NULL,
    file_type VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
