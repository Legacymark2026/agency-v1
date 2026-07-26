"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROTO_PATHS = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
__exportStar(require("./circuit-breaker"), exports);
__exportStar(require("./grpc-client"), exports);
__exportStar(require("./grpc-server"), exports);
const getProtoPath = (filename) => {
    const distPath = path.join(__dirname, "proto", filename);
    if (fs.existsSync(distPath))
        return distPath;
    const srcPath = path.join(__dirname, "..", "src", "proto", filename);
    if (fs.existsSync(srcPath))
        return srcPath;
    return distPath;
};
exports.PROTO_PATHS = {
    auth: getProtoPath("auth.proto"),
    crm: getProtoPath("crm.proto"),
    document: getProtoPath("document.proto"),
    project: getProtoPath("project.proto"),
    notification: getProtoPath("notification.proto"),
};
