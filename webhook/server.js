const express = require('express');
const crypto = require('crypto');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

const app = express();
const PORT = 9000;

// Configuration depuis les variables d'environnement
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

if (!WEBHOOK_SECRET) {
    console.error('ERREUR: WEBHOOK_SECRET non défini dans les variables d\'environnement');
    process.exit(1);
}

// Middleware pour parser le body en raw
app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf.toString();
    }
}));

// Fonction pour vérifier la signature GitHub
function verifyGitHubSignature(req) {
    const signature = req.headers['x-hub-signature-256'];
    if (!signature) {
        return false;
    }

    const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
    const digest = 'sha256=' + hmac.update(req.rawBody).digest('hex');

    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(digest)
    );
}

// Fonction pour exécuter le redéploiement
async function redeploy() {
    console.log('🚀 Début du redéploiement...');

    try {
        // 1. Pull les dernières modifications
        console.log('📥 Git pull...');
        await execAsync('cd /app/repo && git pull origin ' + GITHUB_BRANCH);

        // 2. Rebuild et redémarrer les containers
        console.log('🔨 Rebuild des images Docker...');
        await execAsync('cd /app/repo && docker-compose build --no-cache');

        console.log('🔄 Redémarrage des services...');
        await execAsync('cd /app/repo && docker-compose up -d --force-recreate');

        console.log('✅ Redéploiement terminé avec succès !');
        return { success: true, message: 'Déploiement réussi' };
    } catch (error) {
        console.error('❌ Erreur lors du redéploiement:', error);
        return { success: false, message: error.message };
    }
}

// Endpoint webhook
app.post('/webhook', async (req, res) => {
    console.log('\n📨 Webhook reçu de GitHub');

    // Vérifier la signature
    if (!verifyGitHubSignature(req)) {
        console.log('⚠️  Signature invalide - webhook rejeté');
        return res.status(401).json({ error: 'Signature invalide' });
    }

    // Récupérer les informations du push
    const event = req.headers['x-github-event'];
    const payload = req.body;

    console.log(`📋 Event: ${event}`);

    // On ne traite que les événements push
    if (event !== 'push') {
        console.log(`ℹ️  Event ${event} ignoré (seuls les push sont traités)`);
        return res.json({ message: 'Event ignoré' });
    }

    // Vérifier que c'est bien la bonne branche
    const branch = payload.ref.replace('refs/heads/', '');
    console.log(`🌿 Branche: ${branch}`);

    if (branch !== GITHUB_BRANCH) {
        console.log(`ℹ️  Branche ${branch} ignorée (on surveille ${GITHUB_BRANCH})`);
        return res.json({ message: 'Branche ignorée' });
    }

    console.log(`✓ Push sur ${GITHUB_BRANCH} détecté - déclenchement du redéploiement`);

    // Répondre immédiatement à GitHub
    res.json({ message: 'Redéploiement en cours' });

    // Lancer le redéploiement en arrière-plan
    redeploy();
});

// Endpoint de santé
app.get('/health', (req, res) => {
    res.json({ status: 'ok', watching: GITHUB_BRANCH });
});

app.listen(PORT, () => {
    console.log(`🎣 Webhook service démarré sur le port ${PORT}`);
    console.log(`👀 Surveillance de la branche: ${GITHUB_BRANCH}`);
});
