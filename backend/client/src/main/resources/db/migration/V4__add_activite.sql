-- ============================================================
-- V2: Add activite table (intermediate level between secteur and sous_activite)
-- ============================================================

-- Step 1: Create activite table
CREATE TABLE IF NOT EXISTS activite (
    id_activite         BIGINT       PRIMARY KEY,
    id_secteur_activite BIGINT       NOT NULL REFERENCES secteur_activite(id_secteur_activite),
    libelle             VARCHAR(200) NOT NULL,
    id_niveau           INT          NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activite_secteur ON activite(id_secteur_activite);

-- Step 2: Seed activite data
INSERT INTO activite (id_activite, id_secteur_activite, libelle, id_niveau) VALUES
-- 97000 AGRI-ANIMAL-BREEDING
(1, 97000, 'ANIMAL BREEDING', 2),
-- 97100 AGRICULTURE
(2, 97100, 'OLEAGINOUS AND INDUSTRIAL CROPS', 2),
(3, 97100, 'CEREALS', 2),
(4, 97100, 'VEGETABLES', 2),
(5, 97100, 'FRUITS', 2),
(6, 97100, 'TREES AND PLANTATIONS', 2),
(7, 97100, 'SEEDS AND GRAINS', 2),
(8, 97100, 'CROP PROCESSING AND TRADE', 3),
-- 97200 AGRI-NON PRODUCTION
(9, 97200, 'FOOD PROCESSING', 2),
(10, 97200, 'PACKAGING', 2),
(11, 97200, 'ALCOHOLIC BEVERAGES', 1),
(12, 97200, 'CHARCOAL AND BIOMASS', 1),
(13, 97200, 'AGRICULTURAL TOOLS AND INPUTS', 3),
-- 97300 PRODUCTION NON AGRI
(14, 97300, 'TEXTILE MANUFACTURING', 2),
(15, 97300, 'LEATHER AND SHOES', 2),
(16, 97300, 'ARTS, CRAFTS AND DECOR', 2),
(17, 97300, 'RECYCLING', 1),
(18, 97300, 'WOOD AND FURNITURE', 1),
(19, 97300, 'SOAP AND COSMETICS', 1),
(20, 97300, 'METALWORK', 1),
(21, 97300, 'CONSTRUCTION MATERIALS PRODUCTION', 2),
(22, 97300, 'MISCELLANEOUS MANUFACTURING', 2),
-- 98000 WHOLESALE/IMPORT
(23, 98000, 'PROFESSIONAL AND INDUSTRIAL EQUIPMENT', 3),
(24, 98000, 'VEHICLES AND SPARE PARTS', 3),
(25, 98000, 'HOME APPLIANCES AND FURNITURE', 3),
(26, 98000, 'FOOD AND BEVERAGES', 3),
(27, 98000, 'HEALTH, BEAUTY AND CLEANING', 3),
(28, 98000, 'OFFICE SUPPLIES AND TECHNOLOGY', 3),
(29, 98000, 'CLOTHING AND ACCESSORIES', 3),
-- 99000 RETAIL TRADE
(30, 99000, 'BUILDING AND CONSTRUCTION MATERIALS', 3),
(31, 99000, 'VEHICLES AND AUTO PARTS', 3),
(32, 99000, 'HOME GOODS AND DECORATION', 3),
(33, 99000, 'CHILDREN AND TOYS', 3),
(34, 99000, 'FRESH FOOD', 3),
(35, 99000, 'GROCERIES AND BEVERAGES', 3),
(36, 99000, 'HEALTH AND BEAUTY', 3),
(37, 99000, 'OFFICE, BOOKS AND STATIONERY', 3),
(38, 99000, 'TELEPHONY AND TECHNOLOGY', 3),
(39, 99000, 'CLOTHING', 3),
(40, 99000, 'SHOES AND ACCESSORIES', 3),
(41, 99000, 'SPORTS EQUIPMENT', 3),
-- 99100 TRANSPORT OF PEOPLE
(42, 99100, 'PUBLIC TRANSPORT', 2),
(43, 99100, 'VEHICLE RENTAL', 2),
-- 99200 TRANSPORT-MARCHANDISES
(44, 99200, 'FREIGHT TRANSPORT', 2),
(45, 99200, 'COURIER AND LOGISTICS', 2),
-- 99300 CONSTRUCTION SERVICES
(46, 99300, 'PROJECT DESIGN AND MANAGEMENT', 2),
(47, 99300, 'CONSTRUCTION TRADES', 2),
(48, 99300, 'EQUIPMENT RENTAL', 2),
-- 99400 LEISURE SERVICES
(49, 99400, 'HOTEL AND ACCOMMODATION', 2),
(50, 99400, 'FOOD AND BEVERAGE SERVICES', 3),
(51, 99400, 'SPORT AND FITNESS', 3),
(52, 99400, 'ENTERTAINMENT AND LEISURE', 3),
(53, 99400, 'TRAVEL AND TOURISM', 2),
-- 99800 OTHER SERVICES
(54, 99800, 'HEALTH AND VETERINARY SERVICES', 2),
(55, 99800, 'FUNERAL SERVICES', 2),
(56, 99800, 'EVENTS AND PHOTOGRAPHY', 3),
(57, 99800, 'ADVERTISING AND MEDIA', 3),
(58, 99800, 'CONSULTING, LEGAL AND STAFFING', 3),
(59, 99800, 'EDUCATION AND TRAINING', 3),
(60, 99800, 'AUTO REPAIR AND SERVICES', 2),
(61, 99800, 'REPAIR, WELDING AND CRAFTS', 2),
(62, 99800, 'LAUNDRY AND CLEANING', 2),
(63, 99800, 'PRINTING', 2),
(64, 99800, 'WATER AND WASTE MANAGEMENT', 1),
(65, 99800, 'MULTIMEDIA AND TECHNOLOGY SERVICES', 3),
(66, 99800, 'HAIRDRESSING AND BEAUTY', 3),
(67, 99800, 'EQUIPMENT RENTAL SERVICES', 3);

-- Step 3: Add id_activite column to sous_activite (nullable for migration safety)
ALTER TABLE sous_activite ADD COLUMN IF NOT EXISTS id_activite BIGINT;

-- Step 4: Map each sous_activite to its activite
UPDATE sous_activite SET id_activite = 1  WHERE id_sous_activite IN (1,2,3,4,5,6,7,8,9,10,11,12);
UPDATE sous_activite SET id_activite = 2  WHERE id_sous_activite IN (16,17,18,19);
UPDATE sous_activite SET id_activite = 3  WHERE id_sous_activite IN (20,21,22,23,24,242,243,244);
UPDATE sous_activite SET id_activite = 4  WHERE id_sous_activite IN (25,26,27,28,29,30,31,32,33,246,247,248);
UPDATE sous_activite SET id_activite = 5  WHERE id_sous_activite IN (34,35,36,37,249,250);
UPDATE sous_activite SET id_activite = 6  WHERE id_sous_activite IN (38,39,237,238,239,240);
UPDATE sous_activite SET id_activite = 7  WHERE id_sous_activite IN (251);
UPDATE sous_activite SET id_activite = 8  WHERE id_sous_activite IN (13,14,15);
UPDATE sous_activite SET id_activite = 9  WHERE id_sous_activite IN (40,41,42,43,44,45,46,252,255,256);
UPDATE sous_activite SET id_activite = 10 WHERE id_sous_activite IN (52,53,54);
UPDATE sous_activite SET id_activite = 11 WHERE id_sous_activite IN (47,48);
UPDATE sous_activite SET id_activite = 12 WHERE id_sous_activite IN (49);
UPDATE sous_activite SET id_activite = 13 WHERE id_sous_activite IN (50,51);
UPDATE sous_activite SET id_activite = 14 WHERE id_sous_activite IN (55,56,57,58,259,260,261);
UPDATE sous_activite SET id_activite = 15 WHERE id_sous_activite IN (262,263,264,265);
UPDATE sous_activite SET id_activite = 16 WHERE id_sous_activite IN (59,60,61,62,63,65,66);
UPDATE sous_activite SET id_activite = 17 WHERE id_sous_activite IN (67,68,69,266);
UPDATE sous_activite SET id_activite = 18 WHERE id_sous_activite IN (70,71,74,75);
UPDATE sous_activite SET id_activite = 19 WHERE id_sous_activite IN (72,73);
UPDATE sous_activite SET id_activite = 20 WHERE id_sous_activite IN (80,81,82,83);
UPDATE sous_activite SET id_activite = 21 WHERE id_sous_activite IN (76,77,78,79);
UPDATE sous_activite SET id_activite = 22 WHERE id_sous_activite IN (268);
UPDATE sous_activite SET id_activite = 23 WHERE id_sous_activite IN (84,85,86);
UPDATE sous_activite SET id_activite = 24 WHERE id_sous_activite IN (87,88);
UPDATE sous_activite SET id_activite = 25 WHERE id_sous_activite IN (89,90,91,92,93);
UPDATE sous_activite SET id_activite = 26 WHERE id_sous_activite IN (94,95,96);
UPDATE sous_activite SET id_activite = 27 WHERE id_sous_activite IN (97,98,99,100,101,102);
UPDATE sous_activite SET id_activite = 28 WHERE id_sous_activite IN (103,104,105,106,107);
UPDATE sous_activite SET id_activite = 29 WHERE id_sous_activite IN (108,109,110,111,112,113,114,115);
UPDATE sous_activite SET id_activite = 30 WHERE id_sous_activite IN (116,117,118,119,120,121,269,272,276);
UPDATE sous_activite SET id_activite = 31 WHERE id_sous_activite IN (122,123,124,125,126,277,278,279,294,295);
UPDATE sous_activite SET id_activite = 32 WHERE id_sous_activite IN (127,128,129,130,131,132,133);
UPDATE sous_activite SET id_activite = 33 WHERE id_sous_activite IN (134,135);
UPDATE sous_activite SET id_activite = 34 WHERE id_sous_activite IN (136,137,138,139,140,280,281,282);
UPDATE sous_activite SET id_activite = 35 WHERE id_sous_activite IN (141,142,143,144,145);
UPDATE sous_activite SET id_activite = 36 WHERE id_sous_activite IN (64,146,147,148,149,150,151,152);
UPDATE sous_activite SET id_activite = 37 WHERE id_sous_activite IN (153,154);
UPDATE sous_activite SET id_activite = 38 WHERE id_sous_activite IN (155,156,157);
UPDATE sous_activite SET id_activite = 39 WHERE id_sous_activite IN (158,159,160,273);
UPDATE sous_activite SET id_activite = 40 WHERE id_sous_activite IN (161,162,163,164,274,285);
UPDATE sous_activite SET id_activite = 41 WHERE id_sous_activite IN (165);
UPDATE sous_activite SET id_activite = 42 WHERE id_sous_activite IN (166,167,168,169,170);
UPDATE sous_activite SET id_activite = 43 WHERE id_sous_activite IN (171,172);
UPDATE sous_activite SET id_activite = 44 WHERE id_sous_activite IN (173,174,175);
UPDATE sous_activite SET id_activite = 45 WHERE id_sous_activite IN (176);
UPDATE sous_activite SET id_activite = 46 WHERE id_sous_activite IN (177,178,179);
UPDATE sous_activite SET id_activite = 47 WHERE id_sous_activite IN (180,181,182,183,184);
UPDATE sous_activite SET id_activite = 48 WHERE id_sous_activite IN (185,186,187);
UPDATE sous_activite SET id_activite = 49 WHERE id_sous_activite IN (188);
UPDATE sous_activite SET id_activite = 50 WHERE id_sous_activite IN (189,191,192,193,194,195);
UPDATE sous_activite SET id_activite = 51 WHERE id_sous_activite IN (190,197,198,199);
UPDATE sous_activite SET id_activite = 52 WHERE id_sous_activite IN (286);
UPDATE sous_activite SET id_activite = 53 WHERE id_sous_activite IN (196);
UPDATE sous_activite SET id_activite = 54 WHERE id_sous_activite IN (200,201);
UPDATE sous_activite SET id_activite = 55 WHERE id_sous_activite IN (202);
UPDATE sous_activite SET id_activite = 56 WHERE id_sous_activite IN (203,204);
UPDATE sous_activite SET id_activite = 57 WHERE id_sous_activite IN (205,206);
UPDATE sous_activite SET id_activite = 58 WHERE id_sous_activite IN (207,208,209);
UPDATE sous_activite SET id_activite = 59 WHERE id_sous_activite IN (210,211,212,287,288);
UPDATE sous_activite SET id_activite = 60 WHERE id_sous_activite IN (213,214,215,216,217,289);
UPDATE sous_activite SET id_activite = 61 WHERE id_sous_activite IN (218,219,220,221,222,290);
UPDATE sous_activite SET id_activite = 62 WHERE id_sous_activite IN (223,292,293);
UPDATE sous_activite SET id_activite = 63 WHERE id_sous_activite IN (224,225,226);
UPDATE sous_activite SET id_activite = 64 WHERE id_sous_activite IN (227,228);
UPDATE sous_activite SET id_activite = 65 WHERE id_sous_activite IN (229,230,231,232);
UPDATE sous_activite SET id_activite = 66 WHERE id_sous_activite IN (233,234);
UPDATE sous_activite SET id_activite = 67 WHERE id_sous_activite IN (235,236);

-- Step 5: Add FK constraint on sous_activite
ALTER TABLE sous_activite
    ADD CONSTRAINT fk_sous_activite_activite
    FOREIGN KEY (id_activite) REFERENCES activite(id_activite);

CREATE INDEX IF NOT EXISTS idx_sous_activite_activite ON sous_activite(id_activite);

-- Step 6: Add id_activite to mapping_risque_activite and back-fill from sous_activite
ALTER TABLE mapping_risque_activite ADD COLUMN IF NOT EXISTS id_activite BIGINT;

UPDATE mapping_risque_activite mra
SET id_activite = sa.id_activite
FROM sous_activite sa
WHERE mra.id_sous_activite = sa.id_sous_activite;

ALTER TABLE mapping_risque_activite
    ADD CONSTRAINT fk_mra_activite
    FOREIGN KEY (id_activite) REFERENCES activite(id_activite);

-- Step 7: Add activite_id to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS activite_id BIGINT REFERENCES activite(id_activite);

-- Back-fill activite_id from the client's sous_activite
UPDATE clients c
SET activite_id = sa.id_activite
FROM sous_activite sa
WHERE c.sous_activite_id = sa.id_sous_activite;

CREATE INDEX IF NOT EXISTS idx_client_activite ON clients(activite_id);
