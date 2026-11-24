/**
 * Terrain EINS – lecture des affaires « Gagné » du CRM Notion (Etudes / CRM / Affaires).
 * À ajouter comme NOUVEAU fichier dans le projet Apps Script « Photo EINS » (à côté de Code.gs).
 *
 * Prérequis (une seule fois) :
 *  1. Clé d'intégration Notion (notion.so/profile/integrations → Nouvelle intégration interne, droits « Lire le contenu »).
 *  2. Dans Notion, base « Affaires » → ⋯ → Connexions → ajouter cette intégration.
 *  3. Apps Script → ⚙ Paramètres du projet → Propriétés du script → ajouter NOTION_TOKEN = la clé.
 *     (La clé n'est jamais écrite dans le code.)
 *  4. Dans Code.gs, dans doGet, juste APRÈS la vérification de la clé « k », ajouter la ligne :
 *       if (e.parameter.action === 'affaires') return actionAffaires_();
 *  5. Déployer → Gérer les déploiements → crayon → Nouvelle version → Déployer (même URL).
 *
 * Lecture seule : ce script ne modifie rien dans Notion.
 */

const NOTION_BASE_AFFAIRES = '6d0df196eda6441697e9c0b86bf2afdb';   // Etudes / CRM / Affaires
const NOTION_JOURS_PASSES = 45;   // affaires dont l'intervention date de moins de 45 jours, ou sans date

function actionAffaires_() {
  let resultat;
  try {
    resultat = affairesGagnees_();
  } catch (err) {
    resultat = { erreur: String(err && err.message || err).slice(0, 200) };
  }
  return ContentService.createTextOutput(JSON.stringify(resultat)).setMimeType(ContentService.MimeType.JSON);
}

function affairesGagnees_() {
  const jeton = PropertiesService.getScriptProperties().getProperty('NOTION_TOKEN');
  if (!jeton) throw new Error('NOTION_TOKEN absent des propriétés du script');

  const depuis = new Date(Date.now() - NOTION_JOURS_PASSES * 24 * 3600 * 1000);
  const corps = {
    page_size: 50,
    filter: { and: [
      { property: 'Statut', status: { equals: 'Gagné' } },
      { or: [
        { property: "Date d'intervention", date: { on_or_after: Utilities.formatDate(depuis, 'Europe/Paris', 'yyyy-MM-dd') } },
        { property: "Date d'intervention", date: { is_empty: true } }
      ] }
    ] },
    sorts: [{ property: "Date d'intervention", direction: 'descending' }]
  };

  const rep = UrlFetchApp.fetch('https://api.notion.com/v1/databases/' + NOTION_BASE_AFFAIRES + '/query', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + jeton, 'Notion-Version': '2022-06-28' },
    payload: JSON.stringify(corps),
    muteHttpExceptions: true
  });
  if (rep.getResponseCode() !== 200) {
    throw new Error('Notion ' + rep.getResponseCode() + ' : ' + rep.getContentText().slice(0, 150));
  }

  const texte = (prop) => (prop && (prop.title || prop.rich_text) || []).map((t) => t.plain_text).join('').trim();
  return JSON.parse(rep.getContentText()).results.map((page) => {
    const p = page.properties || {};
    const titre = Object.keys(p).find((k) => p[k].type === 'title');
    const lieu = Object.keys(p).find((k) => k.trim() === 'Lieu');
    const date = p["Date d'intervention"] && p["Date d'intervention"].date;
    return {
      nom: texte(p[titre]),
      date: date ? String(date.start).slice(0, 10) : '',
      lieu: lieu ? texte(p[lieu]) : '',
      url: page.url
    };
  }).filter((a) => a.nom);
}

/** Pour tester depuis l'éditeur : sélectionne testAffaires puis ▶ Exécuter, et regarde le journal. */
function testAffaires() {
  Logger.log(JSON.stringify(affairesGagnees_(), null, 2));
}
