# Qui veux gagner des litrons ?

Une application développée pour le compte de l'association [Sonerezh44](https://linktr.ee/sonerezh).

## Stack :

- VueJS
- Vite
- TailwindCSS

## Installation locale :

Modification des variables d'environnement, création d'un fichier `.env.local` en copie du `.env` original.

Remplir les valeurs :

- `VITE_SHEET_CSV_URL` : avec l'URL du document GoogleSheet exporté en CSV qui contient les questions réponses.
- `VITE_SECURITY_PASSPHRASE` : définir un mot de passe pour l'accès à l'application.

```
$ npm ci
$ npm run build
$ npm run preview
```

## Format des données :

Les données sont stockées dans un document GoogleSheet au format suivant :

| Question | Réponse correcte | Réponse incorrecte 1 | Réponse incorrecte 2 | Réponse incorrecte 3 | Difficulté | Note  | Actif |
| -------- | ---------------- | -------------------- | -------------------- | -------------------- | ---------- | ----- | ----- |
| q1       | rc               | ri1                  | ri2                  | ri3                  | Facile     | Note1 | [x]   |
| q2       | rc               | ri1                  | ri2                  | ri3                  | Moyen      |       | [x]   |
| q3       | rc               | ri1                  | ri2                  | ri3                  | Difficile  | Note3 | [ ]   |
| q4       | rc               | ri1                  | ri2                  | ri3                  | Expert     |       | [ ]   |

`Difficulté` doit impérativement contenir une valeur parmi : `Facile`, `Moyen`, `Difficile`, `Expert`.

`Actif` est un boolean (via le format `Case à cocher`).

## Notes d'utilisation :

- Une latence peut survenir entre la modification du GoogleSheet et sa lecture via l'application (l'export en CSV par le service Google peut mettre plusieurs secondes/minutes).
- Une ligne incomplète dans la base de donnée CSV est ignorée.
- Une ligne avec une difficulté inconnue est utilisée comme une question "facile".

## Roadmap et améliorations possibles :

- Définir 15 questions "fallback", utilisées par défaut pour que l'app se lance même sans connexion internet (ou erreur de lecture Google) à des fins démonstratives.
