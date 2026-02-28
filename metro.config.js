const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);
let resolved = withNativeWind(config, { input: "./global.css" });

// date-fns 3.x : le package.json pointe vers .mjs qui n'existent pas dans le tarball → résolution forcée vers .js
const defaultResolve = resolved.resolver.resolveRequest;
resolved.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "date-fns") {
    return { filePath: path.join(__dirname, "node_modules", "date-fns", "index.js"), type: "sourceFile" };
  }
  if (moduleName.startsWith("date-fns/")) {
    const sub = moduleName.slice("date-fns/".length);
    const candidate = path.join(__dirname, "node_modules", "date-fns", sub + ".js");
    return { filePath: candidate, type: "sourceFile" };
  }
  return defaultResolve(context, moduleName, platform);
};

module.exports = resolved;
