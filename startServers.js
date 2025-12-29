import { spawn } from "child_process";
import open from "open";

function runCommand(command, args, cwd) {
  const process = spawn(command, args, { cwd, shell: true, detached: true, stdio: "ignore" });
  process.unref(); // Sikrer, at processen kører i baggrunden
}

// Start `npm run dev` i baggrunden
runCommand("npm", ["run", "dev"], "C:\\Users\\onoe0001\\OneDrive - Region Hovedstaden\\Documents\\GitHub\\QuickPubMed");

// Start `func start` i baggrunden
runCommand("func", ["start"], "C:\\Users\\onoe0001\\OneDrive - Region Hovedstaden\\Documents\\GitHub\\QuickPubMed-AzureFunctions\\qpm_api");

// Vent lidt og åbn URL'en
setTimeout(() => {
  open("http://localhost:5173/");
}, 5000); // Juster ventetiden efter behov
