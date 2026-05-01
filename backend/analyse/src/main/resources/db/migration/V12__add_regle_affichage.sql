CREATE SEQUENCE IF NOT EXISTS regle_affichage_seq START WITH 1 INCREMENT BY 50;

CREATE TABLE IF NOT EXISTS regle_affichage (
    id              BIGINT       NOT NULL DEFAULT nextval('regle_affichage_seq'),
    condition_label VARCHAR(100),
    pays            VARCHAR(100),
    product_id      VARCHAR(50),
    product_name    VARCHAR(200),
    operation       VARCHAR(50),
    borne_inf       NUMERIC(15,3),
    op              VARCHAR(10),
    borne_sup       NUMERIC(15,3),
    navigation      VARCHAR(10)  NOT NULL,
    CONSTRAINT pk_regle_affichage PRIMARY KEY (id)
);
