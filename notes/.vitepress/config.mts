import { defineConfig } from 'vitepress'
import type { DefaultTheme } from 'vitepress'
import { readdirSync, statSync } from 'node:fs'
import type { Dirent } from 'node:fs'
import { join, posix, sep } from 'node:path'
import { obsidianMarkdown } from './markdown/obsidian'

function toPosixPath(p: string) {
  return p.split(sep).join(posix.sep)
}

function titleFromFileName(fileName: string) {
  return fileName
    .replace(/\.md$/i, '')
    .replace(/[_-]+/g, ' ')
    .trim()
}

function linkFromRelMd(relMdPath: string) {
  const rel = toPosixPath(relMdPath).replace(/\.md$/i, '')
  if (rel.toLowerCase().endsWith('/readme')) return `/${rel.slice(0, -'/readme'.length)}/`
  if (rel.toLowerCase().endsWith('/index')) return `/${rel.slice(0, -'/index'.length)}/`
  if (rel.toLowerCase() === 'index') return '/'
  return `/${rel}`
}

function buildSidebarItemsFromDir(rootDirAbs: string, relDir = '') {
  const dirAbs = join(rootDirAbs, relDir)
  const entries = readdirSync(dirAbs, { withFileTypes: true })
    .filter((e: Dirent) => !e.name.startsWith('.'))
    .filter((e: Dirent) => e.name !== 'public')
    .filter((e: Dirent) => e.name !== '.vitepress')

  const collator = new Intl.Collator('zh-Hans-CN', { numeric: true, sensitivity: 'base' })
  entries.sort((a: Dirent, b: Dirent) => collator.compare(a.name, b.name))

  const items: DefaultTheme.SidebarItem[] = []

  for (const entry of entries) {
    const relPath = relDir ? `${relDir}/${entry.name}` : entry.name
    const absPath = join(rootDirAbs, relPath)

    if (entry.isDirectory()) {
      const hasIndex = (() => {
        try {
          return statSync(join(absPath, 'index.md')).isFile()
        } catch {
          return false
        }
      })()

      const childItems = buildSidebarItemsFromDir(rootDirAbs, relPath)
      const text = titleFromFileName(entry.name)

      if (childItems.length === 0 && !hasIndex) continue

      items.push({
        text,
        link: hasIndex ? linkFromRelMd(`${relPath}/index.md`) : undefined,
        items: childItems.length > 0 ? childItems : undefined
      })
      continue
    }

    if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      if (entry.name.toLowerCase() === 'index.md' && relDir === '') continue
      const text = titleFromFileName(entry.name)
      items.push({ text, link: linkFromRelMd(relPath) })
    }
  }

  return items
}

function buildSidebar() {
  const rootDirAbs = join(process.cwd(), 'notes')

  // 为每个顶级目录单独生成侧边栏
  return {
    '/agent/': buildSidebarItemsFromDir(rootDirAbs, 'agent'),
    '/architecture/': buildSidebarItemsFromDir(rootDirAbs, 'architecture'),
    '/framework/': buildSidebarItemsFromDir(rootDirAbs, 'framework'),
    '/frontend/': buildSidebarItemsFromDir(rootDirAbs, 'frontend'),
    '/bugs/': buildSidebarItemsFromDir(rootDirAbs, 'bugs'),
    '/algorithms/': buildSidebarItemsFromDir(rootDirAbs, 'algorithms'),
    '/animation/': buildSidebarItemsFromDir(rootDirAbs, 'animation'),
    '/performance/': buildSidebarItemsFromDir(rootDirAbs, 'performance'),
  }
}

function buildEnSidebar() {
  const rootDirAbs = join(process.cwd(), 'notes/en')

  return {
    '/en/agent/': buildSidebarItemsFromDir(rootDirAbs, 'agent'),
    '/en/architecture/': buildSidebarItemsFromDir(rootDirAbs, 'architecture'),
    '/en/framework/': buildSidebarItemsFromDir(rootDirAbs, 'framework'),
    '/en/frontend/': buildSidebarItemsFromDir(rootDirAbs, 'frontend'),
    '/en/bugs/': buildSidebarItemsFromDir(rootDirAbs, 'bugs'),
    '/en/algorithms/': buildSidebarItemsFromDir(rootDirAbs, 'algorithms'),
    '/en/animation/': buildSidebarItemsFromDir(rootDirAbs, 'animation'),
    '/en/performance/': buildSidebarItemsFromDir(rootDirAbs, 'performance'),
  }
}

export default defineConfig({
  title: 'dev-notes',
  description: 'Personal Knowledge Base',
  lastUpdated: true,
  cleanUrls: true,
  locales: {
    root: {
      label: '简体中文',
      lang: 'zh-CN',
      themeConfig: {
        nav: [
          { text: '首页', link: '/' },
          { text: 'AI Agent', link: '/agent/' },
          { text: '底层设计', link: '/architecture/' },
          { text: '框架原理', link: '/framework/' },
          { text: '大前端', link: '/frontend/' },
          { text: 'BUG分析', link: '/bugs/' },
          {
            text: '更多探索',
            items: [
              { text: '数据结构与算法', link: '/algorithms/' },
              { text: '动画', link: '/animation/' },
              { text: '性能优化', link: '/performance/' }
            ]
          }
        ],
        sidebar: buildSidebar(),
        outline: {
          level: 'deep',
          label: '目录'
        }
      }
    },
    en: {
      label: 'English',
      lang: 'en-US',
      link: '/en/',
      themeConfig: {
        nav: [
          { text: 'Home', link: '/en/' },
          { text: 'AI Agent', link: '/en/agent/' },
          { text: 'Architecture', link: '/en/architecture/' },
          { text: 'Framework', link: '/en/framework/' },
          { text: 'Frontend', link: '/en/frontend/' },
          { text: 'Bugs', link: '/en/bugs/' },
          {
            text: 'More',
            items: [
              { text: 'Algorithms', link: '/en/algorithms/' },
              { text: 'Animation', link: '/en/animation/' },
              { text: 'Performance', link: '/en/performance/' }
            ]
          }
        ],
        sidebar: buildEnSidebar(),
        outline: {
          level: 'deep',
          label: 'On this page'
        }
      }
    }
  },
  markdown: {
    config(md: any) {
      md.use(obsidianMarkdown)
    }
  },
  themeConfig: {
    search: { provider: 'local' },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/vaclock/dev-notes' }
    ]
  }
})
