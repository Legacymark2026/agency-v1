const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

// Load User GSC Credentials
const credsPath = path.join(__dirname, 'gsc-credentials.json');
if (!fs.existsSync(credsPath)) {
  console.error(`Error: Credentials file not found at ${credsPath}. Please run "node gsc-authorize.js" first!`);
  process.exit(1);
}
const creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));





// Helper to perform HTTP POST/GET requests using native https module
function makeRequest(url, method, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: headers
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({
        status: res.statusCode,
        headers: res.headers,
        data: data
      }));
    });

    req.on('error', reject);
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

// Get Access Token using Refresh Token
async function getAccessToken() {
  const postBody = `client_id=${encodeURIComponent(creds.client_id)}&` +
    `client_secret=${encodeURIComponent(creds.client_secret)}&` +
    `refresh_token=${encodeURIComponent(creds.refresh_token)}&` +
    `grant_type=refresh_token`;

  const response = await makeRequest(
    'https://oauth2.googleapis.com/token',
    'POST',
    {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postBody)
    },
    postBody
  );

  if (response.status !== 200) {
    throw new Error(`Auth failed: Status ${response.status} | ${response.data}`);
  }

  return JSON.parse(response.data).access_token;
}

// Parse Sitemap and fetch all URLs
async function fetchSitemapUrls() {
  const sitemapUrl = 'https://legacymarksas.com/sitemap.xml';
  console.log(`Fetching sitemap from ${sitemapUrl}...`);
  const response = await makeRequest(sitemapUrl, 'GET');
  if (response.status !== 200) {
    throw new Error(`Failed to fetch sitemap: Status ${response.status}`);
  }

  const regex = /<loc>(.*?)<\/loc>/g;
  const urls = [];
  let match;
  while ((match = regex.exec(response.data)) !== null) {
    urls.push(match[1]);
  }
  return urls;
}

// Inspect a single URL using Search Console API
async function inspectUrl(accessToken, targetUrl) {
  const requestBody = JSON.stringify({
    inspectionUrl: targetUrl,
    siteUrl: 'sc-domain:legacymarksas.com',
    languageCode: 'es'
  });

  const response = await makeRequest(
    'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect',
    'POST',
    {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(requestBody)
    },
    requestBody
  );

  if (response.status !== 200) {
    console.error(`⚠️ Error inspecting ${targetUrl}: Status ${response.status}`);
    return {
      url: targetUrl,
      error: `API Error ${response.status}: ${response.data.substring(0, 100)}`
    };
  }

  const result = JSON.parse(response.data);
  const indexStatus = result.inspectionResult.indexStatusResult || {};

  return {
    url: targetUrl,
    verdict: indexStatus.verdict || 'UNKNOWN',
    coverageState: indexStatus.coverageState || 'No data',
    indexingState: indexStatus.indexingState || 'UNKNOWN',
    lastCrawlTime: indexStatus.lastCrawlTime || 'N/A',
    robotsTxtState: indexStatus.robotsTxtState || 'UNKNOWN',
    status: response.status
  };
}

