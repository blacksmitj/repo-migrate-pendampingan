-- CreateTable
CREATE TABLE "activity_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "activity" TEXT NOT NULL,
    "original_data" JSONB,
    "final_data" JSONB,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" UUID NOT NULL,
    "profile_id" UUID,
    "label" VARCHAR(255),
    "province_id" VARCHAR(2),
    "regency_id" VARCHAR(4),
    "district_id" VARCHAR(6),
    "village_id" VARCHAR(10),
    "province_name" VARCHAR(255),
    "regency_name" VARCHAR(255),
    "district_name" VARCHAR(255),
    "village_name" VARCHAR(255),
    "address_line" TEXT,
    "postal_code" VARCHAR(10),
    "longitude" DECIMAL(11,8),
    "latitude" DECIMAL(11,8),
    "google_maps_link" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batches" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50),
    "start_date" DATE,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_documents" (
    "document_id" UUID NOT NULL,
    "business_id" UUID,

    CONSTRAINT "business_documents_pkey" PRIMARY KEY ("document_id")
);

-- CreateTable
CREATE TABLE "business_employees" (
    "id" UUID NOT NULL,
    "business_id" UUID,
    "name" VARCHAR(255),
    "nik" VARCHAR(32),
    "gender" VARCHAR(2),
    "role" VARCHAR(100),
    "employment_status" VARCHAR(50),
    "bpjs_status" VARCHAR(50),
    "bpjs_number" VARCHAR(50),
    "bpjs_type" VARCHAR(50),
    "disability" BOOLEAN DEFAULT false,
    "disability_type" VARCHAR(255),
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "legacy_id" BIGINT,

    CONSTRAINT "business_employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "businesses" (
    "id" UUID NOT NULL,
    "participant_id" UUID,
    "legacy_tkm_id" VARCHAR(100),
    "name" VARCHAR(255),
    "sector" VARCHAR(100),
    "type" VARCHAR(100),
    "description" TEXT,
    "main_product" VARCHAR(200),
    "location_ownership" VARCHAR(100),
    "nib_number" VARCHAR(50),
    "marketing_channels" TEXT,
    "marketing_areas" TEXT,
    "marketing_countries" TEXT,
    "detailed_location" TEXT,
    "partner_name" VARCHAR(200),
    "partner_count" INTEGER,
    "revenue_per_period" DECIMAL(15,2),
    "profit_per_period" DECIMAL(15,2),
    "production_volume" INTEGER,
    "production_unit" VARCHAR(50),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "districts" (
    "id" VARCHAR(6) NOT NULL,
    "regency_id" VARCHAR(4) NOT NULL,
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL,
    "entity_id" UUID NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "label" VARCHAR(255) NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_type" VARCHAR(50),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_contacts" (
    "id" UUID NOT NULL,
    "participant_id" UUID,
    "legacy_tkm_id" VARCHAR(100),
    "full_name" VARCHAR(255),
    "phone_number" VARCHAR(20),
    "relationship" VARCHAR(100),
    "priority" INTEGER DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emergency_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logbook_documents" (
    "document_id" UUID NOT NULL,
    "logbook_id" UUID,

    CONSTRAINT "logbook_documents_pkey" PRIMARY KEY ("document_id")
);

-- CreateTable
CREATE TABLE "logbooks" (
    "id" UUID NOT NULL,
    "mentor_id" UUID,
    "activity_date" DATE NOT NULL,
    "start_time" TIME(6),
    "end_time" TIME(6),
    "meeting_type" VARCHAR(100),
    "visit_type" VARCHAR(100),
    "delivery_method" VARCHAR(100),
    "mentoring_material" TEXT,
    "activity_summary" TEXT,
    "obstacles" TEXT,
    "solutions" TEXT,
    "is_verified" VARCHAR(25) DEFAULT 'pending',
    "verification_note" TEXT,
    "expense_amount" DECIMAL(12,2),
    "no_expense_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logbooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logbook_attendees" (
    "id" UUID NOT NULL,
    "logbook_id" UUID,
    "participant_id" UUID,

    CONSTRAINT "logbook_attendees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentor_participants" (
    "id" UUID NOT NULL,
    "mentor_id" UUID,
    "participant_id" UUID,
    "legacy_tkm_id" VARCHAR(100),
    "assignment_status" VARCHAR(50) DEFAULT 'active',
    "batch_year" INTEGER,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mentor_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentors" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "legacy_id" BIGINT,
    "specialization" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mentors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_report_documents" (
    "document_id" UUID NOT NULL,
    "monthly_report_id" UUID,

    CONSTRAINT "monthly_report_documents_pkey" PRIMARY KEY ("document_id")
);

-- CreateTable
CREATE TABLE "monthly_reports" (
    "id" UUID NOT NULL,
    "participant_id" UUID,
    "mentor_id" UUID,
    "legacy_tkm_id" VARCHAR(100),
    "report_month" INTEGER NOT NULL,
    "report_year" INTEGER NOT NULL,
    "bookkeeping_cashflow" BOOLEAN DEFAULT false,
    "bookkeeping_income_statement" BOOLEAN DEFAULT false,
    "sales_volume" INTEGER,
    "sales_unit" VARCHAR(50),
    "production_capacity" INTEGER,
    "production_unit" VARCHAR(50),
    "marketing_area" TEXT,
    "revenue" DECIMAL(15,2),
    "business_condition" TEXT,
    "obstacles" TEXT,
    "note_confirmation" VARCHAR(255),
    "lpj_status" BOOLEAN DEFAULT false,
    "is_verified" VARCHAR(25) DEFAULT 'pending',
    "verification_note" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monthly_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participant_documents" (
    "document_id" UUID NOT NULL,
    "participant_id" UUID,

    CONSTRAINT "participant_documents_pkey" PRIMARY KEY ("document_id")
);

-- CreateTable
CREATE TABLE "participant_groups" (
    "id" UUID NOT NULL,
    "legacy_tkm_id" VARCHAR(50),
    "name" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "participant_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participants" (
    "id" UUID NOT NULL,
    "profile_id" UUID,
    "batch_id" UUID,
    "group_id" UUID,
    "legacy_tkm_id" VARCHAR(100),
    "university_id" UUID,
    "status" VARCHAR(50),
    "last_education" VARCHAR(100),
    "disability_status" BOOLEAN DEFAULT false,
    "disability_type" VARCHAR(150),
    "current_activity" TEXT,
    "communication_status" VARCHAR(255),
    "fund_disbursement" VARCHAR(255),
    "presence_status" VARCHAR(255),
    "willing_to_be_assisted" VARCHAR(255),
    "reason_not_willing" TEXT,
    "status_applicant" VARCHAR(255),
    "reason_drop" TEXT,
    "submission_status" VARCHAR(50),
    "submission_date" TIMESTAMPTZ(6),
    "registration_date" TIMESTAMPTZ(6),
    "id_pendaftar" VARCHAR(100),
    "link_detail_tkm" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "universities" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "address" TEXT,
    "city" VARCHAR(100),
    "province" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "legacy_id" INTEGER,

    CONSTRAINT "universities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "university_id" UUID,
    "full_name" VARCHAR(255),
    "id_number" VARCHAR(20),
    "whatsapp_number" VARCHAR(20),
    "kk_number" VARCHAR(25),
    "age" INTEGER,
    "social_media_type" VARCHAR(50),
    "social_media_name" VARCHAR(100),
    "social_media_link" TEXT,
    "gender" VARCHAR(10),
    "avatar_url" TEXT,
    "pob" VARCHAR(255),
    "dob" DATE,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "legacy_id" BIGINT,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provinces" (
    "id" VARCHAR(2) NOT NULL,
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "provinces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regencies" (
    "id" VARCHAR(4) NOT NULL,
    "province_id" VARCHAR(2) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(50),

    CONSTRAINT "regencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "guard_name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upload_report_documents" (
    "document_id" UUID NOT NULL,
    "upload_report_id" UUID,

    CONSTRAINT "upload_report_documents_pkey" PRIMARY KEY ("document_id")
);

-- CreateTable
CREATE TABLE "upload_reports" (
    "id" UUID NOT NULL,
    "admin_user_id" UUID,
    "note" TEXT,
    "verified" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "legacy_id" BIGINT,

    CONSTRAINT "upload_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "role_id" UUID,
    "username" VARCHAR(255),
    "email" VARCHAR(255) NOT NULL,
    "password" TEXT NOT NULL,
    "email_verified_at" TIMESTAMPTZ(6),
    "remember_token" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "legacy_id" BIGINT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "villages" (
    "id" VARCHAR(10) NOT NULL,
    "district_id" VARCHAR(6) NOT NULL,
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "villages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "batches_code_key" ON "batches"("code");

-- CreateIndex
CREATE INDEX "business_documents_business_id_idx" ON "business_documents"("business_id");

-- CreateIndex
CREATE INDEX "idx_businesses_tkm" ON "businesses"("legacy_tkm_id");

-- CreateIndex
CREATE INDEX "idx_emergency_contacts_tkm" ON "emergency_contacts"("legacy_tkm_id");

-- CreateIndex
CREATE INDEX "logbook_documents_logbook_id_idx" ON "logbook_documents"("logbook_id");

-- CreateIndex
CREATE INDEX "logbook_attendees_logbook_id_idx" ON "logbook_attendees"("logbook_id");

-- CreateIndex
CREATE INDEX "logbook_attendees_participant_id_idx" ON "logbook_attendees"("participant_id");

-- CreateIndex
CREATE INDEX "idx_mentor_participants_tkm" ON "mentor_participants"("legacy_tkm_id");

-- CreateIndex
CREATE UNIQUE INDEX "mentor_participants_mentor_id_participant_id_key" ON "mentor_participants"("mentor_id", "participant_id");

-- CreateIndex
CREATE UNIQUE INDEX "mentors_user_id_key" ON "mentors"("user_id");

-- CreateIndex
CREATE INDEX "monthly_report_documents_report_id_idx" ON "monthly_report_documents"("monthly_report_id");

-- CreateIndex
CREATE INDEX "idx_monthly_reports_tkm" ON "monthly_reports"("legacy_tkm_id");

-- CreateIndex
CREATE INDEX "participant_documents_participant_id_idx" ON "participant_documents"("participant_id");

-- CreateIndex
CREATE UNIQUE INDEX "participants_legacy_tkm_id_key" ON "participants"("legacy_tkm_id");

-- CreateIndex
CREATE INDEX "idx_participants_tkm" ON "participants"("legacy_tkm_id");

-- CreateIndex
CREATE UNIQUE INDEX "universities_legacy_id_key" ON "universities"("legacy_id");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_user_id_key" ON "profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE INDEX "upload_report_documents_report_id_idx" ON "upload_report_documents"("upload_report_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_province_id_fkey" FOREIGN KEY ("province_id") REFERENCES "provinces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_regency_id_fkey" FOREIGN KEY ("regency_id") REFERENCES "regencies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_village_id_fkey" FOREIGN KEY ("village_id") REFERENCES "villages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "business_documents" ADD CONSTRAINT "business_documents_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "business_documents" ADD CONSTRAINT "business_documents_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "business_employees" ADD CONSTRAINT "business_employees_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "districts" ADD CONSTRAINT "districts_regency_id_fkey" FOREIGN KEY ("regency_id") REFERENCES "regencies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "emergency_contacts" ADD CONSTRAINT "emergency_contacts_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "logbook_documents" ADD CONSTRAINT "logbook_documents_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "logbook_documents" ADD CONSTRAINT "logbook_documents_logbook_id_fkey" FOREIGN KEY ("logbook_id") REFERENCES "logbooks"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "logbooks" ADD CONSTRAINT "logbooks_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "mentors"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "logbook_attendees" ADD CONSTRAINT "logbook_attendees_logbook_id_fkey" FOREIGN KEY ("logbook_id") REFERENCES "logbooks"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "logbook_attendees" ADD CONSTRAINT "logbook_attendees_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mentor_participants" ADD CONSTRAINT "mentor_participants_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "mentors"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mentor_participants" ADD CONSTRAINT "mentor_participants_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mentors" ADD CONSTRAINT "mentors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "monthly_report_documents" ADD CONSTRAINT "monthly_report_documents_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "monthly_report_documents" ADD CONSTRAINT "monthly_report_documents_monthly_report_id_fkey" FOREIGN KEY ("monthly_report_id") REFERENCES "monthly_reports"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "monthly_reports" ADD CONSTRAINT "monthly_reports_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "mentors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "monthly_reports" ADD CONSTRAINT "monthly_reports_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "participant_documents" ADD CONSTRAINT "participant_documents_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "participant_documents" ADD CONSTRAINT "participant_documents_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "participant_groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "regencies" ADD CONSTRAINT "regencies_province_id_fkey" FOREIGN KEY ("province_id") REFERENCES "provinces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "upload_report_documents" ADD CONSTRAINT "upload_report_documents_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "upload_report_documents" ADD CONSTRAINT "upload_report_documents_upload_report_id_fkey" FOREIGN KEY ("upload_report_id") REFERENCES "upload_reports"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "upload_reports" ADD CONSTRAINT "upload_reports_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "villages" ADD CONSTRAINT "villages_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
