"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const app = (0, express_1.default)();
const port = process.env.PORT || 4013;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'analytics-service' });
});
app.use('/api/analytics', (req, res) => { res.status(200).json({ message: '/api/analytics handled by analytics-service' }); });
app.use('/api/track', (req, res) => { res.status(200).json({ message: '/api/track handled by analytics-service' }); });
app.listen(port, () => {
    console.log(`Analytics Service listening at http://localhost:${port}`);
});
//# sourceMappingURL=index.js.map