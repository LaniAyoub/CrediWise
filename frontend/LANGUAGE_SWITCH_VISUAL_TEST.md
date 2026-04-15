# Visual Language Switch Test Guide - What Should Change

Switch from **English (EN)** to **French (FR)** and verify EVERYTHING on this list changes instantly:

---

## 🏠 DASHBOARD PAGE

### Main Header
| EN | FR | Location |
|----|----|----------|
| Dashboard | Tableau de bord | Page title (sidebar) |
| Welcome back, [name]! 👋 | Bienvenue, [name]! 👋 | Top of page |
| Here's an overview of your branch management system | Voici un aperçu de votre système de gestion des agences | Subtitle (admin only) |

### Stat Cards (Row 1)
| EN | FR | Location |
|----|----|----------|
| Total Clients | Total des Clients | Card title |
| 25 active · 5 prospects | 25 actif · 5 prospect | Card subtitle |
| Total Requests | Total des Demandes | Card title |
| 10 submitted · 8 approved | 10 soumis · 8 approuvé | Card subtitle |
| My Clients | Mes Clients | Card title |
| Assigned to [name] | Assigné à [name] | Card subtitle |
| Draft Demandes | Demandes en Brouillon | Card title |
| 2 rejected | 2 rejeté | Card subtitle |

### Stat Cards (Row 2 - Admin Only)
| EN | FR | Location |
|----|----|----------|
| Total Branches | Total des Agences | Card title |
| 5 active | 5 actif | Card subtitle |
| Total Managers | Total des Gestionnaires | Card title |
| Active Managers | Gestionnaires Actifs | Card title |
| Currently active | Actuellement actif | Card subtitle |
| Inactive Managers | Gestionnaires Inactifs | Card title |
| Deactivated | Désactivé | Card subtitle |

### Section Titles
| EN | FR | Location |
|----|----|----------|
| Recent Clients | Clients Récents | Section title |
| View all → | Voir tout → | Button in section |
| No clients yet | Pas encore de clients | Empty state |
| Recent Demandes | Demandes Récentes | Section title |
| No demandes yet | Pas encore de demandes | Empty state |
| My Portfolio Summary | Résumé de Mon Portefeuille | Section title (non-admin) |
| Agence | Agence | Label |
| My assigned clients | Mes clients assignés | Portfolio stat |
| 50% of total clients | 50% du total des clients | Portfolio percentage |
| Active | Actif | Quick stat badge |
| Prospects | Prospects | Quick stat badge |
| Recent Agences | Agences Récentes | Section title (admin only) |
| No agences found | Aucune agence trouvée | Empty state (admin) |

---

## 🏢 AGENCES (BRANCHES) PAGE

### Header
| EN | FR | Location |
|----|----|----------|
| Branches | Agences | Page title |
| Manage your branches | Gérer vos agences | Subtitle |
| Add Agence (button) | Ajouter Agence | Top button |

### Table
| EN | FR | Location |
|----|----|----------|
| Branch ID | ID Agence | Column header |
| Label | Libellé | Column header |
| Description | Description | Column header |
| Status | Statut | Column header |
| Actions | Actions | Column header |
| Active | Actif | Status badge |
| Inactive | Inactif | Status badge |
| Edit | Modifier | Button text |
| No agences found. Create your first one! | Aucune agence trouvée. Créez la vôtre! | Empty state |
| No agences match your search | Aucune agence ne correspond à votre recherche | Search empty state |

### Modal - Create
| EN | FR | Location |
|----|----|----------|
| Create New Agence | Créer une Nouvelle Agence | Modal title |
| Create Agence (form button) | Créer Agence | Form submit button |

### Modal - Edit
| EN | FR | Location |
|----|----|----------|
| Edit Agence | Modifier Agence | Modal title |
| Update Agence (form button) | Mettre à Jour Agence | Form submit button |

---

## 👥 GESTIONNAIRES (MANAGERS) PAGE

### Header
| EN | FR | Location |
|----|----|----------|
| Managers | Gestionnaires | Page title |
| Manage your credit managers | Gérer vos gestionnaires de crédit | Subtitle |
| Add Manager (button) | Ajouter Gestionnaire | Top button |

### Table
| EN | FR | Location |
|----|----|----------|
| Name | Nom | Column header |
| Email | Email | Column header |
| CIN | CIN | Column header |
| Role | Rôle | Column header |
| Agence | Agence | Column header |
| Status | Statut | Column header |
| Actions | Actions | Column header |
| Active | Actif | Status badge |
| Inactive | Inactif | Status badge |
| Edit | Modifier | Button text |
| Delete | Supprimer | Button text |
| No gestionnaires found. Create your first one! | Aucun gestionnaire trouvé. Créez le vôtre! | Empty state |
| No managers match your search | Aucun gestionnaire ne correspond à votre recherche | Search empty state |

### Modal - Create
| EN | FR | Location |
|----|----|----------|
| Add New Manager | Ajouter un Nouveau Gestionnaire | Modal title |
| Create Manager (form button) | Créer Gestionnaire | Form submit button |

