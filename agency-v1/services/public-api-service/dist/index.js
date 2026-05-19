"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const app = (0, express_1.default)();
const port = process.env.PORT || 4015;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'public-api-service' });
});
app.use('/api/v1', (req, res) => { res.status(200).json({ message: '/api/v1 handled by public-api-service' }); });
app.use('/api/public', (req, res) => { res.status(200).json({ message: '/api/public handled by public-api-service' }); });
app.use('/api/serve', (req, res) => { res.status(200).json({ message: '/api/serve handled by public-api-service' }); });
app.listen(port, () => {
    console.log(`Public API Service listening at http://localhost:${port}`);
});
//# sourceMappingURL=index.js.map