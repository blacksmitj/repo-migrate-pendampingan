-- 14. MENTOR ASSIGNMENTS
CREATE TABLE mentor_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mentor_id UUID REFERENCES mentors(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    legacy_tkm_id VARCHAR(100), -- For direct TKM lookup
    assignment_status VARCHAR(50) DEFAULT 'active', -- legacy status_peserta
    batch_year INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(mentor_id, participant_id)
);
CREATE INDEX idx_mentor_participants_tkm ON mentor_participants(legacy_tkm_id);