### Modal - Edit
| EN | FR | Location |
|----|----|----------|
| Edit Manager | Modifier Gestionnaire | Modal title |
| Update Manager (form button) | Mettre à Jour Gestionnaire | Form submit button |

### Modal - Delete
| EN | FR | Location |
|----|----|----------|
| Delete Manager | Supprimer Gestionnaire | Dialog title |
| Are you sure you want to delete [name]? | Êtes-vous sûr de vouloir supprimer [name]? | Dialog message |

---

## 👤 CLIENTS PAGE

### Quick Search Section
| EN | FR | Location |
|----|----|----------|
| Quick Search | Recherche Rapide | Section subtitle |

### Table
| EN | FR | Location |
|----|----|----------|
| Client | Client | Column header |
| Type | Type | Column header |
| Classification | Classification | Column header |
| Contact | Contact | Column header |
| Assignment | Assignation | Column header |
| Status | Statut | Column header |
| Cycle | Cycle | Column header |
| Actions | Actions | Column header |
| Active | Actif | Status badge |
| Inactive | Inactif | Status badge |
| Edit | Modifier | Button text |
| Delete | Supprimer | Button text |
| No clients yet. Create the first one! | Aucun client trouvé. Créez le vôtre! | Empty state |
| No clients match your search | Aucun client ne correspond à votre recherche | Search empty state |

### Modal - Create
| EN | FR | Location |
|----|----|----------|
| Add New Client | Créer un Nouveau Client | Modal title |
| Create Client (form button) | Créer Client | Form submit button |

### Modal - Edit
| EN | FR | Location |
|----|----|----------|
| Edit Client | Modifier Client | Modal title |
| Update Client (form button) | Mettre à Jour Client | Form submit button |

---

## 📋 DEMANDES (REQUESTS) PAGE

### Table
| EN | FR | Location |
|----|----|----------|
| Client | Client | Column header |
| Status | Statut | Column header |
| Financial | Financial | Column header (not translated - financial terminology) |
| Assignment | Assignment | Column header (not translated - field specific) |
| Timeline | Timeline | Column header (not translated - field specific) |
| Actions | Actions | Column header |
| Draft | Brouillon | Status badge |
| Submitted | Soumis | Status badge |
| Validated | Validé | Status badge |
| Approved | Approuvée | Status badge |
| Rejected | Rejetée | Status badge |
| No requests found. Create your first one! | Aucune demande trouvée. Créez la vôtre! | Empty state |
| No requests match your search | Aucune demande ne correspond à votre recherche | Search empty state |

---

## 📱 PROFILE PAGE

### Form Sections
| EN | FR | Location |
|----|----|----------|
| Personal Information | Informations Personnelles | Section title |
| Change Password | Changer le Mot de Passe | Section title |
| Session | Session | Section title |
| Save Changes | Enregistrer les Modifications | Button |
| Change Password | Changer le Mot de Passe | Button |
| Sign Out | Déconnexion | Button |

---

## 🎯 COMMON UI ELEMENTS (ALL PAGES)

### Navigation Sidebar
| EN | FR | Location |
|----|----|----------|
| Dashboard | Tableau de bord | Menu item |
| Branches | Agences | Menu item |
| Managers | Gestionnaires | Menu item |
| Clients | Clients | Menu item |
| Requests | Demandes | Menu item |
| Profile | Profil | Menu item |

### Header Navigation
| EN | FR | Location |
|----|----|----------|
| My Profile | Mon Profil | Dropdown menu |
| Logout | Déconnexion | Dropdown menu |

### Common Buttons & Text
| EN | FR | Location |
|----|----|----------|
| Search... (placeholder) | Rechercher... | SearchBar component |
| Cancel | Annuler | Confirm dialog |
| Loading... | Chargement... | Loading spinner |
| Loading CrediWise... | Chargement de CrediWise... | Loading screen |
| No data found | Aucune donnée trouvée | Table empty state |
| All rights reserved | Tous droits réservés | Footer |
| Active | Actif | Badges everywhere |
| Inactive | Inactif | Badges everywhere |

---

## ✅ Quick Test Procedure

1. **Open application** → Navigate to Dashboard
2. **Click language selector** (top-right corner) → Change to French
3. **VERIFY**: Wait 1-2 seconds for instant re-render
4. **CHECK**: All items in the above tables change to French
5. **NAVIGATE**: Go to each page (Agences, Gestionnaires, Clients, Demandes)
6. **VERIFY**: All items on those pages are in French
7. **CLICK**: Try clicking buttons - they should have French text
8. **REFRESH**: Press F5 to refresh page
9. **CHECK**: Language is still French (localStorage persistence)
10. **SWITCH**: Click language selector → Change back to English
11. **VERIFY**: Everything changes back to English instantly

---

## 🎉 Success Criteria

✅ All text changes from EN to FR instantly (no page reload)  
✅ ALL items in the tables above translate  
✅ Buttons translate  
✅ Modals translate  
✅ Badges translate  
✅ Empty state messages translate  
✅ Form labels translate  
✅ Language persists after page refresh  
✅ Switching back to EN works  

**If ALL of the above are TRUE, the i18n implementation is 100% complete!** 🚀

