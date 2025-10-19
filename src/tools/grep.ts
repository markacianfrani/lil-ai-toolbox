import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { $ } from 'bun'
import { assertWithinWorkspace } from './path-utils'

// Ripgrep utility for the grep tool
export namespace Ripgrep {
  const PLATFORM = {
    'arm64-darwin': { platform: 'aarch64-apple-darwin', extension: 'tar.gz' },
    'arm64-linux': {
      platform: 'aarch64-unknown-linux-gnu',
      extension: 'tar.gz',
    },
    'x64-darwin': { platform: 'x86_64-apple-darwin', extension: 'tar.gz' },
    'x64-linux': { platform: 'x86_64-unknown-linux-musl', extension: 'tar.gz' },
    'x64-win32': { platform: 'x86_64-pc-windows-msvc', extension: 'zip' },
  } as const

  function getPlatformConfig() {
    const platformKey = `${process.arch}-${process.platform}` as keyof typeof PLATFORM
    const config = PLATFORM[platformKey]
    if (!config) {
      throw new Error(`Unsupported platform: ${platformKey}`)
    }
    return config
  }

  async function downloadFile(url: string, destPath: string) {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.status}`)
    }
    const buffer = await response.arrayBuffer()
    await Bun.write(destPath, buffer)
  }

  async function extractArchive(
    archivePath: string,
    binDir: string,
    config: (typeof PLATFORM)[keyof typeof PLATFORM]
  ) {
    if (config.extension === 'tar.gz') {
      await $`tar -xzf ${archivePath} -C ${binDir} --strip-components=1 --wildcards "*/rg"`.quiet()
    } else if (config.extension === 'zip') {
      try {
        await $`unzip -j ${archivePath} "*/rg.exe" -d ${binDir}`.quiet()
      } catch {
        throw new Error(
          'unzip command not available. Please install unzip or manually extract ripgrep.'
        )
      }
    }
  }

  async function downloadRipgrep(): Promise<string> {
    const config = getPlatformConfig()
    const version = '14.1.1'
    const filename = `ripgrep-${version}-${config.platform}.${config.extension}`
    const url = `https://github.com/BurntSushi/ripgrep/releases/download/${version}/${filename}`

    const binDir = path.join(process.cwd(), 'bin')
    await fs.mkdir(binDir, { recursive: true })

    const archivePath = path.join(binDir, filename)
    const filepath = path.join(binDir, process.platform === 'win32' ? 'rg.exe' : 'rg')

    // Check if we already have the binary
    try {
      await fs.access(filepath)
      return filepath
    } catch {}

    console.log(`Downloading ripgrep ${version}...`)
    await downloadFile(url, archivePath)
    await extractArchive(archivePath, binDir, config)

    // Set executable permissions on Unix-like systems
    if (process.platform !== 'win32') {
      await fs.chmod(filepath, 0o755)
    }

    // Clean up archive
    await fs.unlink(archivePath)

