import { spawn } from "child_process";
import open from "open";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectDir = __dirname;
const defaultFuncDir = path.resolve(__dirname, "..", "QuickPubMed-AzureFunctions", "qpm_api");
const funcDir = process.env.QPM_FUNC_DIR || defaultFuncDir;
const appUrl = process.env.QPM_APP_URL || "http://localhost:5173/";
const openDelayMs = Number(process.env.QPM_OPEN_DELAY_MS || 5000);

function runCommand(command, args, cwd) {
  const process = spawn(command, args, { cwd, shell: true, detached: true, stdio: "ignore" });
  process.unref(); // Keep process running in the background
}

// Start `npm run dev` in the background
runCommand("npm", ["run", "dev"], projectDir);

// Start `func start` in the background
runCommand("func", ["start"], funcDir);

// Wait briefly and open the app URL
setTimeout(() => {
  open(appUrl);
}, Number.isFinite(openDelayMs) ? openDelayMs : 5000); // Adjust delay as needed
