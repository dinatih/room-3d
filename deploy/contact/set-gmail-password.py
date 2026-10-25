"""Renseigner le mot de passe d’application Gmail sans l’afficher."""
from getpass import getpass
from pathlib import Path

config = Path(__file__).with_name(".env")
lines = config.read_text().splitlines()
if sum(line.startswith("SMTP_PASSWORD=") for line in lines) != 1:
    raise SystemExit("Le fichier .env doit contenir exactement une clé SMTP_PASSWORD.")
password = getpass("Mot de passe d’application Gmail (saisie masquée) : ").replace(" ", "")
if len(password) != 16 or not password.isascii() or not password.isalnum():
    raise SystemExit("Le mot de passe d’application doit contenir 16 caractères alphanumériques.")
config.chmod(0o600)
config.write_text("\n".join(
    f"SMTP_PASSWORD={password}" if line.startswith("SMTP_PASSWORD=") else line
    for line in lines
) + "\n")
print("Mot de passe enregistré dans le fichier privé .env.")
