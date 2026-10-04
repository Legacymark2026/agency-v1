# Mejora Ultraprofesional del Sistema de Facturación DIAN y RADIAN

El objetivo es ampliar el formulario de facturación para abarcar todas las exigencias técnicas y comerciales (Aceptaciones Tácitas, Acuse de Recibo, Retenciones, Notas Crédito) manteniendo un diseño limpio y verdaderamente *Enterprise*.

## Proposed Changes

### Componente Visual y Funcional de la Factura

#### [MODIFY] `apps/web/app/(dashboard)/dashboard/(sales-and-finance)/invoicing/new/invoice-form.tsx`
- **Diseño por Bloques / Tabs**: Reorganizar el diseño en 3 grandes áreas para no abrumar al usuario:
  1. *Datos del Documento y Cliente* (Tipo de comprobante, Moneda, Régimen, NIT).
  2. *Líneas y Retenciones* (Impuestos, ReteICA, ReteFuente, ReteIVA).
  3. *Condiciones Comerciales y RADIAN* (Plazo de pago, Método, Cuotas).
- **Campos Faltantes a Implementar**:
  - Inputs reales para `reteFuente`, `reteICA`, `reteIVA` (actualmente en el estado pero invisibles en la UI).
  - Condición de pago: **Contado** vs **Crédito**.
  - Naturaleza del Documento: *Factura de Venta*, *Nota Crédito*, *Nota Débito*.
  - Moneda: Selector COP / USD con Tasa de Cambio (TRM).
- **Mejora UI/UX**: Uso de tarjetas separadas, iconos de Lucide actualizados, barras de progreso de cálculo y tipografía JetBrains para los montos numéricos que le den el toque técnico.

#### [MODIFY] `apps/web/app/(dashboard)/dashboard/(sales-and-finance)/invoicing/dian-client.tsx`
- **Acciones RADIAN (Eventos de Título Valor)**:
  - Añadir botones específicos para el Cliente/Emisor para registrar eventos oficiales:
    - *030: Acuse de Recibo*.
    - *032: Recibo de Bienes o Servicios*.
    - *033: Aceptación Expresa*.
  - Añadir botón de automatización para registrar *034: Aceptación Tácita* si pasaron 72 horas desde el evento 032.

### Integración en el Motor Criptográfico (dian-engine)

#### [MODIFY] `packages/dian-engine/src/ubl.ts`
- Implementar la serialización de Notas Crédito (`CreditNote` UBL 2.1) con la invocación de la firma en el root diferente al de la factura.
- Implementar la serialización UBL 2.1 de los eventos `ApplicationResponse` del RADIAN (Eventos 030, 032, 033, 034) vinculando el CUFE de la factura original y calculando el nuevo CUDE del evento.

## Verification Plan

### Manual Verification
- Renderizar la nueva interfaz gráfica para asegurar que los campos de Retenciones sean intuitivos.
- Comprobar que al enviar la factura, los valores de ReteFuente/ReteICA se calculen y deduzcan correctamente del *Total a Procesar*.
- Desplegar en la nube (Hostinger) y comprobar que la carga visual de `InvoiceForm` sea fluida y profesional.