    return filepath
  }

  // Lazy initialization of ripgrep
  const state = (() => {
    let filepath: string | null = null
    let initialized = false

    return async () => {
      if (initialized && filepath) {
        return { filepath }
      }

      // Check if ripgrep is already available
      try {
        const result = await $`which rg`.quiet()
        if (result.exitCode === 0) {
          filepath = result.text().trim()
          initialized = true
          return { filepath }
        }
      } catch {}

      filepath = await downloadRipgrep()
      initialized = true
      return { filepath }
    }
  })()

  export async function getBinaryPath(): Promise<string> {
    const { filepath } = await state()
    return filepath
  }

  export async function search(params: {
    pattern: string
    cwd?: string
    include?: string
    maxCount?: number
  }): Promise<
    Array<{
      path: string
      lineNumber: number
      line: string
      matches: Array<{
        text: string
        start: number
        end: number
      }>
    }>
  > {
    const rgPath = await getBinaryPath()
    const cwd = params.cwd || process.cwd()

    // Use Bun.spawn instead of $ template to avoid glob expansion issues
    const args = [rgPath, '--json', '--hidden']

    if (params.include) {
      args.push('--glob', params.include)
    }

    args.push('--glob=!.git/*')

    if (params.maxCount) {
      args.push('--max-count', params.maxCount.toString())
    }

    args.push(params.pattern)

    const proc = Bun.spawn(args, {
      cwd,
      stdout: 'pipe',
      stderr: 'pipe',
    })

    const [stdout, stderr] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
    ])

    const exitCode = await proc.exited

    if (exitCode !== 0 && exitCode !== 1) {
      // Exit code 1 just means no matches found
      throw new Error(`ripgrep failed: ${stderr}`)
    }

    const lines = stdout.trim().split('\n').filter(Boolean)

    interface RipgrepMatch {
      type: 'match'
      data: {
        path: { text: string }
        line_number: number
        lines: { text: string }
        submatches: Array<{
          match: { text: string }
          start: number
          end: number
        }>
      }
    }

    return lines
      .map((line) => JSON.parse(line) as RipgrepMatch)
      .filter((parsed) => parsed.type === 'match')
      .map((parsed) => ({
        path: parsed.data.path.text,
        lineNumber: parsed.data.line_number,
        line: parsed.data.lines.text.trim(),
        matches: parsed.data.submatches.map((sub) => ({
          text: sub.match.text,
          start: sub.start,
          end: sub.end,
        })),
      }))
  }

  export async function isAvailable(): Promise<boolean> {
    try {
      await getBinaryPath()
      return true
    } catch {
      return false
    }
  }
}

// Basic parameters for our simplified grep tool
export interface GrepParams {
  pattern: string
  path?: string
  include?: string
  guardrailDir?: string
}

// Match result interface
export interface GrepMatch {
  path: string
  lineNum: number
  lineText: string
  modTime: number
}

// Tool result interface
export interface GrepResult {
  title: string
  metadata: {
    matches: number
    truncated: boolean
  }
  output: string
}

// Minimal grep tool implementation
export async function grepSearch(params: GrepParams): Promise<GrepResult> {
  // Basic validation
  if (!params.pattern) {
    throw new Error('The "pattern" parameter is required.')
  }

  const searchPath = params.path || process.cwd()

  // Resolve and validate path
  const resolvedPath = path.resolve(searchPath)
  const guardrailDir = params.guardrailDir || process.cwd()
  assertWithinWorkspace(resolvedPath, guardrailDir)

  try {
    // Use ripgrep for search
    const results = await Ripgrep.search({
      pattern: params.pattern,
      cwd: resolvedPath,
      include: params.include,
      maxCount: 100,
    })

    // Sort by path for now, since ripgrep doesn't sort by modtime easily
    results.sort((a, b) => a.path.localeCompare(b.path))

    const truncated = results.length >= 100
    const finalMatches = truncated ? results.slice(0, 100) : results

    if (finalMatches.length === 0) {
      return {
        title: params.pattern,
        metadata: { matches: 0, truncated: false },
        output: 'No matches found',
      }
    }

    // Format output
    const outputLines = [`Found ${finalMatches.length} matches`]

    let currentFile = ''
    for (const match of finalMatches) {
      if (currentFile !== match.path) {
        if (currentFile !== '') {
          outputLines.push('')
        }
        currentFile = match.path
        outputLines.push(`${match.path}:`)
      }
      outputLines.push(`  Line ${match.lineNumber}: ${match.line}`)
    }

    if (truncated) {
      outputLines.push('')
      outputLines.push('(Results are truncated. Consider using a more specific path or pattern.)')
    }

    return {
      title: params.pattern,
      metadata: {
        matches: finalMatches.length,
        truncated,
      },
      output: outputLines.join('\n'),
    }
  } catch (error) {
    const err = error as Error
    throw new Error(`Search failed: ${err.message}`)
  }
}
