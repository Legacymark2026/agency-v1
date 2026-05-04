import { rateLimit } from '../lib/rate-limit';

async function runValidation() {
    console.log("=== Validando Fase 4: Anti-spam y Rate Limiting ===");
    const testIP = "192.168.1.100";
    const limit = 100;
    const windowMs = 60000;
    
    let passed = 0;
    let blocked = 0;
    
    console.log(`\nSimulando ráfaga de 120 peticiones para IP: ${testIP}...`);
    
    for (let i = 1; i <= 120; i++) {
        const allowed = await rateLimit(`test_webhook:${testIP}`, limit, windowMs);
        if (allowed) {
            passed++;
        } else {
            blocked++;
            if (blocked === 1) {
                console.log(`[!] Límite excedido en la petición #${i}`);
            }
        }
    }
    
    console.log(`\nResultados:`);
    console.log(`- Peticiones permitidas: ${passed} (Esperado: ${limit})`);
    console.log(`- Peticiones bloqueadas: ${blocked} (Esperado: 20)`);
    
    if (passed === limit && blocked === 20) {
        console.log("\n✅ VALIDACIÓN EXITOSA: El Anti-Spam (Rate Limit) funciona perfectamente.");
    } else {
        console.log("\n❌ ERROR: Los resultados no coinciden con lo esperado.");
    }
}

runValidation();
