"""Vérifier SMTP, HTTPS, CORS et la validation sans envoyer de message."""
import json
from urllib.error import HTTPError
from urllib.request import Request, urlopen

with urlopen("http://localhost:5000/api/health", timeout=20) as response:
    health = json.load(response)
assert health == {"status": "ok", "checks": {"smtp": "ok"}}, health
print("Authentification Gmail : OK")

endpoint = "https://contact.dinatih.org/api/mail"
for origin in ("https://dinatih.org", "http://localhost:5173"):
    request = Request(endpoint, method="OPTIONS", headers={
        "User-Agent": "room-3d-contact-check/1.0",
        "Origin": origin,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
    })
    with urlopen(request, timeout=20) as response:
        assert response.headers["Access-Control-Allow-Origin"] == origin
        print(f"HTTPS et CORS {origin} : OK")

request = Request(endpoint, data=b"{}", headers={
    "User-Agent": "room-3d-contact-check/1.0",
    "Origin": "https://dinatih.org", "Content-Type": "application/json",
})
try:
    urlopen(request, timeout=20)
except HTTPError as error:
    assert error.code == 422, error.code
    assert error.headers["Access-Control-Allow-Origin"] == "https://dinatih.org"
    print("Données incomplètes rejetées : OK (HTTP 422), aucun message envoyé")
else:
    raise AssertionError("Le backend a accepté des données incomplètes")
