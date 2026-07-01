# Optic Manager V3 — Ventes + Brouillons + Ordonnances

Cette version ajoute :
- module ventes complet
- statut : brouillon, en attente, terminée, annulée
- date de relance
- import/scan ordonnance image ou PDF
- paiements
- assurance
- modification d'une vente
- tableau de bord qui compte seulement les ventes terminées dans le CA

## Installation

1. Décompresse le ZIP.
2. Upload les fichiers sur GitHub.
3. Commit changes.
4. Attends Vercel.
5. Ouvre :
   https://optic-manager-gray.vercel.app/api/setup

6. Puis :
   https://optic-manager-gray.vercel.app

Comptes :
- admin@optic.com / admin123
- vendeuse@optic.com / vente123
- direction@optic.com / direction123

Note : dans cette V3, les ordonnances sont stockées en base64 dans Neon pour simplifier l'installation. Limite conseillée : moins de 900 Ko par fichier. Une prochaine version pourra utiliser un vrai stockage de fichiers.
