import * as path from "path";

export * from "./circuit-breaker";
export * from "./grpc-client";
export * from "./grpc-server";

export const PROTO_PATHS = {
  auth: path.join(__dirname, "proto", "auth.proto"),
  crm: path.join(__dirname, "proto", "crm.proto"),
};
