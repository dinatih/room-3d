# Exception Cloudflare pour Google Home

## Cause confirmée

Le 27 octobre 2026, Google Cloud Logging a signalé une erreur
`AUTH_CODE_EXCHANGE` : la réponse reçue n’était pas du JSON. Le détail de la
réponse montrait HTTP **403**, une page HTML Cloudflare « Sorry, you have been
blocked » et le Ray ID `a50feaaced42f45b`.

La règle Cloudflare **Bloquer accès HA hors France** empêchait le serveur Google
situé hors de France d’appeler `/auth/token`. L’adresse observée `108.177.64.129`
appartient à **AS15169**, vérifié auprès de RIPE. L’authentification utilisateur
avait pu avancer dans le navigateur du téléphone ; le serveur Google était bloqué
lors de l’échange suivant.

Les tests HTTP depuis notre réseau français atteignaient normalement HA : ils ne
suffisaient donc pas à vérifier l’accès depuis Google.

## Règle active

Zone : `dinatih.org` ; règle `b2293e7cdf9b428d9975e3391ebb5391`.
Action **Block**, ordre initial conservé. Expression enregistrée et relue dans
Cloudflare :

```text
(http.host eq "ha.dinatih.org" and ip.geoip.country ne "FR" and not (ip.src.asnum eq 15169 and http.request.method eq "POST" and http.request.uri.path in {"/auth/token" "/api/google_assistant"}))
```

Cette modification remplace uniquement l’expression précédente :

```text
(http.host eq "ha.dinatih.org" and ip.geoip.country ne "FR")
```

| Origine / requête | Effet attendu de cette règle |
| --- | --- |
| France | Pas de blocage géographique |
| Hors France, AS15169, POST `/auth/token` | Exception géographique |
| Hors France, AS15169, POST `/api/google_assistant` | Exception géographique |
| Hors France, autre ASN, mêmes chemins | Blocage conservé |
| Hors France, AS15169, GET sur ces chemins | Blocage conservé |
| Hors France, AS15169, autre chemin HA | Blocage conservé |
| Autre nom d’hôte | Non concerné par cette règle |

L’ASN désigne un réseau, pas une identité Google authentifiée. L’exception ne
remplace pas l’authentification OAuth de HA. Aucune MFA, validation de jeton,
protection globale Cloudflare ou restriction sur les autres chemins n’a été désactivée.
Ne pas élargir automatiquement l’exception à une adresse ou à un ASN découvert
ultérieurement : vérifier le nouvel événement Cloudflare avant toute modification.

## Vérification

La première tentative de modification par remplissage du champ n’a pas persisté.
Une saisie clavier puis un nouvel enregistrement ont corrigé cela ; la règle a
ensuite été rouverte et son expression exacte relue. Ne pas se fier au seul résumé
visuel Cloudflare, qui ne représente pas clairement les parenthèses et `not`.

Le nouvel essai d’association sur le téléphone reste à confirmer. En cas d’erreur,
consulter Google Cloud Logging, puis rechercher le Ray ID correspondant dans les
événements de sécurité Cloudflare. Ne pas copier les codes OAuth ou jetons des logs.

Références : [Ray IDs Cloudflare](https://developers.cloudflare.com/fundamentals/reference/cloudflare-ray-id/),
[champ ASN](https://developers.cloudflare.com/ruleset-engine/rules-language/fields/reference/ip.src.asnum/),
[RIPE Network Info](https://stat.ripe.net/data/network-info/data.json?resource=108.177.64.129).
