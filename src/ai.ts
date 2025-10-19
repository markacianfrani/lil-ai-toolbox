import { tool } from 'ai'
import { z } from 'zod'
import { type GlobParams, globSearch } from './tools/glob'
import { type ListDirectoryParams, listDirectory as listDirectoryFn } from './tools/list-directory'
import { type ReadFileParams, readFile as readFileFn } from './tools/read-file'
import { type ReadManyFilesParams, readManyFiles as readManyFilesFn } from './tools/read-many-files'
import { type ReplaceParams, replace as replaceFn } from './tools/replace'
import {
  type RunShellCommandParams,
  runShellCommand as runShellCommandFn,
} from './tools/run-shell-command'
import {
  type SearchParams,
  searchFileContent as searchFileContentFn,
} from './tools/search-file-content'
import { type GrepParams, grepSearch } from './tools/grep'
import { type WebFetchToolParams, webFetch as webFetchFn } from './tools/web-fetch'
import { type WriteFileParams, writeFile as writeFileFn } from './tools/write-file'

// AI SDK tool objects with conventional naming
export const globTool = tool({
  description:
    'Fast file pattern matching tool that works with any codebase size. Supports glob patterns like "**/*.js" or "src/**/*.ts". Returns matching file paths sorted by modification time.',
  inputSchema: z.object({
    pattern: z.string().describe('The glob pattern to match files against'),
    path: z
      .string()
      .optional()
      .describe(
        'The directory to search in. If not specified, the current working directory will be used.'
      ),
  }),
  execute: async (params: GlobParams) => {
    return await globSearch(params)
  },
})

export const listDirectoryTool = tool({
  description:
    'Lists files and directories in a given path. The path parameter must be an absolute path, not a relative path. You can optionally provide an array of glob patterns to ignore with the ignore parameter.',
  inputSchema: z.object({
    path: z
      .string()
      .describe('The absolute path to the directory to list (must be absolute, not relative)'),
    ignore: z.array(z.string()).optional().describe('List of glob patterns to ignore'),
  }),
  execute: async (params: ListDirectoryParams) => {
    return await listDirectoryFn(params)
  },
})

export const readFileTool = tool({
  description:
    'Reads a file from the local filesystem. You can access any file directly by using this tool. By default, it reads up to 2000 lines starting from the beginning of the file. You can optionally specify a line offset and limit.',
  inputSchema: z.object({
    filePath: z.string().describe('The path to the file to read'),
    offset: z.number().optional().describe('The line number to start reading from (0-based)'),
    limit: z.number().optional().describe('The number of lines to read (defaults to 2000)'),
  }),
  execute: async (params: ReadFileParams) => {
    return await readFileFn(params)
  },
})

export const readManyFilesTool = tool({
  description:
    'Reads multiple files from the local filesystem. Takes an array of file paths and returns an array of objects containing the file path and content for each file.',
  inputSchema: z.object({
    filePaths: z.array(z.string()).describe('Array of file paths to read'),
  }),
  execute: async (params: ReadManyFilesParams) => {
    return await readManyFilesFn(params)
  },
})

export const replaceTool = tool({
  description:
    'Replaces text in a file. Performs exact string replacement. If the oldString is not unique in the file, you must provide a more specific string or use replaceAll.',
  inputSchema: z.object({
    filePath: z.string().describe('The path to the file to modify'),
    oldString: z.string().describe('The text to replace'),
    newString: z.string().describe('The text to replace it with'),
    replaceAll: z
      .boolean()
      .optional()
      .describe('Replace all occurrences of oldString (default false)'),
  }),
  execute: async (params: ReplaceParams) => {
    await replaceFn(params)
    return 'File updated successfully'
  },
})

export const runShellCommandTool = tool({
  description:
    'Executes a shell command and returns the stdout and stderr output. Useful for running system commands, scripts, or build processes.',
  inputSchema: z.object({
    command: z.string().describe('The shell command to execute'),
    timeout: z.number().optional().describe('Optional timeout in milliseconds (default 120000)'),
  }),
  execute: async (params: RunShellCommandParams) => {
    return await runShellCommandFn(params)
  },
})

export const searchFileContentTool = tool({
  description:
    'Searches for a regex pattern in the content of files. Supports glob patterns for file inclusion. Returns matches with file path, line number, and line content.',
  inputSchema: z.object({
    pattern: z.string().describe('The regex pattern to search for in file contents'),
    path: z
      .string()
      .optional()
      .describe('The directory to search in (defaults to current directory)'),
    include: z
      .string()
      .optional()
      .describe('File pattern to include in the search (e.g. "*.js", "*.{ts,tsx}")'),
  }),
  execute: async (params: SearchParams) => {
    return await searchFileContentFn(params)
  },
})

export const grepTool = tool({
  description:
    'Fast content search tool that works with any codebase size. Searches file contents using regular expressions. Supports full regex syntax. Filter files by pattern with the include parameter. Returns formatted search results with file paths, line numbers, and content sorted by modification time.',
  inputSchema: z.object({
    pattern: z.string().describe('The regex pattern to search for in file contents'),
    path: z
      .string()
      .optional()
      .describe('The directory to search in. Defaults to the current working directory.'),
    include: z
      .string()
      .optional()
      .describe('File pattern to include in the search (e.g. "*.js", "*.{ts,tsx}")'),
  }),
  execute: async (params: GrepParams) => {
    return await grepSearch(params)
  },
})

export const webFetchTool = tool({
  description:
    'Fetches content from a specified URL. Can return text, markdown, or HTML. Supports GitHub URL conversion and has built-in timeout and content length limits.',
  inputSchema: z.object({
    url: z.string().describe('The URL to fetch content from'),
    format: z
      .enum(['text', 'markdown', 'html'])
      .optional()
      .describe('The format to return the content in (default "text")'),
    timeout: z.number().optional().describe('Optional timeout in milliseconds (default 10000)'),
  }),
  execute: async (params: WebFetchToolParams) => {
    return await webFetchFn(params)
  },
})

export const writeFileTool = tool({
  description:
    'Writes content to a file. Creates the file if it does not exist, or overwrites it if it does. The filePath must be an absolute path.',
  inputSchema: z.object({
    filePath: z
      .string()
      .describe('The absolute path to the file to write (must be absolute, not relative)'),
    content: z.string().describe('The content to write to the file'),
  }),
  execute: async (params: WriteFileParams) => {
    await writeFileFn(params)
    return 'File written successfully'
  },
})
