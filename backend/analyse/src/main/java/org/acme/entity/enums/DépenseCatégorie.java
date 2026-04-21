package org.acme.entity.enums;

/**
 * Expense categories for Step 2 (Objet du Crédit) - Section B.
 * Used to categorize project expenses for credit analysis.
 */
public enum DépenseCatégorie {
    /**
     * Land and Building expenses
     */
    TERRAIN_BATIMENT("Terrain et Bâtiment", "Land and Building"),

    /**
     * Equipment purchases
     */
    EQUIPEMENT("Équipement", "Equipment"),

    /**
     * Fit-out and improvements
     */
    AMENAGEMENT("Aménagement", "Fit-out and Improvements"),

    /**
     * Vehicle purchases
     */
    VEHICULE("Véhicule", "Vehicle"),

    /**
     * IT and computing equipment
     */
    INFORMATIQUE("Informatique", "IT and Computing"),

    /**
     * Inventory and goods stock
     */
    STOCK_MARCHANDISES("Stock de Marchandises", "Inventory and Goods"),

    /**
     * Working capital
     */
    FONDS_DE_ROULEMENT("Fonds de Roulement", "Working Capital"),

    /**
     * Startup and initial costs
     */
    FRAIS_DEMARRAGE("Frais de Démarrage", "Startup Costs"),

    /**
     * Other expenses (catch-all)
     */
    AUTRE("Autre", "Other");

    private final String labelFr;
    private final String labelEn;

    DépenseCatégorie(String labelFr, String labelEn) {
        this.labelFr = labelFr;
        this.labelEn = labelEn;
    }

    public String getLabelFr() {
        return labelFr;
    }

    public String getLabelEn() {
        return labelEn;
    }

    public String getLabel(String locale) {
        if ("fr".equalsIgnoreCase(locale)) {
            return labelFr;
        }
        return labelEn;
    }
}
