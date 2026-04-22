-- ============================================================
-- Step 2: Credit Object (Objet du Crédit) tables
-- ============================================================

-- Create sequence for step_objet_credit (required by Hibernate)
CREATE SEQUENCE IF NOT EXISTS step_objet_credit_seq START WITH 1 INCREMENT BY 50;

-- Main Step 2 data: Section A snapshot + balance tracking
CREATE TABLE IF NOT EXISTS step_objet_credit (
  id BIGINT PRIMARY KEY DEFAULT nextval('step_objet_credit_seq'),
  dossier_id BIGINT NOT NULL UNIQUE REFERENCES analyse_dossier(id) ON DELETE CASCADE,

  -- Section A: Read-only snapshot from demande
  loan_purpose TEXT,                      -- demande.loanPurpose
  requested_amount DECIMAL(15, 2),        -- demande.requestedAmount
  duration_months INTEGER,                -- demande.durationMonths
  product_id VARCHAR(50),                 -- demande.productId
  product_name VARCHAR(200),              -- demande.productName
  monthly_repayment_capacity DECIMAL(15, 2), -- demande.monthlyRepaymentCapacity

  -- Balance calculation
  total_cost_expenses DECIMAL(15, 2) DEFAULT 0,    -- Sum of all step_depense_projet.cout
  total_other_financing DECIMAL(15, 2) DEFAULT 0, -- Sum of step_financement_autre amounts
  is_balanced BOOLEAN DEFAULT FALSE,               -- |totalCost - (requestedAmount + totalOther)| <= 0.01
  balance_message VARCHAR(500),                    -- Warning message if imbalanced

  -- Confirmation tracking
  confirmed_by UUID,
  confirmed_at TIMESTAMP,
  data_fetched_at TIMESTAMP,
  is_complete BOOLEAN DEFAULT FALSE,

  -- Audit
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_step_objet_credit_dossier FOREIGN KEY (dossier_id)
    REFERENCES analyse_dossier(id) ON DELETE CASCADE
);

CREATE INDEX idx_step_objet_credit_dossier_id ON step_objet_credit(dossier_id);
CREATE INDEX idx_step_objet_credit_confirmed_at ON step_objet_credit(confirmed_at);

-- Create sequence for step_depense_projet
CREATE SEQUENCE IF NOT EXISTS step_depense_projet_seq START WITH 1 INCREMENT BY 50;

-- Section B: Project expenses (min 1 required)
CREATE TABLE IF NOT EXISTS step_depense_projet (
  id BIGINT PRIMARY KEY DEFAULT nextval('step_depense_projet_seq'),
  step_objet_credit_id BIGINT NOT NULL REFERENCES step_objet_credit(id) ON DELETE CASCADE,

  categorie VARCHAR(50) NOT NULL,  -- ENUM: TERRAIN_BATIMENT, EQUIPEMENT, etc.
  description TEXT NOT NULL,
  cout DECIMAL(15, 2) NOT NULL,
  ordre INT NOT NULL,              -- Display order (1-based, cascade replace reorders)

  -- Audit
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_step_depense_projet_step_credit FOREIGN KEY (step_objet_credit_id)
    REFERENCES step_objet_credit(id) ON DELETE CASCADE,
  CONSTRAINT uk_step_depense_ordre UNIQUE (step_objet_credit_id, ordre)
);

CREATE INDEX idx_step_depense_projet_step_credit_id ON step_depense_projet(step_objet_credit_id);
CREATE INDEX idx_step_depense_projet_categorie ON step_depense_projet(categorie);

-- Create sequence for step_financement_autre
CREATE SEQUENCE IF NOT EXISTS step_financement_autre_seq START WITH 1 INCREMENT BY 50;

-- Section C: Other financing sources (optional, can be empty)
CREATE TABLE IF NOT EXISTS step_financement_autre (
  id BIGINT PRIMARY KEY DEFAULT nextval('step_financement_autre_seq'),
  step_objet_credit_id BIGINT NOT NULL REFERENCES step_objet_credit(id) ON DELETE CASCADE,

  description TEXT NOT NULL,
  montant DECIMAL(15, 2) NOT NULL,
  ordre INT NOT NULL,              -- Display order (1-based)

  -- Audit
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_step_financement_autre_step_credit FOREIGN KEY (step_objet_credit_id)
    REFERENCES step_objet_credit(id) ON DELETE CASCADE,
  CONSTRAINT uk_step_financement_ordre UNIQUE (step_objet_credit_id, ordre)
);

CREATE INDEX idx_step_financement_autre_step_credit_id ON step_financement_autre(step_objet_credit_id);

-- Add constraint for valid categorie values
ALTER TABLE step_depense_projet
  ADD CONSTRAINT step_depense_projet_categorie_check
    CHECK (categorie IN (
      'TERRAIN_BATIMENT',
      'EQUIPEMENT',
      'AMENAGEMENT',
      'VEHICULE',
      'INFORMATIQUE',
      'STOCK_MARCHANDISES',
      'FONDS_DE_ROULEMENT',
      'FRAIS_DEMARRAGE',
      'AUTRE'
    ));

COMMENT ON TABLE step_objet_credit IS 'Step 2: Credit Object (Objet du Crédit) - Section A snapshot + expense totals';
COMMENT ON TABLE step_depense_projet IS 'Step 2: Project Expenses (Dépenses du Projet) - Section B items';
COMMENT ON TABLE step_financement_autre IS 'Step 2: Other Financing Sources - Section C items';
