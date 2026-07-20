import * as path from "path";
import * as fs from "fs";

export * from "./circuit-breaker";
export * from "./grpc-client";
export * from "./grpc-server";

const getProtoPath = (filename: string) => {
  const distPath = path.join(__dirname, "proto", filename);
  if (fs.existsSync(distPath)) return distPath;
  const srcPath = path.join(__dirname, "..", "src", "proto", filename);
  if (fs.existsSync(srcPath)) return srcPath;
  return distPath;
};

export const PROTO_PATHS = {
  auth: getProtoPath("auth.proto"),
  crm: getProtoPath("crm.proto"),
};
