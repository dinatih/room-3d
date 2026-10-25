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

## Installation homelab

Connexion vérifiée : `ssh -F ~/.ssh/config homeserver` (hôte `dinatih-homelab`).
L’alias `homelab` n’est pas défini dans la configuration SSH locale.

Les fichiers de `deploy/contact/` sont destinés à `~/stacks/room-contact/` sur le serveur.
Copier `.env.example` vers `.env`, renseigner les adresses et le compte SMTP dans ce
fichier privé (`chmod 600 .env`), puis lancer depuis ce dossier :

```bash
docker compose config -q
docker compose up -d
docker compose logs --tail=30
```

L’image Mailer est figée par son digest. La passerelle Nginx écoute uniquement sur
`127.0.0.1:5080` et expose seulement `/api/mail`. Sa politique anti-spam autorise
5 requêtes par minute par IP, avec une marge de 2 requêtes immédiates ; une requête
est limitée à 16 Kio pour couvrir le message UTF-8 de 1000 caractères et ses métadonnées.
Le champ Cloudflare d’IP client est accepté parce que le port reste limité à loopback.

La route `contact.dinatih.org` a été créée sur le tunnel `dinatih-homelab` vers
`http://localhost:5080`, ainsi que son CNAME. DNS et certificat HTTPS vérifiés ;
Home Assistant (`ha.dinatih.org`) répond toujours normalement.
L’URL du formulaire sera `https://contact.dinatih.org/api/mail`.
Ne configurer `VITE_CONTACT_ENDPOINT` qu’après vérification de SMTP et de cette route.
Pour le build GitHub Pages, ajouter la variable à l’étape de build du workflow de déploiement.

## Gmail

L’adresse d’expédition, de réception et l’identifiant Gmail sont renseignés dans
le `.env` privé du serveur. SMTP utilise `smtp.gmail.com:587` avec STARTTLS ;
la connexion TLS a été vérifiée depuis le mini-PC.

Créer un [mot de passe d’application Google](https://myaccount.google.com/apppasswords)
avec la validation en deux étapes activée, puis le saisir directement sur le serveur :

```bash
ssh -t -F ~/.ssh/config homeserver 'python ~/stacks/room-contact/set-gmail-password.py'
```

Le script masque la saisie et conserve les permissions `600` du fichier `.env`.
Ne pas utiliser le mot de passe principal Google et ne pas transmettre le secret dans
la conversation. [Documentation Google](https://support.google.com/mail/answer/185833?hl=fr).

État après préparation : mot de passe d’application manquant, conteneurs non démarrés.
Le domaine renvoie donc actuellement HTTP 502 et le formulaire reste désactivé.
Après saisie du secret, démarrer le service, vérifier l’authentification SMTP, puis
raccorder le formulaire. La réception d’un message devra ensuite être confirmée.
