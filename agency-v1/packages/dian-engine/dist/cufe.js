"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCUFE = generateCUFE;
exports.generateCUDE = generateCUDE;
const crypto_1 = __importDefault(require("crypto"));
function generateCUFE(numFac, fecFac, horaFac, valFac, codImp1, // 01 for IVA
valImp1, codImp2, // 04 for INC
valImp2, codImp3, // 03 for ICA
valImp3, valTot, nitOfe, numAdq, claveTecnica, ambiente // 1: Prod, 2: Test
) {
    // FORMATO CUFE: NumFac+FecFac+HoraFac+ValFac+CodImp1+ValImp1+CodImp2+ValImp2+CodImp3+ValImp3+ValTot+NitOfe+NumAdq+ClaveTec+Ambiente
    const dataString = `${numFac}${fecFac}${horaFac}${valFac.toFixed(2)}${codImp1}${valImp1.toFixed(2)}${codImp2}${valImp2.toFixed(2)}${codImp3}${valImp3.toFixed(2)}${valTot.toFixed(2)}${nitOfe}${numAdq}${claveTecnica}${ambiente}`;
    return crypto_1.default.createHash('sha384').update(dataString).digest('hex');
}
function generateCUDE(numNote, fecNote, horaNote, valNote, codImp1, valImp1, codImp2, valImp2, codImp3, valImp3, valTot, nitOfe, numAdq, pin, // PIN instead of Clave Tecnica for Notes
ambiente) {
    const dataString = `${numNote}${fecNote}${horaNote}${valNote.toFixed(2)}${codImp1}${valImp1.toFixed(2)}${codImp2}${valImp2.toFixed(2)}${codImp3}${valImp3.toFixed(2)}${valTot.toFixed(2)}${nitOfe}${numAdq}${pin}${ambiente}`;
    return crypto_1.default.createHash('sha384').update(dataString).digest('hex');
}
