#!/bin/bash

DOMAIN="legacymarksas.com"

echo "=========================================================="
echo "   DIAGNÓSTICO SPAM/DNS PARA $DOMAIN (CLOUDFLARE)"
echo "=========================================================="
echo ""

# 1. Verificar registros NS (para confirmar que Cloudflare es el que manda)
echo "[1/4] Verificando Servidores de Nombre (Nameservers)..."
dig +short NS $DOMAIN
echo ""

# 2. Verificar SPF (Debe incluir Hostinger y Resend)
echo "[2/4] Verificando registro SPF (TXT)..."
SPF=$(dig +short TXT $DOMAIN | grep "v=spf1")
if [ -z "$SPF" ]; then
    echo "❌ NO se encontró registro SPF."
else
    echo "✅ SPF encontrado: $SPF"
    if [[ "$SPF" == *"_spf.resend.com"* ]]; then
        echo "   ✅ Resend está incluido correctamente."
    else
        echo "   ❌ FATAL: Resend NO está incluido en el SPF."
        echo "      Añade 'include:_spf.resend.com' en tus DNS de Cloudflare."
    fi
    
    if [[ "$SPF" == *"hostinger"* ]]; then
        echo "   ✅ Hostinger está incluido correctamente."
    else
        echo "   ⚠️ Hostinger no está en el SPF (puedes fallar al enviar desde webmail)."
    fi
fi
echo ""

# 3. Verificar DKIM (Resend usa 3 registros cname o txt)
echo "[3/4] Verificando registro DKIM de Resend..."
DKIM=$(dig +short TXT resend._domainkey.$DOMAIN)
if [ -z "$DKIM" ]; then
    echo "❌ Registro DKIM (resend._domainkey) no encontrado."
    echo "   Revisa la pestaña 'Domains' en Resend y copia los registros a Cloudflare."
else
    echo "✅ DKIM (resend._domainkey) encontrado."
fi
echo ""

# 4. Verificar DMARC
echo "[4/4] Verificando registro DMARC (_dmarc)..."
DMARC=$(dig +short TXT _dmarc.$DOMAIN)
if [ -z "$DMARC" ]; then
    echo "⚠️ Registro DMARC no encontrado. Es muy recomendable para evitar SPAM."
    echo "   Sugerencia: v=DMARC1; p=none; rua=mailto:admin@$DOMAIN"
else
    echo "✅ DMARC encontrado: $DMARC"
fi

echo ""
echo "=========================================================="
echo "   RECUERDA: Al usar Cloudflare, debes editar los DNS"
echo "   en dash.cloudflare.com, NO en Hostinger."
echo "=========================================================="
