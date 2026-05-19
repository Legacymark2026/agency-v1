"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const app = (0, express_1.default)();
const port = process.env.PORT || 4011;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'document-service' });
});
app.use('/api/proposals', (req, res) => { res.status(200).json({ message: '/api/proposals handled by document-service' }); });
app.use('/api/propuesta', (req, res) => { res.status(200).json({ message: '/api/propuesta handled by document-service' }); });
app.use('/api/kb', (req, res) => { res.status(200).json({ message: '/api/kb handled by document-service' }); });
app.listen(port, () => {
    console.log(`Document Service listening at http://localhost:${port}`);
});
//# sourceMappingURL=index.js.map