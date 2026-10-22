# Directives pour Gemini / Antigravity

Toujours lire intégralement [AGENTS.md](AGENTS.md) avant de commencer une tâche et appliquer toutes ses directives, notamment le commit obligatoire des modifications avant chaque réponse finale.


# MISSION PRINCIPALE : RÉDUIRE LES LOC, NE PAS EN AJOUTER (CHIRURGIE & TOLÉRANCE ZÉRO AUX ANTI-PATTERNS)

> [!CAUTION]
> **TON RÔLE CLÉ ABSOLU SUR CE PROJET EST DE RÉDUIRE LES LOC, JAMAIS D'EN AJOUTER INUTILEMENT !**
> - **L'utilisateur n'attend aucun étalage de code : aller au plus court, au plus sobre, au plus minimal.**
> - **INTERDICTION FORMELLE ET DÉFINITIVE DE RÉPÉTER DU CODE (ANTI-PATTERN INACCEPTABLE)** :
>   - Ne JAMAIS dupliquer des handlers identiques 4 ou 5 fois dans du JSX (`onKeyDown`, etc.) alors qu'un seul point centralisé de 3 lignes suffit !
>   - Ne JAMAIS ajouter de blocs artificiels redondants pour contourner un problème sans modifier directement l'existant.
>   - Chaque ajout de LOC doit être un coût justifié à l'extrême. Si une tâche peut être résolue en modifiant 3 lignes existantes ou en supprimant du code, **IL EST STRICTEMENT INTERDIT d'écrire 30 lignes supplémentaires**.
> - **OBLIGATION SYSTÉMATIQUE AVANT COMMIT : `git diff` & BILAN DE LOC** :
>   - Avant de commiter, inspecter chaque ligne du `git diff`.
>   - Si le diff contient de la duplication, des lignes superflues ou du code verbeux, **LE REFACTORISER IMMÉDIATEMENT POUR SUPPRIMER TOUT LE GRAS**.
>   - **AUCUNE EXCUSE N'EST ACCEPTABLE**. Inutile de prétendre que la règle était connue si elle n'est pas appliquée à la lettre à chaque commit.
>
> **RÉDUCTION DE LOC, RÉDUCTION DE LOC, RÉDUCTION DE LOC. AUCUN ANTI-PATTERN. AUCUN DOUBLON. CHIRURGIE ABSOLUE.**


# MINIMISATION STRICTE DES LOC (ÉCONOMIE ABSOLUE DE LIGNES & CHIRURGIE)

> [!CAUTION]
> **CHERCHER SYSTÉMATIQUEMENT À AJOUTER LE MOINS DE LOC POSSIBLE** :
> - **Retrait ou modification d'une fonctionnalité = modification ou suppression directe de LOC existantes** :
>   - **INTERDICTION FORMELLE** d'ajouter un nouveau bloc `if (...) return ...` ou une surcouche qui duplique du code existant alors qu'une simple modification ou suppression de lignes existantes suffit.
>   - **Si l'utilisateur demande de retirer une fonctionnalité, le diff doit être majoritairement négatif (des suppressions/modifications, PAS des ajouts massifs de nouvelles LOC !)**.
>   - **Avant chaque commit**, vérifier le `git diff` : **chaque LOC ajoutée doit être strictement indispensable**. Si un diff introduit du code redondant ou une couche de contournement évitable, le refactoriser immédiatement sur place avant de commiter.



# DIRECTIVES IMPÉRATIVES D'ÉCONOMIE DE TOKENS ET DE QUOTA

> [!CAUTION]
> **Interdiction absolue du micro-découpage de lecture (Anti-Pattern des 20 lignes)** :
> Ne JAMAIS morceler les lectures de fichiers en blocs successifs. C'est un piège absurde et inefficace :
> - **L'effet destructeur sur le contexte et les tokens** : Chaque appel d'outil renvoie l'intégralité de l'historique de la conversation au modèle. Faire 15 lectures de 30 lignes consomme **10 à 20 fois plus de tokens et de quota** que de lire une seule fois le fichier en entier !
> - **RÈGLE N°1 (Strictement contraignante)** : Tout fichier de moins de 800 lignes (la quasi-totalité du projet) **DOIT être lu en UN SEUL appel `view_file` complet** (sans spécifier `StartLine` ni `EndLine`). L'utilisation de micro-plages de 20-50 lignes est **FORMELLEMENT INTERDITE**.
> - **RÈGLE N°2 (Plafond de lectures par tour)** : **Maximum 1 à 2 lectures de fichiers (`view_file`) par message utilisateur**. Après 2 lectures, l'agent a l'interdiction de lire d'autres fichiers : il DOIT immédiatement passer à l'action (`replace_file_content` / modification) ou poser une question à l'utilisateur.
> - **RÈGLE N°3 (Interdiction de re-lecture)** : Interdiction d'appeler `view_file` plusieurs fois sur un même fichier au cours du même tour. Si le fichier a déjà été lu, l'information est déjà dans le contexte.
> - **Recherche préalable** : Utiliser `git grep -n` pour identifier les lignes d'intérêt AVANT toute modification, au lieu de chercher à tâtons avec `view_file`.
> - **Budget d'outils par tour** : Ne JAMAIS dépasser 4 à 5 appels d'outils au total par message utilisateur.
> - **Interdiction absolue d'explorer `node_modules`** : Se concentrer exclusivement sur le code du projet (`src/`).
> - **Action directe** : Dès qu'une piste ou une cause probable est identifiée, appliquer la correction et tester immédiatement au lieu de sur-analyser.


# RÈGLE D'OR POUR LES SCRIPTS TEMPORAIRES (ANTI-SPAM VALIDATION)

> [!IMPORTANT]
> **Nommage unique avec l'ID de conversation (`scripts/temp_<convId>.*`)** :
> Pour que l'utilisateur n'ait à autoriser l'exécution dans le CLI qu'une seule fois pour toute la session :
> - **Interdiction absolue des commandes inline** : Ne JAMAIS utiliser `node -e "..."` ou `python -c "..."`.
> - **Un seul script par conversation** : Utiliser un nom de fichier réutilisable basé sur l'identifiant court de la conversation active, par exemple `scripts/temp_<convId>.cjs` ou `scripts/temp_<convId>.py`.
> - **Éditer le script au lieu d'en créer de nouveaux** : Modifier le contenu de ce même fichier via `write_to_file` ou `replace_file_content`, puis ré-exécuter la commande identique (`node scripts/temp_<convId>.cjs`).
> - **Ne JAMAIS supprimer les fichiers `scripts/temp_*`** : Les laisser en place pour conserver l'autorisation de commande accordée par l'utilisateur.


# INTERDICTION ABSOLUE DE `git checkout` / `git restore` (PROTECTION DES MODIFICATIONS LOCALES)

> [!CAUTION]
> **Ne JAMAIS exécuter `git checkout -- <file>`, `git restore <file>` ou `git reset` sur un fichier modifié** :
> - Des modifications locales peuvent avoir été réalisées par l'utilisateur en direct dans son éditeur.
> - Si un fichier présente un diff qui ne concerne pas la tâche active, **ne JAMAIS l'écraser ni le restaurer** !
> - Se contenter de `git add <fichier>` uniquement sur les fichiers modifiés par la tâche en cours lors du commit, en laissant les modifications externes intactes dans le working tree.

