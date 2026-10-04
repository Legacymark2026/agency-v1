import crypto from 'crypto';

export function generateCUFE(
    numFac: string,
    fecFac: string,
    horaFac: string,
    valFac: number,
    codImp1: string, // 01 for IVA
    valImp1: number,
    codImp2: string, // 04 for INC
    valImp2: number,
    codImp3: string, // 03 for ICA
    valImp3: number,
    valTot: number,
    nitOfe: string,
    numAdq: string,
    claveTecnica: string,
    ambiente: "1" | "2" // 1: Prod, 2: Test
): string {
    // FORMATO CUFE: NumFac+FecFac+HoraFac+ValFac+CodImp1+ValImp1+CodImp2+ValImp2+CodImp3+ValImp3+ValTot+NitOfe+NumAdq+ClaveTec+Ambiente
    const dataString = `${numFac}${fecFac}${horaFac}${valFac.toFixed(2)}${codImp1}${valImp1.toFixed(2)}${codImp2}${valImp2.toFixed(2)}${codImp3}${valImp3.toFixed(2)}${valTot.toFixed(2)}${nitOfe}${numAdq}${claveTecnica}${ambiente}`;
    return crypto.createHash('sha384').update(dataString).digest('hex');
}

export function generateCUDE(
    numNote: string,
    fecNote: string,
    horaNote: string,
    valNote: number,
    codImp1: string,
    valImp1: number,
    codImp2: string,
    valImp2: number,
    codImp3: string,
    valImp3: number,
    valTot: number,
    nitOfe: string,
    numAdq: string,
    pin: string, // PIN instead of Clave Tecnica for Notes
    ambiente: "1" | "2"
): string {
    const dataString = `${numNote}${fecNote}${horaNote}${valNote.toFixed(2)}${codImp1}${valImp1.toFixed(2)}${codImp2}${valImp2.toFixed(2)}${codImp3}${valImp3.toFixed(2)}${valTot.toFixed(2)}${nitOfe}${numAdq}${pin}${ambiente}`;
    return crypto.createHash('sha384').update(dataString).digest('hex');
}
