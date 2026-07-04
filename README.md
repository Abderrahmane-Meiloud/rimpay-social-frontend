# RIMPay Social — Frontend

## 1. Présentation

Ce dépôt contient l'application web frontend de RIMPay Social, une plateforme institutionnelle de gestion, de suivi et d'analyse des paiements sociaux dans le cadre d'un programme national de type PNRSCS (Programme National de Renforcement du Ciblage Social).

## 2. Rôle de l'interface web

L'interface web permet aux utilisateurs institutionnels (administrateurs, agents, décideurs) de piloter l'ensemble du cycle de gestion des paiements sociaux : consultation des bénéficiaires, suivi des opérations de paiement, analyse des tableaux de bord, détection des anomalies et export de rapports. Elle consomme l'API exposée par le backend RIMPay Social.

## 3. Fonctionnalités principales

- Authentification sécurisée et gestion de session.
- Tableau de bord analytique (répartition géographique et temporelle).
- Gestion des bénéficiaires (création, affectation, réinclusion/exclusion).
- Gestion des programmes sociaux.
- Suivi du cycle de vie des opérations de paiement (génération, détail, annulation).
- Gestion des paiements et des agents de terrain.
- Détection et consultation des anomalies.
- Consultation des journaux d'audit.
- Export de rapports (PDF, Excel).
- Affichage adapté selon le rôle de l'utilisateur (RBAC).

## 4. Pages principales

- Connexion (`Login`)
- Tableau de bord (`Dashboard`)
- Bénéficiaires et fiche bénéficiaire (`Beneficiaries`, `BeneficiaryDetails`, `BeneficiaryForm`)
- Programmes (`Programs`)
- Opérations de paiement (`PaymentOperations`, `PaymentOperationDetails`, `PaymentOperationForm`, `PaymentOperationBeneficiaries`)
- Paiements (`Payments`)
- Anomalies (`Anomalies`)
- Journaux d'audit (`AuditLogs`)
- Agents (`Agents`)
- Rapports (`Reports`)
- Paramètres (`Settings`)

## 5. Technologies utilisées

- React 19 + Vite
- React Router
- Recharts (visualisation de données)

## 6. Structure du projet

```
frontend/
├── src/
│   ├── pages/
│   ├── components/
│   ├── services/
│   ├── App.jsx
│   └── main.jsx
├── public/
├── index.html
├── .env.example
├── vite.config.js
└── package.json
```

## 7. Configuration locale

```bash
npm install
cp .env.example .env
npm run dev
```

Scripts utiles :

```bash
npm run build     # build de production
npm run preview   # prévisualisation du build
npm run lint      # analyse statique du code
```

## 8. Variables d'environnement

Le fichier `.env.example` documente les clés de configuration nécessaires, sans valeur sensible. Exemple illustratif :

```
VITE_API_BASE_URL=http://localhost:3000
```

Aucune valeur réelle n'est présente dans ce dépôt.

## 9. Connexion au backend

L'application consomme l'API REST exposée par le dépôt backend RIMPay Social. L'URL de base de l'API est configurée via la variable d'environnement `VITE_API_BASE_URL`.

## 10. Données de démonstration

L'application peut être utilisée avec des données de démonstration entièrement fictives générées côté backend, destinées uniquement aux tests et à la présentation de la plateforme.

## 11. Build

```bash
npm run build
```

Le résultat de production est généré dans le répertoire `dist/`.

## 12. Sécurité côté interface

- Aucune valeur sensible n'est stockée ou codée en dur dans le code source de l'interface.
- L'affichage des données et des actions est adapté selon le rôle de l'utilisateur authentifié.
- Toute communication avec l'API repose sur une session authentifiée.

## 13. Statut du projet

Le système est en phase de développement académique. Les fonctionnalités principales sont implémentées et vérifiées.

## 14. Auteur / Contexte académique

> Projet réalisé dans le cadre d'un stage de fin de semestre (Stage S4).
