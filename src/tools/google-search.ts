import puppeteer from 'puppeteer'

export interface GoogleSearchOptions {
  query: string
  numResults?: number
}

export interface SearchResult {
  title: string
  link: string
  snippet: string
}

// Check if browser is running
async function checkBrowser(): Promise<void> {
  try {
    const browser = await Promise.race([
      puppeteer.connect({
        browserURL: 'http://localhost:9222',
        defaultViewport: null,
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
    ])
    await browser.disconnect()
  } catch {
    throw new Error(
      'Chrome not running on :9222. Start with: /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222'
    )
  }
}

export async function googleSearch(options: GoogleSearchOptions): Promise<SearchResult[]> {
  const { query, numResults = 5 } = options

  if (!query) {
    throw new Error('Query is required')
  }

  await checkBrowser()

  const browser = await Promise.race([
    puppeteer.connect({
      browserURL: 'http://localhost:9222',
      defaultViewport: null,
    }),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
  ])

  const pages = await browser.pages()
  const page = pages.at(-1)
  if (!page) {
    await browser.close()
    throw new Error('No active tab found')
  }

  const results: SearchResult[] = []
  let start = 0

  while (results.length < numResults) {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&start=${start}`
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('div.MjjYud', { timeout: 5000 }).catch(() => {})

    const pageResults = await page.evaluate(() => {
      const items: SearchResult[] = []
      const searchResults = document.querySelectorAll('div.MjjYud')

      for (const result of Array.from(searchResults)) {
        const titleEl = result.querySelector('h3')
        const linkEl = result.querySelector('a')
        const snippetEl = result.querySelector('div.VwiC3b, div[data-sncf]')

        if (titleEl && linkEl && linkEl.href && !linkEl.href.startsWith('https://www.google.com')) {
          items.push({
            title: titleEl.textContent?.trim() || '',
            link: linkEl.href,
            snippet: snippetEl?.textContent?.trim() || '',
          })
        }
      }
      return items
    })

    if (pageResults.length === 0) {
      break
    }

    for (const r of pageResults) {
      if (results.length >= numResults) {
        break
      }
      if (!results.some((existing) => existing.link === r.link)) {
        results.push(r)
      }
    }

    start += 10
    if (start >= 100) {
      break
    }
  }

  // Don't close browser to keep connection alive for subsequent searches
  return results
}
