ALTER TABLE step_risque_commercial
    ADD COLUMN liste_exclusion_advans BOOLEAN,
    ADD COLUMN regle_alcool_tabac VARCHAR(10),
    ADD COLUMN regle_medicaments VARCHAR(10),
    ADD COLUMN travail_force_enfants BOOLEAN,
    ADD COLUMN risque_sante_securite BOOLEAN,
    ADD COLUMN impact_negatif_environnement BOOLEAN,
    ADD COLUMN activite_vulnerable_climat BOOLEAN,
    ADD COLUMN activite_zone_exposee_climat BOOLEAN,
    ADD COLUMN exigences_legales_specifiques TEXT,
    ADD COLUMN client_conformite BOOLEAN;
