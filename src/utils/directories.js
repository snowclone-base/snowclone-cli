import path from "path";
import os from "os";
import { fileURLToPath } from 'url';

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);
export const homeDir = os.homedir();
export const appDir = path.join(homeDir, "snowclone");
export const terraformMainDir = path.join(__dirname, "../terraform/instance");
export const terraformAdminDir = path.join(__dirname, "../terraform/admin");
export const sqlDir = path.join(__dirname, "../sql")