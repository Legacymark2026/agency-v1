# DNS Configuration Guide for legacymarksas.com

## 🌐 Configuración de DNS en tu Proveedor de Dominio

Una vez tengas la **IP de tu VPS**, configura estos registros DNS:

### Registros A (IPv4)

| Tipo | Host | Valor | TTL |
|------|------|-------|-----|
| A | @ | `TU_IP_VPS` | 3600 |
| A | www | `TU_IP_VPS` | 3600 |

### Ejemplo Visual

```
Tipo: A
Nombre/Host: @
Apunta a: 123.456.789.123  ← Tu IP del VPS
TTL: 1 hora (3600)

Tipo: A
Nombre/Host: www
Apunta a: 123.456.789.123  ← Tu IP del VPS
TTL: 1 hora (3600)
```

---

## 📋 Paso a Paso en Hostinger DNS

1. **Accede a hPanel** → Dominios → legacymarksas.com
2. **DNS / Zonas DNS**
3. **Agregar Registro**

### Registro 1: Dominio principal
```
Tipo: A
Nombre: @
Apunta a: [IP de tu VPS KVM 4]
TTL: 3600
```

### Registro 2: Subdominio www
```
Tipo: A
Nombre: www
Apunta a: [IP de tu VPS KVM 4]
TTL: 3600
```

---

## ✅ Verificar Configuración DNS

Después de configurar, espera **5-30 minutos** y verifica:

```bash
# Verificar DNS del dominio principal
nslookup legacymarksas.com

# Verificar DNS del subdominio www
nslookup www.legacymarksas.com

# O usando dig
dig legacymarksas.com +short
dig www.legacymarksas.com +short
```

**Debe retornar tu IP del VPS** ✅

---

## 🔒 Configurar SSL/HTTPS (Después del DNS)

Una vez el DNS esté propagado:

```bash
# Conectar al VPS
ssh root@TU_IP_VPS

# Obtener certificado SSL gratis
sudo certbot --nginx -d legacymarksas.com -d www.legacymarksas.com

# Seguir las instrucciones:
# 1. Email: tu@email.com
# 2. Aceptar términos: Y
# 3. Redirect HTTP a HTTPS: 2 (Yes)
```

---

## 📧 Configuración Adicional (Opcional)

### Registro MX (Para emails)

Si vas a usar emails `@legacymarksas.com`:

```
Tipo: MX
Nombre: @
Prioridad: 10
Apunta a: mx.tuproveedor.com
```

### Registro TXT (SPF para emails)

```
Tipo: TXT
Nombre: @
Valor: v=spf1 include:_spf.google.com ~all
```

---

## 🚨 Troubleshooting

### "DNS no resuelve"
- ✅ Espera 30 min - 2 horas para propagación
- ✅ Verifica que la IP del VPS sea correcta
- ✅ Limpia cache DNS: `ipconfig /flushdns` (Windows)

### "Certbot falla"
- ✅ Verifica que DNS esté resuelto primero
- ✅ Verifica que Nginx esté corriendo: `systemctl status nginx`
- ✅ Verifica puerto 80 abierto: `ufw status`

---

## ✅ Checklist Final

- [ ] Registros DNS A configurados (@ y www)
- [ ] DNS propagado (nslookup funciona)
- [ ] Nginx configurado en VPS
- [ ] SSL/HTTPS activo con Certbot
- [ ] Sitio accesible en https://legacymarksas.com
- [ ] Redirect www → sin www funciona

---

**Tu dominio:** `legacymarksas.com`  
**Configuración:** Lista para producción 🎯
