-- =============================================================================
-- CrediWise - Client Microservice - Initial Schema
-- =============================================================================
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- ─── Reference tables ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS segment (
    id_segment   BIGSERIAL    PRIMARY KEY,
    libelle      VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS account_type (
    id_account_type BIGINT       PRIMARY KEY,
    libelle         VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS secteur_activite (
    id_secteur_activite BIGINT       PRIMARY KEY,
    libelle             VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS sous_activite (
    id_sous_activite    BIGINT       PRIMARY KEY,
    id_secteur_activite BIGINT       NOT NULL REFERENCES secteur_activite(id_secteur_activite),
    libelle             VARCHAR(255),
    ifc_level_of_risk   VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS mapping_risque_activite (
    id                   BIGSERIAL    PRIMARY KEY,
    id_secteur_activite  BIGINT       REFERENCES secteur_activite(id_secteur_activite),
    id_sous_activite     BIGINT,
    id_niveau            BIGINT,
    ifc_level_of_risk    VARCHAR(100)
);

-- ─── Clients ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS clients (
    id                         UUID         PRIMARY KEY,
    client_type                VARCHAR(10)  NOT NULL,
    status                     VARCHAR(20)  NOT NULL DEFAULT 'PROSPECT',

    -- Physical person
    first_name                 VARCHAR(100),
    last_name                  VARCHAR(100),
    date_of_birth              DATE,
    national_id                VARCHAR(50),
    tax_identifier             VARCHAR(50),
    gender                     VARCHAR(10),
    situation_familiale        VARCHAR(20),
    nationality                VARCHAR(100),
    monthly_income             NUMERIC(15, 3),

    -- Legal entity
    company_name               VARCHAR(200),
    sigle                      VARCHAR(50),
    registration_number        VARCHAR(100),
    principal_interlocutor     VARCHAR(200),

    -- Contact
    email                      VARCHAR(150),
    primary_phone              VARCHAR(30),
    secondary_phone            VARCHAR(30),
    address_street             VARCHAR(255),
    address_city               VARCHAR(100),
    address_postal             VARCHAR(20),
    address_country            VARCHAR(100),

    -- Local references
    segment_id                 BIGINT       REFERENCES segment(id_segment),
    account_type_id            BIGINT       REFERENCES account_type(id_account_type),
    secteur_activite_id        BIGINT       REFERENCES secteur_activite(id_secteur_activite),
    sous_activite_id           BIGINT       REFERENCES sous_activite(id_sous_activite),
    mapping_risque_activite_id BIGINT       REFERENCES mapping_risque_activite(id),

    -- External references (IDs only — resolved via gRPC from gestionnaire service)
    agence_id                  VARCHAR(10),
    assigned_manager_id        UUID,

    -- Other
    relation_avec_client       VARCHAR(20),
    scoring                    VARCHAR(50),
    cycle                      VARCHAR(50),
    cbs_id                     VARCHAR(100),
    attributes                 JSONB,

    -- Audit
    created_at                 TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at                 TIMESTAMP,
    created_by                 UUID,
    updated_by                 UUID,
    version                    BIGINT       NOT NULL DEFAULT 0,

    -- Unique constraints
    CONSTRAINT uq_client_email       UNIQUE (email),
    CONSTRAINT uq_client_national_id UNIQUE (national_id),
    CONSTRAINT uq_client_cbs_id      UNIQUE (cbs_id)
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX idx_client_type   ON clients(client_type);
CREATE INDEX idx_client_status ON clients(status);
CREATE INDEX idx_client_agence ON clients(agence_id);

-- ─── Seed data — Account types ───────────────────────────────────────────────

INSERT INTO account_type (id_account_type, libelle) VALUES (1, 'Current');
INSERT INTO account_type (id_account_type, libelle) VALUES (2, 'Saving');
INSERT INTO account_type (id_account_type, libelle) VALUES (3, 'Term Deposit');
INSERT INTO account_type (id_account_type, libelle) VALUES (4, 'Other');

-- ─── Seed data — Segments ────────────────────────────────────────────────────

INSERT INTO segment (id_segment, libelle) VALUES (100, 'BUSINESS MICRO');
INSERT INTO segment (id_segment, libelle) VALUES (101, 'BUSINESS SMALL');
INSERT INTO segment (id_segment, libelle) VALUES (102, 'BUSINESS MEDIUM');
INSERT INTO segment (id_segment, libelle) VALUES (103, 'VILLAGE BANKING');
INSERT INTO segment (id_segment, libelle) VALUES (107, 'FORMAL SALARY WORKER');
INSERT INTO segment (id_segment, libelle) VALUES (108, 'EXECUTIVE SALARY WORKER');
INSERT INTO segment (id_segment, libelle) VALUES (109, 'STUDENT');
INSERT INTO segment (id_segment, libelle) VALUES (110, 'DEPENDANT');
INSERT INTO segment (id_segment, libelle) VALUES (111, 'INFORMAL SALARY WORKERS');
INSERT INTO segment (id_segment, libelle) VALUES (120, 'PUBLIC ORGANIZATION');
INSERT INTO segment (id_segment, libelle) VALUES (130, 'ASSOCIATIONS/NGO/SYNDICATE');
INSERT INTO segment (id_segment, libelle) VALUES (199, 'RELIGIOUS ORGANIZATION');
INSERT INTO segment (id_segment, libelle) VALUES (201, 'SEMI FORMAL ASSOCIATIONS');
INSERT INTO segment (id_segment, libelle) VALUES (202, 'FARMER MICRO');
INSERT INTO segment (id_segment, libelle) VALUES (203, 'FARMER SMALL');
INSERT INTO segment (id_segment, libelle) VALUES (210, 'FARMER MEDIUM');
INSERT INTO segment (id_segment, libelle) VALUES (211, 'HIGH NET WORTH INDIVIDUAL');
INSERT INTO segment (id_segment, libelle) VALUES (212, 'COOPERATIVE/ PC');
INSERT INTO segment (id_segment, libelle) VALUES (213, 'BIG COMPANY');
INSERT INTO segment (id_segment, libelle) VALUES (214, 'ADVANS STAFF');
INSERT INTO segment (id_segment, libelle) VALUES (215, 'ADVANS STAFF KIDS');
INSERT INTO segment (id_segment, libelle) VALUES (216, 'ADVANS FORMER STAFF');
INSERT INTO segment (id_segment, libelle) VALUES (217, 'MINOR');
INSERT INTO segment (id_segment, libelle) VALUES (218, 'FARMER S VILLAGE BANKING');
INSERT INTO segment (id_segment, libelle) VALUES (219, 'NOT DEFINED');


SELECT setval('segment_id_segment_seq', COALESCE((SELECT MAX(id_segment) FROM segment), 0));

-- ─── Seed data — Secteurs d activite ─────────────────────────────────────────

INSERT INTO secteur_activite (id_secteur_activite, libelle) VALUES (97000, 'AGRI- ANIMAL-BREEDING');
INSERT INTO secteur_activite (id_secteur_activite, libelle) VALUES (97100, 'AGRICULTURE');
INSERT INTO secteur_activite (id_secteur_activite, libelle) VALUES (97200, 'AGRI - NON PRODUCTION');
INSERT INTO secteur_activite (id_secteur_activite, libelle) VALUES (97300, 'PRODUCTION - NON AGRI');
INSERT INTO secteur_activite (id_secteur_activite, libelle) VALUES (98000, 'WHOLESALE/IMPORT');
INSERT INTO secteur_activite (id_secteur_activite, libelle) VALUES (99000, 'RETAIL TRADE');
INSERT INTO secteur_activite (id_secteur_activite, libelle) VALUES (99100, 'TRANSPORT OF PEOPLE');
INSERT INTO secteur_activite (id_secteur_activite, libelle) VALUES (99200, 'TRANSPORT-MARCHANDISES');
INSERT INTO secteur_activite (id_secteur_activite, libelle) VALUES (99300, 'CONSTRUCTION SERVICES');
INSERT INTO secteur_activite (id_secteur_activite, libelle) VALUES (99400, 'LEISURE SERVICES');
INSERT INTO secteur_activite (id_secteur_activite, libelle) VALUES (99800, 'OTHER SERVICE');

-- ─── Seed data — sous_activite ────────────────────────────────────────────────

INSERT INTO sous_activite (id_sous_activite, id_secteur_activite, libelle, ifc_level_of_risk) VALUES
-- AGRICULTURE / LIVESTOCK
(1,97000,'BEEF CATTLE',NULL),
(2,97000,'DAIRY CATTLE',NULL),
(3,97000,'MIXED CATTLE',NULL),
(4,97000,'SHEEP',NULL),
(5,97000,'GOATS',NULL),
(6,97000,'PIGS',NULL),
(7,97000,'POULTRY MEAT',NULL),
(8,97000,'POULTRY EGGS',NULL),
(9,97000,'MIXED POULTRY',NULL),
(10,97000,'FISH FARMING',NULL),
(11,97000,'SEAFOOD',NULL),
(12,97000,'OTHER ANIMAL BREEDING',NULL),

-- CROPS
(16,97100,'OLIVES',NULL),
(17,97100,'PEPPER',NULL),
(18,97100,'RUBBER TREE',NULL),
(19,97100,'RUBBER PRODUCTION',NULL),
(21,97100,'WHEAT',NULL),
(22,97100,'BARLEY',NULL),
(23,97100,'MAIZE',NULL),
(24,97100,'RICE',NULL),
(27,97100,'POTATOES',NULL),
(28,97100,'BEANS',NULL),
(29,97100,'MIXED VEGETABLES',NULL),
(30,97100,'TOMATOES',NULL),
(31,97100,'ONIONS',NULL),
(32,97100,'LETTUCE',NULL),
(33,97100,'EGGPLANT',NULL),
(35,97100,'ORANGES',NULL),
(37,97100,'MIXED FRUITS',NULL),
(38,97100,'TREES',NULL),
(39,97100,'FLOWERS',NULL),

-- AGRO PROCESSING
(40,97200,'FISH PRODUCTS',NULL),
(41,97200,'MEAT PRODUCTS',NULL),
(42,97200,'FRUITS AND VEGETABLES',NULL),
(43,97200,'DAIRY PRODUCTS',NULL),
(44,97200,'OILS',NULL),
(45,97200,'CEREALS AND MILLING',NULL),
(46,97200,'SEEDS AND GRAINS',NULL),
(49,97200,'CHARCOAL',NULL),
(50,97200,'FARMING TOOLS SALES',NULL),
(51,97200,'AGRICULTURAL INPUTS SALES',NULL),

-- MANUFACTURING
(59,97300,'MUSICAL INSTRUMENTS',NULL),
(60,97300,'FURNITURE (NON WOOD)',NULL),
(61,97300,'CERAMICS',NULL),
(62,97300,'JEWELRY',NULL),
(63,97300,'GLASS PRODUCTION',NULL),
(65,97300,'DECORATIVE OBJECTS',NULL),
(66,97300,'FRAMING',NULL),
(67,97300,'PAPER RECYCLING',NULL),
(68,97300,'METAL RECYCLING',NULL),
(69,97300,'GLASS RECYCLING',NULL),
(70,97300,'BOATS',NULL),
(72,97300,'SOAP',NULL),
(73,97300,'COSMETICS',NULL),
(74,97300,'FURNITURE',NULL),
(75,97300,'SAWMILL',NULL),
(76,97300,'BRICKS',NULL),
(77,97300,'TILES',NULL),
(78,97300,'CEMENT',NULL),
(79,97300,'CONCRETE',NULL),

-- COMMERCE
(84,98000,'PROFESSIONAL EQUIPMENT',NULL),
(85,98000,'RAW MATERIALS',NULL),
(86,98000,'HARDWARE',NULL),
(87,98000,'CARS AND MOTORBIKES',NULL),
(88,98000,'CAR PARTS',NULL),
(89,98000,'HOME APPLIANCES',NULL),
(90,98000,'FURNITURE AND DECOR',NULL),
(91,98000,'HOUSEHOLD PLASTIC PRODUCTS',NULL),
(92,98000,'TOYS',NULL),
(93,98000,'BABY HYGIENE PRODUCTS',NULL),
(94,98000,'NON PERISHABLE FOOD',NULL),
(95,98000,'DRINKS',NULL),
(96,98000,'PERISHABLE FOOD',NULL),
(97,98000,'PERFUME AND COSMETICS',NULL),
(98,98000,'HAIR PRODUCTS',NULL),
(99,98000,'CLEANING PRODUCTS',NULL),
(100,98000,'HYGIENE PRODUCTS',NULL),
(101,98000,'MEDICAL PRODUCTS',NULL),
(102,98000,'OPTICS',NULL),
(103,98000,'BOOKSHOP EQUIPMENT',NULL),
(104,98000,'STATIONERY EQUIPMENT',NULL),
(105,98000,'TELEPHONY',NULL),
(106,98000,'PHONE CREDIT SERVICES',NULL),
(107,98000,'IT EQUIPMENT',NULL),
(108,98000,'NEW CLOTHES',NULL),
(109,98000,'SECOND HAND CLOTHES',NULL),
(110,98000,'FABRICS',NULL),
(111,98000,'NEW SHOES',NULL),
(112,98000,'SECOND HAND SHOES',NULL),
(113,98000,'BAGS AND ACCESSORIES',NULL),
(114,98000,'WATCHES AND JEWELRY',NULL),
(115,98000,'SPORTS EQUIPMENT',NULL),

-- SERVICES / RETAIL
(116,99000,'NON AGRICULTURAL EQUIPMENT',NULL),
(117,99000,'HARDWARE',NULL),
(118,99000,'CEMENT SALES',NULL),
(119,99000,'SAND AND GRAVEL',NULL),
(120,99000,'TILES AND FLOORING',NULL),
(121,99000,'CEILING MATERIALS',NULL),
(122,99000,'CAR SALES',NULL),
(123,99000,'BICYCLES',NULL),
(124,99000,'SPARE PARTS',NULL),
(125,99000,'SCRAP YARD',NULL),
(126,99000,'FUEL STATION',NULL),
(127,99000,'HOME APPLIANCES SALES',NULL),
(128,99000,'CRAFTS',NULL),
(129,99000,'DECORATION ITEMS',NULL),
(130,99000,'PLASTIC GOODS',NULL),
(131,99000,'CROCKERY',NULL),
(132,99000,'FURNITURE',NULL),
(133,99000,'CARPETS',NULL),
(134,99000,'TOY SALES',NULL),
(135,99000,'CHILD PRODUCTS',NULL),
(136,99000,'HYGIENE PRODUCTS SALES',NULL),
(137,99000,'BUTCHER',NULL),
(138,99000,'FISHMONGER',NULL),
(139,99000,'FRUIT AND VEGETABLE SALES',NULL),
(140,99000,'FLORIST',NULL),
(141,99000,'BAKERY',NULL),
(142,99000,'PASTRY SHOP',NULL),
(143,99000,'SUPERMARKET',NULL),
(144,99000,'GROCERY STORE',NULL),
(145,99000,'BEVERAGES',NULL),
(146,99000,'COSMETICS',NULL),
(147,99000,'HAIR PRODUCTS',NULL),
(148,99000,'CLEANING PRODUCTS',NULL),
(149,99000,'HYGIENE PRODUCTS',NULL),
(150,99000,'MEDICAL PRODUCTS',NULL),
(151,99000,'PHARMACY',NULL),
(152,99000,'OPTICIAN',NULL),
(153,99000,'BOOKSHOP',NULL),
(154,99000,'STATIONERY',NULL),
(155,99000,'TELEPHONY',NULL),
(156,99000,'PHONE CREDIT',NULL),
(157,99000,'IT EQUIPMENT',NULL),
(158,99000,'NEW CLOTHES',NULL),
(159,99000,'SECOND HAND CLOTHES',NULL),
(160,99000,'FABRICS',NULL),
(161,99000,'NEW SHOES',NULL),
(162,99000,'SECOND HAND SHOES',NULL),
(163,99000,'BAGS AND ACCESSORIES',NULL),
(164,99000,'WATCHES AND JEWELRY',NULL),
(165,99000,'SPORTS EQUIPMENT',NULL),

-- TRANSPORT
(166,99100,'MOTORBIKE TAXI',NULL),
(167,99100,'TAXI',NULL),
(171,99100,'CAR RENTAL',NULL),
(172,99100,'MOTORBIKE RENTAL',NULL),

-- LOGISTICS
(174,99200,'FOOD PRODUCTS',NULL),
(175,99200,'OTHER PRODUCTS',NULL),
(176,99200,'COURIER SERVICES',NULL),

-- CONSTRUCTION
(177,99300,'ARCHITECT',NULL),
(178,99300,'PROJECT MANAGER',NULL),
(179,99300,'PROMOTER',NULL),
(180,99300,'GENERAL CONTRACTOR',NULL),
(181,99300,'PAINTER',NULL),
(182,99300,'ELECTRICIAN',NULL),
(183,99300,'PLUMBING AND HVAC',NULL),
(184,99300,'MASON',NULL),
(185,99300,'EQUIPMENT RENTAL',NULL),
(186,99300,'SCAFFOLDING RENTAL',NULL),
(187,99300,'CONSTRUCTION EQUIPMENT RENTAL',NULL),

-- HOSPITALITY
(188,99400,'HOTEL',NULL),
(189,99400,'RESTAURANT',NULL),
(191,99400,'FAST FOOD',NULL),
(192,99400,'TEA ROOM',NULL),
(193,99400,'CAFE',NULL),
(194,99400,'BAR',NULL),
(195,99400,'NIGHTCLUB',NULL),
(196,99400,'TRAVEL AGENCY',NULL),
(197,99400,'SPORT FACILITY',NULL),

-- OTHER SERVICES
(200,99800,'DOCTOR',NULL),
(201,99800,'VETERINARIAN',NULL),
(202,99800,'FUNERAL SERVICES',NULL),
(203,99800,'EVENT SERVICES',NULL),
(204,99800,'PHOTOGRAPHY',NULL),
(205,99800,'ADVERTISING',NULL),
(206,99800,'MEDIA (TV/RADIO)',NULL),
(207,99800,'MANAGEMENT CONSULTING',NULL),
(208,99800,'LEGAL SERVICES',NULL),
(209,99800,'TEMPORARY WORK',NULL),
(210,99800,'DAYCARE',NULL),
(211,99800,'SCHOOL',NULL),
(212,99800,'TRAINING CENTER',NULL),
(213,99800,'GARAGE',NULL),
(214,99800,'CAR WASH',NULL),
(215,99800,'TIRE SERVICES',NULL),
(216,99800,'BICYCLE REPAIR',NULL),
(217,99800,'APPLIANCE REPAIR',NULL),
(218,99800,'WELDING',NULL),
(219,99800,'JEWELRY REPAIR',NULL),
(220,99800,'TAILOR',NULL),
(221,99800,'DRESSMAKER',NULL),
(222,99800,'SHOEMAKER',NULL),
(223,99800,'DRY CLEANING',NULL),
(224,99800,'PRINTING',NULL),
(225,99800,'PHOTOCOPY',NULL),
(226,99800,'PHOTO PRINTING',NULL),
(227,99800,'WATER SUPPLY',NULL),
(228,99800,'WASTE MANAGEMENT',NULL),
(229,99800,'MULTIMEDIA SERVICES',NULL),
(230,99800,'CYBER CAFE',NULL),
(231,99800,'VIDEO GAME ROOM',NULL),
(232,99800,'COMPUTER REPAIR',NULL),
(233,99800,'HAIRDRESSER',NULL),
(234,99800,'BEAUTY SALON',NULL),
(235,99800,'DRESS RENTAL',NULL),
(236,99800,'EVENT EQUIPMENT RENTAL',NULL),

-- PREVIOUSLY NULL FIXED
(237,97100,'ALMOND TREE',NULL),
(238,97100,'PISTACHIO TREE',NULL),
(239,97100,'DATE PALM',NULL),
(240,97100,'OTHER PLANTATIONS',NULL),
(242,97100,'SUNFLOWER',NULL),
(243,97100,'OTHER CEREALS',NULL),
(244,97100,'SUGAR BEET',NULL),
(246,97100,'CHICKPEA',NULL),
(247,97100,'GREEN PEAS',NULL),
(248,97100,'OTHER VEGETABLES',NULL),
(249,97100,'APPLE TREE',NULL),
(250,97100,'OTHER FRUITS',NULL),
(251,97100,'SEEDS',NULL),
(252,97200,'DAIRY PRODUCTS (BUTTER & ICE CREAM)',NULL),
(255,97200,'NON-ALCOHOLIC BEVERAGES',NULL),
(256,97200,'MISCELLANEOUS PRODUCTS',NULL),
(259,97300,'TEXTILE MANUFACTURING',NULL),
(260,97300,'WEAVING',NULL),
(261,97300,'SILK PRODUCTION',NULL),
(262,97300,'SHOE MANUFACTURING',NULL),
(263,97300,'LEATHER GOODS',NULL),
(264,97300,'CARPET MAKING',NULL),
(265,97300,'LEATHER PROCESSING',NULL),
(266,97300,'PLASTIC RECYCLING',NULL),
(268,97300,'MISCELLANEOUS',NULL),
(269,99000,'TILES',NULL),
(272,99000,'PLASTER',NULL),
(273,99000,'READY TO WEAR',NULL),
(274,99000,'LUGGAGE',NULL),
(276,99000,'CONSTRUCTION MATERIALS',NULL),
(277,99000,'SCRAP METAL',NULL),
(278,99000,'SPARE PARTS',NULL),
(279,99000,'SECOND HAND GOODS',NULL),
(280,99000,'POULTRY AND EGGS',NULL),
(281,99000,'DRIED FISH',NULL),
(282,99000,'CEREALS AND SPICES',NULL),
(285,99000,'FABRICS AND HABERDASHERY',NULL),
(286,99400,'GAME ROOM',NULL),
(287,99800,'KINDERGARTEN',NULL),
(288,99800,'DRIVING SCHOOL',NULL),
(289,99800,'AUTO REPAIR',NULL),
(290,99800,'CARPENTRY AND UPHOLSTERY',NULL),
(292,99800,'LAUNDRY',NULL),
(293,99800,'PUBLIC BATH',NULL),
(294,99000,'GAS STATION',NULL),
(295,99000,'GAS CYLINDER SALES',NULL);

-- ─── Seed data — mapping_risque_activite ─────────────────────────────────────────

INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (1, 97000, 1, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (2, 97000, 2, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (3, 97000, 3, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (4, 97000, 4, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (5, 97000, 5, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (6, 97000, 6, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (7, 97000, 7, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (8, 97000, 8, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (9, 97000, 9, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (10, 97000, 10, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (11, 97000, 11, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (12, 97000, 12, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (13, 97200, 52, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (14, 97200, 53, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (15, 97100, 15, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (16, 97100, 16, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (17, 97100, 17, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (18, 97100, 18, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (19, 97100, 18, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (20, 97100, 20, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (21, 97100, 21, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (22, 97100, 22, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (23, 97100, 23, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (24, 97100, 24, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (25, 97100, 25, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (26, 97100, 26, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (27, 97100, 27, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (28, 97100, 28, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (29, 97100, 29, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (30, 97100, 30, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (31, 97100, 31, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (32, 97100, 32, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (33, 97100, 33, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (34, 97200, 54, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (35, 97100, 35, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (36, 97100, 36, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (37, 97100, 37, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (38, 97100, 38, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (39, 97100, 39, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (40, 97200, 40, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (41, 97200, 41, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (42, 97200, 42, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (43, 97200, 44, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (44, 97200, 45, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (45, 97200, 46, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (46, 97100, 43, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (47, 97200, 47, 1, 'High');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (48, 97200, 48, 1, 'High');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (49, 97200, 49, 1, 'High');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (50, 97100, 50, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (51, 97100, 51, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (52, 97100, 13, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (53, 97100, 14, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (54, 97100, 34, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (55, 97300, 55, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (56, 97300, 56, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (57, 97300, 57, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (58, 97300, 58, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (59, 97300, 59, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (60, 97300, 60, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (61, 97300, 61, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (62, 97300, 62, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (63, 97300, 63, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (64, 99000, 129, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (65, 97300, 65, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (66, 97300, 67, 1, 'High');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (67, 97300, 68, 1, 'High');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (68, 97300, 69, 1, 'High');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (69, 97300, 70, 1, 'High');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (70, 97300, 71, 1, 'High');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (71, 97300, 72, 1, 'High');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (72, 97300, 73, 1, 'High');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (73, 99000, 132, 1, 'High');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (74, 97300, 75, 1, 'High');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (75, 97300, 76, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (76, 97300, 77, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (77, 97300, 78, 1, 'High');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (78, 97300, 79, 1, 'High');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (79, 97300, 80, 1, 'High');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (80, 97300, 81, 1, 'High');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (81, 97300, 82, 1, 'High');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (82, 97300, 83, 1, 'High');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (83, 98000, 84, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (84, 98000, 85, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (85, 98000, 86, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (86, 98000, 87, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (87, 98000, 88, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (88, 98000, 127, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (89, 98000, 129, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (90, 98000, 130, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (91, 98000, 92, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (92, 98000, 93, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (93, 98000, 94, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (94, 98000, 95, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (95, 98000, 96, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (96, 98000, 97, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (97, 98000, 147, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (98, 98000, 149, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (99, 98000, 150, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (100, 98000, 102, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (101, 98000, 103, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (102, 98000, 104, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (103, 98000, 105, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (104, 98000, 106, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (105, 98000, 107, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (106, 98000, 108, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (107, 98000, 109, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (108, 98000, 110, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (109, 99000, 161, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (110, 98000, 112, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (111, 98000, 113, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (112, 98000, 164, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (113, 98000, 115, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (114, 99000, 116, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (115, 99000, 117, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (116, 99000, 118, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (117, 99000, 119, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (118, 99000, 120, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (119, 99000, 121, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (120, 99000, 122, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (121, 99000, 123, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (122, 99000, 124, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (123, 99000, 125, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (124, 99000, 126, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (125, 98000, 89, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (126, 99000, 128, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (127, 99000, 64, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (128, 99000, 130, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (129, 99000, 131, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (130, 99000, 132, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (131, 99000, 133, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (132, 99000, 134, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (133, 99000, 135, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (134, 99000, 136, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (135, 99000, 137, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (136, 99000, 138, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (137, 99000, 139, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (138, 99000, 140, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (139, 99000, 141, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (140, 99000, 142, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (141, 99000, 143, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (142, 99000, 144, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (143, 99000, 145, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (144, 99000, 146, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (145, 99000, 147, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (146, 99000, 148, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (147, 99000, 100, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (148, 99000, 101, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (149, 99000, 151, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (150, 99000, 152, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (151, 99000, 153, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (152, 99000, 154, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (153, 99000, 105, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (154, 99000, 156, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (155, 99000, 157, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (156, 99000, 158, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (157, 99000, 159, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (158, 99000, 110, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (159, 99000, 161, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (160, 99000, 112, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (161, 99000, 113, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (162, 99000, 114, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (163, 99000, 165, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (164, 99100, 166, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (165, 99100, 167, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (166, 99100, 168, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (167, 99100, 169, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (168, 99100, 170, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (169, 99100, 171, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (170, 99100, 172, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (171, 99200, 173, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (172, 99200, 174, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (173, 99200, 175, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (174, 99200, 176, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (175, 99300, 177, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (176, 99300, 178, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (177, 99300, 179, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (178, 99300, 180, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (179, 99300, 181, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (180, 99300, 182, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (181, 99300, 183, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (182, 99300, 184, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (183, 99300, 185, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (184, 99300, 186, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (185, 99300, 187, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (186, 99400, 188, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (187, 99400, 189, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (188, 99400, 190, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (189, 99400, 193, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (190, 99400, 194, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (191, 99400, 195, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (192, 99400, 196, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (193, 99400, 197, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (194, 99400, 198, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (195, 99400, 199, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (196, 99800, 200, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (197, 99800, 201, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (198, 99800, 202, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (199, 99800, 203, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (200, 99800, 204, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (201, 99800, 205, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (202, 99800, 206, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (203, 99800, 207, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (204, 99800, 208, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (205, 99800, 209, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (206, 99800, 210, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (207, 99800, 211, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (208, 99800, 212, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (209, 99800, 213, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (210, 99800, 214, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (211, 99800, 215, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (212, 99800, 216, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (213, 99800, 217, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (214, 99800, 218, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (215, 99800, 219, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (216, 99800, 220, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (217, 99800, 221, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (218, 99800, 222, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (219, 99800, 223, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (220, 99800, 224, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (221, 99800, 225, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (222, 99800, 226, 2, 'Medium');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (223, 99800, 227, 1, 'High');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (224, 99800, 228, 1, 'High');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (225, 99800, 229, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (226, 99800, 230, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (227, 99800, 231, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (228, 99800, 232, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (229, 99800, 233, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (230, 99800, 234, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (231, 99800, 235, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (232, 99800, 236, 3, 'Low');
INSERT INTO mapping_risque_activite (id, id_secteur_activite, id_sous_activite, id_niveau, ifc_level_of_risk) VALUES (233, 99000, 280, 3, 'Low');
-- Row 234 omitted: sous_activite ID was missing from source data
SELECT setval('mapping_risque_activite_id_seq', COALESCE((SELECT MAX(id)         FROM mapping_risque_activite),0));


-- Update sous_activite with information from mapping_risque_activite
UPDATE sous_activite
SET ifc_level_of_risk = mra.ifc_level_of_risk
FROM mapping_risque_activite mra
WHERE sous_activite.id_sous_activite = mra.id_sous_activite;

-- ─── Sequence resets (explicit IDs were inserted above; advance sequences so ──
-- ─── Hibernate-generated IDs don't collide with seed data)  ──────────────────

