import { describe, it, expect } from 'vitest';

// ─── CSV Parser Logic Verification ─────────────────────────────────────────────

interface Recipient {
  email: string;
  name?: string;
  [key: string]: string | undefined;
}

function parseCSV(text: string): { headers: string[]; rows: Recipient[]; skippedCount: number } {
  const clean = text.replace(/^[\uFEFF\uFFFE\uEFBB\uBF]+/, '').trim();
  const rawLines = clean.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (rawLines.length === 0) return { headers: [], rows: [], skippedCount: 0 };

  const firstLine = rawLines[0];
  const countSemi = (firstLine.match(/;/g) || []).length;
  const countComma = (firstLine.match(/,/g) || []).length;
  const countTab = (firstLine.match(/\t/g) || []).length;
  
  let sep = ',';
  if (countSemi > countComma && countSemi >= countTab) sep = ';';
  else if (countTab > countComma && countTab > countSemi) sep = '\t';
  else if (firstLine.includes('|')) sep = '|';

  const splitLine = (line: string) =>
    line.split(sep).map((c) => c.trim().replace(/^["']|["']$/g, '').trim());

  const headers = splitLine(firstLine);
  const rows: Recipient[] = [];
  const seenEmails = new Set<string>();
  let skippedCount = 0;

  const emailRegex = /[^\s@<>";,:]+@[^\s@<>";,:]+\.[^\s@<>";,:]+/i;

  const findCol = (cols: string[], possibleNames: string[]): string | undefined => {
    for (const p of possibleNames) {
      const idx = headers.findIndex(h => h.toLowerCase().trim() === p.toLowerCase());
      if (idx !== -1 && cols[idx]) return cols[idx].trim();
    }
    return undefined;
  };

  const startIdx = headers.some(h => h.includes('@')) ? 0 : 1;

  for (let i = startIdx; i < rawLines.length; i++) {
    const cols = splitLine(rawLines[i]);
    
    let emailVal = findCol(cols, ['email', 'correo', 'correo electronico', 'correo electrónico', 'mail', 'e-mail', 'contacto', 'para', 'destinatario', 'direccion']);
    
    if (!emailVal) {
      for (const col of cols) {
        if (col && col.includes('@')) {
          const match = col.match(emailRegex);
          emailVal = match ? match[0] : col;
          break;
        }
      }
    } else if (emailVal.includes('@')) {
      const match = emailVal.match(emailRegex);
      if (match) emailVal = match[0];
    }

    if (emailVal && emailVal.includes('@')) {
      const cleanEmail = emailVal.replace(/^<|>$/g, '').toLowerCase().trim();
      if (cleanEmail.length >= 5 && !seenEmails.has(cleanEmail)) {
        seenEmails.add(cleanEmail);
        const nameVal = findCol(cols, ['name', 'nombre', 'nombre completo', 'cliente', 'contacto', 'razon social', 'empresa']) || '';
        
        const row: Recipient = { email: cleanEmail, name: nameVal };
        headers.forEach((h, idx) => {
          row[h.toLowerCase().trim()] = cols[idx] ?? '';
        });
        row.email = cleanEmail;
        if (nameVal) row.name = nameVal;

        rows.push(row);
      }
    } else {
      skippedCount++;
    }
  }

  return { headers, rows, skippedCount };
}

// ─── Test Suite ────────────────────────────────────────────────────────────────

describe('Marketing Service & CSV Engine E2E Tests', () => {
  it('1. Parses Spanish Semicolon CSV with missing @ on row 2 correctly', () => {
    const spanishCsv = `email;name;ciudad;descuento
enriqueboh;Juan Garcia;Bogota;30%
goldneezcolombia@gmail.com;Heyber Bohorquez;Bucaramanga;20%
gerencia@legacymarksas.com;Nestor Elian;Bucaramanga;50%`;

    const result = parseCSV(spanishCsv);
    expect(result.rows.length).toBe(2);
    expect(result.skippedCount).toBe(1);
    expect(result.rows[0].email).toBe('goldneezcolombia@gmail.com');
    expect(result.rows[1].email).toBe('gerencia@legacymarksas.com');
  });

  it('2. Parses Comma-Separated Standard CSV without header', () => {
    const rawList = `contacto@legacymark.com
soporte@legacymark.com
ventas@legacymark.com`;

    const result = parseCSV(rawList);
    expect(result.rows.length).toBe(3);
    expect(result.rows[0].email).toBe('contacto@legacymark.com');
  });

  it('3. Cleans UTF-16 / BOM & carriage returns properly', () => {
    const bomCsv = `\uFEFFcorreo,nombre\r\nusuario1@empresa.com,Pedro\r\nusuario2@empresa.com,Ana`;

    const result = parseCSV(bomCsv);
    expect(result.rows.length).toBe(2);
    expect(result.rows[0].email).toBe('usuario1@empresa.com');
    expect(result.rows[0].name).toBe('Pedro');
  });

  it('4. Handles Excel Binary Text Extraction of Emails', () => {
    const binaryExcelText = `PK\x03\x04\x00\x00...random...<t>cliente1@legacymark.com</t>...<t>cliente2@legacymark.com</t>`;
    const emailRegex = /[^\s@<>";,:]+@[^\s@<>";,:]+\.[^\s@<>";,:]+/gi;
    const matches = binaryExcelText.match(emailRegex) || [];
    const uniqueEmails = Array.from(new Set(matches.map(m => m.toLowerCase().trim())));
    
    expect(uniqueEmails.length).toBe(2);
    expect(uniqueEmails).toContain('cliente1@legacymark.com');
    expect(uniqueEmails).toContain('cliente2@legacymark.com');
  });
});
