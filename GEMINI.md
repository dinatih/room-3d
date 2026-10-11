# Directives pour Gemini / Antigravity

Toujours lire intégralement [AGENTS.md](AGENTS.md) avant de commencer une tâche et appliquer toutes ses directives, notamment le commit obligatoire des modifications avant chaque réponse finale.


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
