CREATE TABLE IF NOT EXISTS backup_settings (
    id SERIAL PRIMARY KEY,
    auto_backup_enabled BOOLEAN DEFAULT TRUE,
    auto_backup_path TEXT DEFAULT 'C:/NP-Backups/',
    last_backup_time TIMESTAMP WITH TIME ZONE,
    last_backup_file TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Initialize with default settings if not exists
INSERT INTO backup_settings (id, auto_backup_enabled) 
SELECT 1, true 
WHERE NOT EXISTS (SELECT 1 FROM backup_settings WHERE id = 1);
