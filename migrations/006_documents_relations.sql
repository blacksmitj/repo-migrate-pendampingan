-- 11. DOCUMENT RELATIONS
CREATE TABLE participant_documents (
    document_id UUID PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE
);

CREATE INDEX participant_documents_participant_id_idx ON participant_documents (participant_id);

CREATE TABLE business_documents (
    document_id UUID PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE
);

CREATE INDEX business_documents_business_id_idx ON business_documents (business_id);

CREATE TABLE logbook_documents (
    document_id UUID PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
    logbook_id UUID REFERENCES logbooks(id) ON DELETE CASCADE
);

CREATE INDEX logbook_documents_logbook_id_idx ON logbook_documents (logbook_id);

CREATE TABLE monthly_report_documents (
    document_id UUID PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
    monthly_report_id UUID REFERENCES monthly_reports(id) ON DELETE CASCADE
);

CREATE INDEX monthly_report_documents_report_id_idx ON monthly_report_documents (monthly_report_id);
