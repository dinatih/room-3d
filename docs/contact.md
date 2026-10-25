# Formulaire de contact

Le bouton « Me contacter » du panneau « Mon CV » ouvre un formulaire compatible
avec [Mailer](https://rclement.github.io/mailer/), un backend open source Python
auto-hébergeable sur le mini-PC avec Docker. Il transmet les messages par SMTP.

## Raccordement

1. Déployer Mailer selon sa [documentation](https://rclement.github.io/mailer/deployment/).
2. Configurer côté serveur `TO_EMAIL`, `TO_NAME`, `SENDER_EMAIL` et les paramètres
   `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_TLS`, `SMTP_SSL`.
3. Publier le service sur une URL HTTPS accessible aux visiteurs via le reverse proxy
   du mini-PC et limiter les requêtes à ce niveau pour réduire le spam.
4. Définir `CORS_ORIGINS` avec l’origine exacte du site, et celle du serveur Vite
   si nécessaire. Le formulaire utilise le champ anti-robot `honeypot`.
5. Définir `VITE_CONTACT_ENDPOINT=https://contact.example.org/api/mail` dans
   l’environnement de compilation du site, puis reconstruire et redéployer.
   Pour Vite en local, cette variable peut être ajoutée à `.env.local` ; redémarrer Vite.

L’URL est publique ; aucun identifiant SMTP ne doit figurer dans une variable `VITE_*`.
Sans URL configurée, le formulaire indique son indisponibilité et désactive l’envoi.
Le client respecte les limites Mailer : nom de 50 caractères, message de 1000 caractères.
Tester un envoi réel après déploiement et vérifier sa réception dans la boîte destinataire.
