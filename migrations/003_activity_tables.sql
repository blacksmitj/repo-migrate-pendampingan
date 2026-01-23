-- 8. MENTORS LAYER (Normalized from users with mentor role)
CREATE TABLE mentors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    legacy_id BIGINT, -- for mapping
    specialization VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. ACTIVITY & MONITORING LAYER
CREATE TABLE logbooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mentor_id UUID REFERENCES mentors(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    legacy_tkm_id VARCHAR(100), -- For direct TKM lookup
    activity_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    meeting_type VARCHAR(100), -- 'online', 'offline'
    visit_type VARCHAR(100),
    delivery_method VARCHAR(100),
    mentoring_material TEXT,
    activity_summary TEXT,
    obstacles TEXT,
    solutions TEXT,
    is_verified VARCHAR(25) DEFAULT 'pending',
    verification_note TEXT,
    expense_amount DECIMAL(12, 2),
    no_expense_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_logbooks_tkm ON logbooks(legacy_tkm_id);

CREATE TABLE monthly_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    mentor_id UUID REFERENCES mentors(id),
    legacy_tkm_id VARCHAR(100), -- For direct TKM lookup
    report_month INTEGER NOT NULL,
    report_year INTEGER NOT NULL,
    bookkeeping_cashflow BOOLEAN DEFAULT FALSE,
    bookkeeping_income_statement BOOLEAN DEFAULT FALSE,
    sales_volume INTEGER,
    sales_unit VARCHAR(50),
    production_capacity INTEGER,
    production_unit VARCHAR(50),
    marketing_area TEXT,
    revenue DECIMAL(15, 2),
    business_condition TEXT,
    obstacles TEXT,
    note_confirmation VARCHAR(255),
    lpj_status BOOLEAN DEFAULT FALSE,
    is_verified VARCHAR(25) DEFAULT 'pending',
    verification_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_monthly_reports_tkm ON monthly_reports(legacy_tkm_id);

-- 10. ACTIVITY LOGS
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    activity TEXT NOT NULL,
    original_data JSONB,
    final_data JSONB,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
