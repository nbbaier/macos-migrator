import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Execute a shell command and return stdout
 */
export async function executeCommand(command: string, timeout: number = 30000): Promise<string> {
  try {
    const { stdout } = await execAsync(command, { timeout });
    return stdout.trim();
  } catch (error) {
    throw new Error(`Command failed: ${command}\n${(error as Error).message}`);
  }
}

/**
 * Execute a command and return success status without throwing
 */
export async function tryExecuteCommand(command: string, timeout: number = 30000): Promise<{ success: boolean; output: string; error?: string }> {
  try {
    const output = await executeCommand(command, timeout);
    return { success: true, output };
  } catch (error) {
    return { success: false, output: "", error: (error as Error).message };
  }
}

/**
 * Check if a command exists in PATH
 */
export async function commandExists(command: string): Promise<boolean> {
  const result = await tryExecuteCommand(`which ${command}`);
  return result.success;
}

/**
 * Read a macOS defaults value
 */
export async function readDefault(domain: string, key: string): Promise<string | null> {
  const result = await tryExecuteCommand(`defaults read ${domain} ${key}`);
  return result.success ? result.output : null;
}

/**
 * Read all defaults for a domain as JSON
 */
export async function readDomainDefaults(domain: string): Promise<Record<string, unknown> | null> {
  const result = await tryExecuteCommand(`defaults export ${domain} - | plutil -convert json -o - -`);
  if (!result.success) {
    return null;
  }

  try {
    return JSON.parse(result.output);
  } catch {
    return null;
  }
}

/**
 * Write a macOS defaults value
 */
export async function writeDefault(domain: string, key: string, value: string | number | boolean): Promise<boolean> {
  let type = "string";
  let formattedValue = String(value);

  if (typeof value === "boolean") {
    type = "bool";
    formattedValue = value ? "true" : "false";
  } else if (typeof value === "number") {
    type = Number.isInteger(value) ? "int" : "float";
    formattedValue = String(value);
  }

  const result = await tryExecuteCommand(`defaults write ${domain} ${key} -${type} ${formattedValue}`);
  return result.success;
}

/**
 * Delete a macOS defaults key
 */
export async function deleteDefault(domain: string, key: string): Promise<boolean> {
  const result = await tryExecuteCommand(`defaults delete ${domain} ${key}`);
  return result.success;
}

/**
 * Get the current hostname
 */
export async function getHostname(): Promise<string> {
  const result = await executeCommand("hostname");
  return result;
}

/**
 * Get the macOS version
 */
export async function getOSVersion(): Promise<string> {
  const result = await executeCommand("sw_vers -productVersion");
  return result;
}

/**
 * Kill a process by name (to restart apps after applying settings)
 */
export async function killProcess(processName: string): Promise<boolean> {
  const result = await tryExecuteCommand(`killall "${processName}"`);
  return result.success;
}
