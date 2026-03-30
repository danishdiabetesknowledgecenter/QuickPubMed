---
name: github-desktop-commit-tag-no-push
description: Udfylder commit summary automatisk og udfoerer lokal commit paa main inkl. korrekt fortloebende semver-tag i formatet vX.X.X, uden push. Bruges naar brugeren naevner GitHub Desktop, commit, tag, versionering eller oensker at forberede release uden at pushe til GitHub.
---

# GitHub Desktop Commit Med Tag (Ingen Push)

## Formaal
Lav en commit med en kort skrivelse og et korrekt naeste tag i formatet `vX.X.X`, men stop altid foer push.

## Regler
- Tryk aldrig paa knappen der sender kode til GitHub (`Push origin`).
- Opret kun lokale aendringer: commit og lokalt tag.
- Brug eksisterende git-historik og tags; gaet ikke paa versionsnummer.
- Hvis bump-type er uklar, spoerg brugeren: `major`, `minor` eller `patch`.
- Standard er automatisk udfoersel i Cursor (CLI), ikke manuel klik-guide.

## Workflow
1. Find seneste gyldige tag i formatet `vX.X.X`.
2. Beregn naeste tag:
   - `patch`: `vA.B.(C+1)`
   - `minor`: `vA.(B+1).0`
   - `major`: `v(A+1).0.0`
3. Skriv en kort commit-besked (subject + evt. body) baseret paa aendringerne.
4. Udfaer commit automatisk lokalt:
   - Sikr at branch er `main`.
   - Stage relevante filer.
   - Commit med subject i `Summary` og evt. body i `Description`.
5. Opret lokalt tag efter commit: `git tag vX.X.X`.
6. Bekraeft tydeligt at intet er pushet.

## Outputformat
Svar altid i denne struktur:

```markdown
Commit-besked:
Summary: <kort linje>
Description:
- <linje 1>
- <linje 2>

Naeste tag:
vX.X.X

Kommando (lokalt tag):
git tag vX.X.X

Status:
Commit og tag er lokale. Push er IKKE udfoert.
```

## Fejlhaandtering
- Hvis der ingen tags findes endnu: start med `v1.0.0`, medmindre brugeren angiver andet.
- Hvis seneste tag ikke matcher `vX.X.X`: ignorer ugyldige tags og brug seneste gyldige semver-tag.
- Hvis arbejdskopien er tom: oplys at der ikke er noget at committe.
