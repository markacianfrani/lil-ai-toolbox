import { exec } from 'node:child_process'

// Basic parameters for our simplified shell tool
export interface RunShellCommandParams {
  command: string
  timeout?: number
}

// Minimal tool definition
export async function runShellCommand(
  params: RunShellCommandParams
): Promise<{ stdout: string; stderr: string }> {
  // Basic validation
  if (!params.command) {
    throw new Error('The "command" parameter is required.')
  }

  // Guardrail: reject dangerous commands
  const dangerousPatterns = [
    /\brm\s+-rf\b/,
    /\bsudo\b/,
    /\bchmod\s+777\b/,
    /\bchown\b/,
    /\bmkfs\b/,
    /\bdd\b/,
    /\bshutdown\b/,
    /\breboot\b/,
    /\binit\b/,
    /\bkillall\b/,
    /\bpkill\b/,
  ]
  if (dangerousPatterns.some((pattern) => pattern.test(params.command))) {
    throw new Error('Access denied: command contains dangerous operations')
  }

  return new Promise((resolve, reject) => {
    exec(params.command, { timeout: params.timeout || 120000 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(error.message))
      } else {
        resolve({ stdout, stderr })
      }
    })
  })
}
