"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const otel_1 = require("./otel");
const logger_1 = require("./logger");
const serviceName = process.env.OTEL_SERVICE_NAME || process.env.SERVICE_NAME || "unknown-service";
(0, otel_1.initTelemetry)(serviceName);
if (process.env.NODE_ENV === "production" || process.env.OVERRIDE_CONSOLE === "true") {
    console.log = (...args) => {
        const message = args.map(arg => typeof arg === "object" ? JSON.stringify(arg) : String(arg)).join(" ");
        logger_1.logger.info(message);
    };
    console.warn = (...args) => {
        const message = args.map(arg => typeof arg === "object" ? JSON.stringify(arg) : String(arg)).join(" ");
        logger_1.logger.warn(message);
    };
    console.error = (...args) => {
        const message = args.map(arg => typeof arg === "object" ? JSON.stringify(arg) : String(arg)).join(" ");
        logger_1.logger.error(message);
    };
    console.info = console.log;
    console.debug = (...args) => {
        const message = args.map(arg => typeof arg === "object" ? JSON.stringify(arg) : String(arg)).join(" ");
        logger_1.logger.debug(message);
    };
}
//# sourceMappingURL=register.js.map