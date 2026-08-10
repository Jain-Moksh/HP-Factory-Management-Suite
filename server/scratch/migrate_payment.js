const db = require('../config/db');

const migrate = async () => {
  const sql = `
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type_enum') THEN
            CREATE TYPE transaction_type_enum AS ENUM ('PAYMENT', 'RETURN', 'DISCOUNT');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'party_type_enum') THEN
            CREATE TYPE party_type_enum AS ENUM ('CLIENT', 'JOBBER');
        END IF;
    END$$;

    CREATE TABLE IF NOT EXISTS party_transactions (
        id SERIAL PRIMARY KEY,
        party_type party_type_enum NOT NULL,
        party_id INT NOT NULL,
        transaction_type transaction_type_enum NOT NULL,
        date DATE NOT NULL,
        challan_no TEXT NOT NULL,
        amount NUMERIC NOT NULL CHECK (amount > 0),
        payment_mode TEXT CHECK (payment_mode IN ('BANK', 'CASH') OR payment_mode IS NULL),
        remark TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE(transaction_type, challan_no)
    );

    CREATE INDEX IF NOT EXISTS idx_party_tx_party ON party_transactions(party_type, party_id);
    CREATE INDEX IF NOT EXISTS idx_party_tx_sequence ON party_transactions(transaction_type, date);
  `;

  try {
    console.log('Running database migration for party_transactions...');
    await db.query(sql);
    console.log('✅ Database migration completed successfully.');
  } catch (err) {
    console.error('❌ Database migration failed:', err);
  } finally {
    process.exit(0);
  }
};

migrate();
