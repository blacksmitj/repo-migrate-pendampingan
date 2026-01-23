-- 12. UPLOAD REPORTS
CREATE TABLE upload_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    note TEXT,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    legacy_id BIGINT
);

CREATE TABLE upload_report_documents (
    document_id UUID PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
    upload_report_id UUID REFERENCES upload_reports(id) ON DELETE CASCADE
);

CREATE INDEX upload_report_documents_report_id_idx ON upload_report_documents (upload_report_id);
