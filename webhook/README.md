# Webhook Service

Service minimal pour recevoir les webhooks GitHub et déclencher un redéploiement.

Emplacement du service:
- webhook/server.js

Description rapide:
- Écoute les événements GitHub sur POST /webhook
- Vérifie la signature HMAC SHA256 (header `x-hub-signature-256`) en utilisant la variable d'environnement `WEBHOOK_SECRET`
- Ne traite que les événements `push` et uniquement pour la branche définie dans `GITHUB_BRANCH` (par défaut `main`)
- Déclenche un script de redéploiement (git pull + docker-compose build/up)
- Endpoint de santé: GET /health

Variables d'environnement
- WEBHOOK_SECRET (obligatoire) : secret partagé pour vérifier la signature GitHub
- GITHUB_BRANCH (optionnel) : branche à surveiller (valeur par défaut: `main`)
- PORT (optionnel) : port d'écoute (valeur par défaut: `9000`)

Exécution locale (PowerShell)
```powershell
# depuis le dossier webhook
cd webhook
# installer les dépendances si nécessaire
npm install
# définir les variables d'environnement dans la session PowerShell
$env:WEBHOOK_SECRET = "votre_secret"
$env:GITHUB_BRANCH = "main"
# démarrer le service
node server.js
```

Test rapide d'un webhook (exemple)
1) Préparer un fichier payload.json contenant le JSON du push (ou utiliser un petit objet JSON pour tester).
2) Calculer la signature HMAC SHA256 et envoyer la requête (exemple avec openssl) :

```bash
WEBHOOK_SECRET="votre_secret"
PAYLOAD=$(cat payload.json)
SIG=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | sed 's/^.* //')
HEADER="sha256=$SIG"

curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: $HEADER" \
  --data-binary @payload.json \
  http://localhost:9000/webhook
```

(Remarque: sur PowerShell/Windows, adaptez la génération de la signature ou utilisez un petit script Node pour la signer.)

Endpoint de santé
- GET /health retourne { status: 'ok', watching: GITHUB_BRANCH }

Dépannage
- "Signature invalide" : vérifier que le body envoyé est exactement le même que celui utilisé pour calculer la signature (raw body). Le serveur utilise express.json avec un hook `verify` pour conserver le raw body.
- Vérifier que `WEBHOOK_SECRET` est défini avant de démarrer le service.
- Logs du service affichés sur la console contiennent des informations sur la branche et les erreurs lors du déploiement.

Sécurité & recommandations
- Ne publiez jamais `WEBHOOK_SECRET` en clair dans un dépôt public.
- Restreindre l'accès au port webhook (firewall) et limiter l'accès réseau si possible.

Licence
- Contenu fourni tel quel. Adaptez selon vos besoins.

