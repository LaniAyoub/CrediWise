#!/bin/bash

# Script d'initialisation du projet Frontend CrediWise
# Usage: ./init-frontend.sh

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Initialisation du Frontend CrediWise                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Vérifier que Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé!"
    echo "Veuillez installer Node.js 16+ depuis https://nodejs.org"
    exit 1
fi

echo "✓ Node.js ""$(node -v)"""
echo "✓ npm $(npm -v)"
echo ""

# Installer les dépendances
echo "📦 Installation des dépendances..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de l'installation des dépendances"
    exit 1
fi

echo ""
echo "✓ Dépendances installées"
echo ""

# Afficher les prochaines étapes
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Configuration Complète!                                   ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Prochaines étapes:"
echo ""
echo "1. Configuration du Backend:"
echo "   - Assurez-vous que le serveur Quarkus fonctionne en http://localhost:8080"
echo "   - CORS doit être activé"
echo ""
echo "2. Configuration de l'API:"
echo "   - Modifiez 'vite.config.js' si l'URL du backend est différente"
echo "   - Ou modifiez 'src/services/api.js'"
echo ""
echo "3. Démarrer le serveur de développement:"
echo "   npm run dev"
echo ""
echo "4. Ouvrir dans le navigateur:"
echo "   http://localhost:3000"
echo ""
echo "Pour plus d'informations, consultez:"
echo "   - README.md pour le démarrage"
echo "   - FORM_GUIDE.md pour l'utilisation du formulaire"
echo "   - INTEGRATION_GUIDE.md pour l'intégration backend"
echo ""
