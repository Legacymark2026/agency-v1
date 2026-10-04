export declare function generateCUFE(numFac: string, fecFac: string, horaFac: string, valFac: number, codImp1: string, // 01 for IVA
valImp1: number, codImp2: string, // 04 for INC
valImp2: number, codImp3: string, // 03 for ICA
valImp3: number, valTot: number, nitOfe: string, numAdq: string, claveTecnica: string, ambiente: "1" | "2"): string;
export declare function generateCUDE(numNote: string, fecNote: string, horaNote: string, valNote: number, codImp1: string, valImp1: number, codImp2: string, valImp2: number, codImp3: string, valImp3: number, valTot: number, nitOfe: string, numAdq: string, pin: string, // PIN instead of Clave Tecnica for Notes
ambiente: "1" | "2"): string;
