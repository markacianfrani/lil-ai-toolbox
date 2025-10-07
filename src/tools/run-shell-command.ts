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

  // Guardrail: reject commands with absolute paths
  if (/[\/~]/.test(params.command) || /[A-Z]:/.test(params.command)) {
    throw new Error('Access denied: command contains absolute paths')
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
