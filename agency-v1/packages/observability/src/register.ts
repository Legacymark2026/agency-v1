import { initTelemetry } from "./otel";
import { logger } from "./logger";

const serviceName = process.env.OTEL_SERVICE_NAME || process.env.SERVICE_NAME || "unknown-service";
initTelemetry(serviceName);

if (process.env.NODE_ENV === "production" || process.env.OVERRIDE_CONSOLE === "true") {
  console.log = (...args: any[]) => {
    const message = args.map(arg => typeof arg === "object" ? JSON.stringify(arg) : String(arg)).join(" ");
    logger.info(message);
  };
  console.warn = (...args: any[]) => {
    const message = args.map(arg => typeof arg === "object" ? JSON.stringify(arg) : String(arg)).join(" ");
    logger.warn(message);
  };
  console.error = (...args: any[]) => {
    const message = args.map(arg => typeof arg === "object" ? JSON.stringify(arg) : String(arg)).join(" ");
    logger.error(message);
  };
  console.info = console.log;
  console.debug = (...args: any[]) => {
    const message = args.map(arg => typeof arg === "object" ? JSON.stringify(arg) : String(arg)).join(" ");
    logger.debug(message);
  };
}
