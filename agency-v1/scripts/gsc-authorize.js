const fs = require('fs');
const path = require('path');
const https = require('https');

const redirectUri = 'http://localhost';
const scope = 'https://www.googleapis.com/auth/webmasters.readonly';

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

function askQuestion(rl, questionText) {
  return new Promise((resolve) => {
    rl.question(questionText, (answer) => {
      resolve(answer.trim());
    });
  });
}

(async () => {
  console.log('==================================================');
  console.log('    GOOGLE SEARCH CONSOLE OAUTH AUTORIZACIÓN      ');
  console.log('==================================================\n');

  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const clientId = await askQuestion(readline, 'Introduce tu ID de cliente de OAuth: ');
  if (!clientId) {
    console.error('❌ El ID de cliente es obligatorio.');
    readline.close();
    return;
  }

  const clientSecret = await askQuestion(readline, 'Introduce tu Secreto de cliente de OAuth: ');
  if (!clientSecret) {
    console.error('❌ El Secreto de cliente es obligatorio.');
    readline.close();
    return;
  }

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(clientId)}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scope)}&` +
    `access_type=offline&` +
    `prompt=consent`;

  console.log('\n--------------------------------------------------');
  console.log('1. Copia y abre este enlace en tu navegador:');
  console.log('\x1b[36m%s\x1b[0m', authUrl);
  console.log('--------------------------------------------------');
  console.log('\n2. Inicia sesión con tu cuenta propietaria de Search Console.');
  console.log('3. Haz clic en "Continuar" para otorgar los permisos.');
  console.log('4. Al finalizar, la página redireccionará a http://localhost/?code=XXX...');
  console.log('5. Copia el código que aparece en la barra de direcciones después de "?code="');
  console.log('   y pégalo a continuación:\n');

  let code = await askQuestion(readline, 'Introduce el código de autorización (o pega la URL completa redireccionada): ');
  readline.close();

  if (!code) {
    console.error('❌ El código de autorización es obligatorio.');
    return;
  }

  // Automatically extract code from URL if the user pasted the full URL
  if (code.includes('code=')) {
    try {
      if (!code.startsWith('http')) {
        code = 'http://' + code; // Ensure it's a valid URL for the parser
      }
      const urlObj = new URL(code);
      const urlCode = urlObj.searchParams.get('code');
      if (urlCode) {
        code = urlCode;
        console.log(`\n👉 Código extraído automáticamente de la URL: ${code}`);
      }
    } catch (e) {
      const match = code.match(/[?&]code=([^&]+)/);
      if (match) {
        code = match[1];
        console.log(`\n👉 Código extraído automáticamente de la URL (fallback): ${code}`);
      }
    }
  }

  console.log('\nIntercambiando código de autorización por tokens...');
  
  const postBody = `code=${encodeURIComponent(code)}&` +
    `client_id=${encodeURIComponent(clientId)}&` +
    `client_secret=${encodeURIComponent(clientSecret)}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `grant_type=authorization_code`;

  try {
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
      console.error(`\n❌ Error en el intercambio (HTTP ${response.status}):`, response.data);
      return;
    }

    const tokens = JSON.parse(response.data);
    
    // Save to gsc-credentials.json
    const credentials = {
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: tokens.refresh_token,
      redirect_uri: redirectUri
    };

    const outputPath = path.join(__dirname, 'gsc-credentials.json');
    fs.writeFileSync(outputPath, JSON.stringify(credentials, null, 2), 'utf8');

    console.log('\n✅ ¡Vinculación completada con éxito!');
    console.log(`Las credenciales con el Refresh Token se han guardado en: ${outputPath}`);
    console.log('\nAhora puedes ejecutar "node scripts/gsc-monitor.js" para generar tu reporte diario de indexación.');

  } catch (err) {
    console.error('\n❌ Ocurrió un error inesperado durante la vinculación:', err.message);
  }
})();
