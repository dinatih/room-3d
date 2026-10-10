# Directives pour Gemini / Antigravity

Toujours lire intégralement [AGENTS.md](AGENTS.md) avant de commencer une tâche et appliquer toutes ses directives, notamment le commit obligatoire des modifications avant chaque réponse finale.


# Plus que pour toi parceque tu ne comprends pas !!!
## Économie de quota et limitation d'investigation

> [!CAUTION]
> **Interdiction absolue du micro-découpage de lecture (Anti-Pattern des 20 lignes)** :
> Ne JAMAIS morceler les lectures de fichiers en blocs de 15 à 30 lignes successifs. C'est un piège absurde et inefficace :
> - **Le piège du modèle** : Quand un LLM cherche un morceau de code précis sans vue globale, son réflexe paranoïaque est d'inspecter 20 lignes autour de la cible, puis 20 lignes plus bas, entrant dans une boucle infernale de micro-lectures.
> - **L'effet pervers sur le contexte et les tokens** : Chaque appel d'outil génère un tour de boucle complet (entrée/sortie d'outil + renvoi de tout l'historique au modèle). Faire 25 lectures de 20 lignes consomme **infiniment plus de tokens, de temps et de quota d'appels API** que de lire une seule fois 400 ou 800 lignes d'un coup ! C'est extrêmement coûteux et contre-productif.
> - **Règle impérative** :
>   - Si un fichier fait moins de 800 lignes, le lire en un seul appel `view_file` (ou cibler précisément avec `grep_search`).
>   - Si une plage est nécessaire, utiliser des plages larges de **100 à 300 lignes minimum**.
>   - L'utilisateur en tant que développeur doit surveiller ce comportement et interrompre l'IA si elle retombe dans ce travers.

- **Lectures efficaces** : Utiliser des plages de lecture larges (100 à 300+ lignes) lors des appels `view_file`.
- **Budget d'outils par tour** : Ne JAMAIS dépasser 6 à 8 appels d'outils au total par message utilisateur. Si une analyse nécessite plus d'étapes, s'interrompre et faire un point avec l'utilisateur au lieu de boucler.
- **Interdiction absolue d'explorer `node_modules`** : Se concentrer exclusivement sur le code du projet (`src/`). Ne jamais lire ou parcourir les dossiers de dépendances externes.
- **Action directe** : Dès qu'une piste ou une cause probable est identifiée, appliquer la correction et tester immédiatement au lieu de sur-analyser.
