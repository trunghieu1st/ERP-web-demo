-- FINAL Background Jobs schema.
-- WARNING: DROP TABLE deletes existing job history. Use only when rebuilding
-- the background-job subsystem or when existing rows are disposable test data.

DROP TABLE IF EXISTS prs_background_jobs_tb;

CREATE TABLE prs_background_jobs_tb
(
    job_id UUID PRIMARY KEY,
    job_type VARCHAR(100) NOT NULL,
    payload_json JSONB NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    requested_by_user_id BIGINT NULL,
    factory_id BIGINT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    available_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMPTZ NULL,
    completed_at TIMESTAMPTZ NULL,
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    worker_id VARCHAR(200) NULL,
    last_worker_id VARCHAR(200) NULL,
    locked_at TIMESTAMPTZ NULL,
    progress INTEGER NULL,
    result_json JSONB NULL,
    error_message TEXT NULL,

    CONSTRAINT ck_prs_background_jobs_status
        CHECK (status IN ('PENDING','PROCESSING','COMPLETED','FAILED')),
    CONSTRAINT ck_prs_background_jobs_retry_count
        CHECK (retry_count >= 0),
    CONSTRAINT ck_prs_background_jobs_max_retries
        CHECK (max_retries >= 0),
    CONSTRAINT ck_prs_background_jobs_progress
        CHECK (progress IS NULL OR progress BETWEEN 0 AND 100)
);

CREATE INDEX ix_prs_background_jobs_pending
ON prs_background_jobs_tb (available_at, created_at, job_id)
WHERE status = 'PENDING';

CREATE INDEX ix_prs_background_jobs_processing_locked
ON prs_background_jobs_tb (locked_at, job_id)
WHERE status = 'PROCESSING' AND locked_at IS NOT NULL;

CREATE INDEX ix_prs_background_jobs_completed_at
ON prs_background_jobs_tb (completed_at)
WHERE status IN ('COMPLETED','FAILED') AND completed_at IS NOT NULL;