(async () => {
  try {
    console.log('Authenticating with Google API...');
    const accessToken = await getAccessToken();
    console.log('Authentication successful.');

    const urls = await fetchSitemapUrls();
    console.log(`Found ${urls.length} URLs in the sitemap.`);

    // To prevent hitting rate limits or consuming too many quotas in testing,
    // we will inspect a subset of urls (e.g., the first 5, plus 5 blog posts).
    // In production, the BI agent would check all or recently modified ones.
    const blogUrls = urls.filter(u => u.includes('/blog/')).slice(0, 3);
    const mainUrls = urls.filter(u => !u.includes('/blog/')).slice(0, 3);
    const urlsToInspect = [...mainUrls, ...blogUrls];

    console.log(`Inspecting ${urlsToInspect.length} select URLs...`);
    const inspectionResults = [];

    for (const url of urlsToInspect) {
      console.log(`Inspecting ${url}...`);
      const result = await inspectUrl(accessToken, url);
      
      // Perform a real HTTP status check in parallel
      let httpStatus = 'ERROR';
      try {
        const httpRes = await makeRequest(url, 'GET');
        httpStatus = httpRes.status;
      } catch (err) {
        httpStatus = `ERROR: ${err.message}`;
      }
      result.httpStatus = httpStatus;

      inspectionResults.push(result);
      // Brief sleep between calls to respect rate limits
      await new Promise(r => setTimeout(r, 1000));
    }

    // Generate markdown report
    const now = new Date().toISOString().split('T')[0];
    const indexedCount = inspectionResults.filter(r => r.verdict === 'INDEXED').length;
    const errorsList = inspectionResults.filter(r => r.httpStatus !== 200 || r.error);

    let reportMarkdown = `# 📊 Reporte de Indexación GSC — LegacyMark\n`;
    reportMarkdown += `**Fecha del Reporte:** ${now}\n`;
    reportMarkdown += `**Agente Evaluador:** BI SEO Automation Agent\n\n`;

    reportMarkdown += `## 🚨 Alertas Críticas (Acción Inmediata)\n`;
    if (errorsList.length > 0) {
      errorsList.forEach(e => {
        reportMarkdown += `* **[ERROR]:** La URL \`${e.url}\` reportó Status HTTP: \`${e.httpStatus}\` o Error GSC: \`${e.error || 'Ninguno'}\`.\n`;
      });
    } else {
      reportMarkdown += `✅ Sin incidencias críticas ni caídas detectadas en la muestra de URLs.\n\n`;
    }

    reportMarkdown += `## 📈 Resumen General de Muestra\n`;
    reportMarkdown += `* **Total de URLs Auditadas:** ${urlsToInspect.length}\n`;
    reportMarkdown += `* **URLs Indexadas con Éxito:** ${indexedCount} de ${urlsToInspect.length} (${Math.round((indexedCount/urlsToInspect.length)*100)}%)\n`;
    reportMarkdown += `* **Total URLs Detectadas en Sitemap:** ${urls.length}\n\n`;

    reportMarkdown += `## 📑 Detalle de Indexación (Google Search Console)\n`;
    reportMarkdown += `| URL Auditada | Veredicto GSC | Cobertura / Estado | Último Rastreo | HTTP | Estado Robots.txt |\n`;
    reportMarkdown += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;

    inspectionResults.forEach(r => {
      const verdictEmoji = r.verdict === 'INDEXED' ? '✅' : '⚠️';
      const httpEmoji = r.httpStatus === 200 ? '🟢 200' : `🔴 ${r.httpStatus}`;
      
      reportMarkdown += `| \`${r.url}\` | ${verdictEmoji} ${r.verdict} | ${r.coverageState || r.error || 'N/A'} | ${r.lastCrawlTime} | ${httpEmoji} | ${r.robotsTxtState || 'N/A'} |\n`;
    });

    reportMarkdown += `\n## 🛠️ Acciones Recomendadas\n`;
    if (errorsList.length > 0) {
      reportMarkdown += `1. **Corregir Caídas de Ruta:** Investigar inmediatamente las URLs con código de estado HTTP no-200.\n`;
    }
    const unindexedList = inspectionResults.filter(r => r.verdict !== 'INDEXED' && !r.error);
    if (unindexedList.length > 0) {
      reportMarkdown += `2. **Solicitar Indexación:** Entrar a Google Search Console y solicitar indexación manual para las URLs que GSC reporta como no indexadas o pendientes de rastreo.\n`;
    }
    reportMarkdown += `3. **Monitoreo Continuo:** Ejecutar este reporte diariamente para detectar discrepancias SEO antes de que impacten el tráfico orgánico.\n`;

    // Save report to the artifacts directory so the user can easily view it
    const artifactsDir = 'C:\\Users\\hboho\\.gemini\\antigravity\\brain\\3c41967e-5ef6-4589-bb13-40265ababe40';
    const reportPath = path.join(artifactsDir, 'gsc_indexation_report.md');
    fs.writeFileSync(reportPath, reportMarkdown, 'utf8');

    console.log(`\n🎉 Report generated successfully! Saved to: ${reportPath}`);
    console.log('==================================================');
    console.log(reportMarkdown);

  } catch (error) {
    console.error('Fatal error during execution:', error);
  }
})();
