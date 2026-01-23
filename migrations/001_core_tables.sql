-- PostgreSQL DDL for Normalized Legacy Database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. GEOGRAPHY LAYER
CREATE TABLE provinces (
    id VARCHAR(2) PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE regencies (
    id VARCHAR(4) PRIMARY KEY,
    province_id VARCHAR(2) NOT NULL REFERENCES provinces(id),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) -- e.g., 'Kota' or 'Kabupaten'
);

CREATE TABLE districts (
    id VARCHAR(6) PRIMARY KEY,
    regency_id VARCHAR(4) NOT NULL REFERENCES regencies(id),
    name VARCHAR(255) NOT NULL
);

CREATE TABLE villages (
    id VARCHAR(10) PRIMARY KEY,
    district_id VARCHAR(6) NOT NULL REFERENCES districts(id),
    name VARCHAR(255) NOT NULL
);

-- 2. IDENTITY & AUTHENTICATION LAYER
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    guard_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
    username VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    remember_token VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    legacy_id BIGINT -- Added for migration purposes if not already there
);

CREATE TABLE universities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    province VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    legacy_id INTEGER UNIQUE
);

CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    university_id UUID REFERENCES universities(id) ON DELETE SET NULL,
    full_name VARCHAR(255),
    id_number VARCHAR(20), -- NIK
    whatsapp_number VARCHAR(20),
    gender VARCHAR(10),
    avatar_url TEXT,
    pob VARCHAR(255), -- Place of Birth
    dob DATE, -- Date of Birth
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    legacy_id BIGINT -- Added for migration purposes
);

-- 3. ADDRESS LAYER
CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    label VARCHAR(255), -- e.g., 'KTP', 'Domisili', 'Usaha'
    province_id VARCHAR(2) REFERENCES provinces(id),
    regency_id VARCHAR(4) REFERENCES regencies(id),
    district_id VARCHAR(6) REFERENCES districts(id),
    village_id VARCHAR(10) REFERENCES villages(id),
    address_line TEXT,
    postal_code VARCHAR(10),
    longitude DECIMAL(11, 8),
    latitude DECIMAL(11, 8),
    google_maps_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
