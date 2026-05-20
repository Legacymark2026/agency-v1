"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const app = (0, express_1.default)();
const port = process.env.PORT || 4008;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'calendar-service' });
});
app.use('/api/calendar', (req, res) => { res.status(200).json({ message: '/api/calendar handled by calendar-service' }); });
app.use('/api/scheduling', (req, res) => { res.status(200).json({ message: '/api/scheduling handled by calendar-service' }); });
app.listen(port, () => {
    console.log(`Calendar Service listening at http://localhost:${port}`);
});
//# sourceMappingURL=index.js.map