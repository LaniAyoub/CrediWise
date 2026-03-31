# Aperçu Visuel du Formulaire Gestionnaire

## 📐 Layout du Formulaire

```
┌─────────────────────────────────────────────────────────────────┐
│  Ajouter un Nouveau Gestionnaire                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Informations Personnelles                                   │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │  Prénom *                          │  Nom *                 │ │
│ │  [_________________]               │  [_________________]   │ │
│ │                                                              │ │
│ │  Date de Naissance *                                       │ │
│ │  [________________]                                         │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Informations de Contact                                     │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │  Email *                           │  Téléphone *           │ │
│ │  [_____________________]           │  [_________________]   │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Identification                                              │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │  CIN *                                                      │ │
│ │  [_________________]                                        │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Adresse                                                     │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │  Adresse                                                    │ │
│ │  [________________________________________________]          │ │
│ │  [________________________________________________]          │ │
│ │  [________________________________________________]          │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Rôle et Statut                                             │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │  Rôle *                            │  ☑ Actif              │ │
│ │  [Select role...]                  │                        │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  [ Créer le Gestionnaire ]  [ Réinitialiser ]                   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 États du Formulaire

### État Vide (Création)
```
Ajouter un Nouveau Gestionnaire
- Tous les champs vides
- Rôle par défaut: FRONT_OFFICE
- Statut par défaut: Actif
```

### État Pré-rempli (Modification)
```
Modifier le Gestionnaire
- Tous les champs remplis avec les données existantes
- Rôle sélectionné: valeur actuelle
- Statut: valeur actuelle
```

### État de Succès
```
┌─────────────────────────────────────────────────────────────┐
│ ✓ Gestionnaire créé avec succès!                             │
└─────────────────────────────────────────────────────────────┘
(Formulaire réinitialisé après 1.5 secondes)
```

### État d'Erreur
```
┌─────────────────────────────────────────────────────────────┐
│ ✗ Erreur: L'email est déjà utilisé                          │
└─────────────────────────────────────────────────────────────┘
(Formulaire reste visible)
```

### Erreurs de Champ
```
Prénom *
[_________________] ← Border rouge
Le prénom doit contenir au moins 2 caractères ← Message d'erreur rouge
```

## 📱 Responsive Breakpoints

### Desktop (> 1024px)
```
┌─────────┬─────────────────────────────────────────────┐
│ Champ 1 │ Champ 2                                     │
└─────────┴─────────────────────────────────────────────┘
```
2 colonnes pour les champs

### Tablet (768px - 1024px)
```
┌─────────┬─────────┐
│ Champ 1 │ Champ 2 │
└─────────┴─────────┘
```
2 colonnes, espace réduit

### Mobile (< 768px)
```
┌──────────────────────┐
│ Champ 1              │
├──────────────────────┤
│ Champ 2              │
└──────────────────────┘
```
1 colonne, pleine largeur

## 🎨 Palette de Couleurs

| Élément | Couleur | Hex |
|---------|---------|-----|
| Primary | Bleu | #0066cc |
| Success | Vert | #2e7d32 |
| Error | Rouge | #c62828 |
| Warning | Orange | #f57f17 |
| Border | Gris clair | #ddd |
| Background | Gris très clair | #f5f5f5 |
| Text | Gris foncé | #333 |

## 📝 Validation Visuelle

### Champ Valide
```
Prénom *
[Jean_______________]  ← Border gris normal
```

### Champ Validé
```
Prénom *
[Jean_______________]  ← Border gris, fond blanc
```

### Champ Invalide
```
Prénom *
[J_____] ← Border rouge, fond rose clair
Le prénom doit contenir au moins 2 caractères  ← Message rouge
```

### Champ en Attente
```
[ Traitement en cours... ]  ← Bouton désactivé, texte changé
```

## 🔔 Messages de Retour

### Succès
```
✓ Gestionnaire créé avec succès!
Fond: vert clair #e8f5e9
Texte: vert foncé #2e7d32
Durée: 3 secondes avant redirection
```

### Erreur
```
✗ Erreur: Email déjà utilisé
Fond: rouge clair #ffebee
Texte: rouge foncé #c62828
Durée: Visible jusqu'à correction
```

### Validation
```
Erreur sous champ
Texte: rouge #c62828
Police: 85% de la taille normale
Poids: 500
```

## 🎬 Animations

### Entrée du Formulaire
```
Slide-in du haut
Durée: 0.3s
Easing: ease-out
```

### Changement de Focus
```
Border change couleur vers #0066cc
Box-shadow bleu clair
Transition: 0.2s
```

### Bouton Hover
```
Fond: bleu plus foncé #0052a3
Ombre: légère
Transition: 0.2s
```

### Bouton Click
```
Scale: 0.98 (légère compression)
Transition: immédiate
Feedback: visuel et léger
```

## 👁️ Accessibilité

- ✓ Labels liés aux inputs (`htmlFor`)
- ✓ Contrast de couleur WCAG AA
- ✓ Focus visible sur tous les éléments
- ✓ Messages d'erreur associés
- ✓ Validation on blur et submit
- ✓ Keyboard navigation complet

## 📊 Sections Déroulables (Mobile)

Sur mobile, les fieldsets sont clairement séparés:
1. Informations Personnelles
2. Informations de Contact
3. Identification
4. Adresse
5. Rôle et Statut

Chaque section a une couleur de fond légèrement différente.
