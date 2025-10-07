import { convert } from 'html-to-text'
import TurndownService from 'turndown'

// Basic parameters for our simplified web fetch tool
export interface WebFetchToolParams {
  url: string
  format?: 'text' | 'markdown' | 'html'
  timeout?: number
}

const URL_FETCH_TIMEOUT_MS = 10000
const MAX_CONTENT_LENGTH = 100000

async function fetchWithTimeout(url: string, timeout: number): Promise<Response> {
  const controller = new AbortController()
  const signal = controller.signal
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, { signal })
    return response
  } finally {
    clearTimeout(timeoutId)
  }
}

function convertHTMLToMarkdown(html: string): string {
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
  })
  turndownService.remove(['script', 'style', 'meta', 'link'])
  return turndownService.turndown(html)
}

// Minimal tool definition
export async function webFetch(params: WebFetchToolParams): Promise<string> {
  // Basic validation
  if (!params.url) {
    throw new Error('The "url" parameter is required.')
  }

  let url = params.url

  // Convert GitHub blob URL to raw URL
  if (url.includes('github.com') && url.includes('/blob/')) {
    url = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/')
  }

  try {
    const response = await fetchWithTimeout(url, params.timeout || URL_FETCH_TIMEOUT_MS)
    if (!response.ok) {
      throw new Error(`Request failed with status code ${response.status} ${response.statusText}`)
    }
    const html = await response.text()
    if (params.format === 'html') {
      return html
    } else if (params.format === 'markdown') {
      const markdown = convertHTMLToMarkdown(html)
      return markdown.substring(0, MAX_CONTENT_LENGTH)
    } else {
      const textContent = convert(html, {
        wordwrap: false,
        selectors: [
          { selector: 'a', options: { ignoreHref: true } },
          { selector: 'img', format: 'skip' },
        ],
      }).substring(0, MAX_CONTENT_LENGTH)
      return textContent
    }
  } catch (e) {
    const error = e as Error
    throw new Error(`Error during fetch for ${url}: ${error.message}`)
  }
}
