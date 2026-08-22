/**
 * apps/web/lib/version.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized Platform Versioning Configuration
 * Updated automatically during build/release pipeline.
 */

export interface SystemVersion {
  version: string;
  buildNumber: string;
  buildDate: string;
  releaseName: string;
  environment: string;
  isoCertifications: string[];
  gitCommit?: string;
}

export const PLATFORM_VERSION: SystemVersion = {
  version: "v3.8.5",
  buildNumber: "2026.08.21-2014-b9889b37",
  buildDate: "2026-08-22 20:14 COT",
  releaseName: "Enterprise Auth & ISO 27001 Security Hardening",
  environment: process.env.NODE_ENV || "production",
  isoCertifications: [
    "ISO/IEC 27001:2022 (SGSI)",
    "ISO/IEC 27701:2019 (PIMS)",
    "ISO 9001:2015 (SGC)",
    "ISO 22301:2019 (SGCN)",
  ],
};
