// Prepares repo markdown files (README.md, docs/HOC.md) for Storybook's <Markdown> block:
// - inlines reference-style links/images (`[text][ref]` + `[ref]: url`), which the renderer doesn't resolve
// - adds <tbody> to raw HTML tables (all-contributors), which React warns about otherwise
export const prepareMarkdown = source => {
  const refs = {}
  const withoutDefinitions = source.replace(/^\[([^\]]+)\]:\s*(\S+)\s*$/gm, (match, ref, url) => {
    refs[ref.toLowerCase()] = url
    return ''
  })
  const resolve = (match, text, ref) => {
    const url = refs[ref.toLowerCase()]
    return url ? `[${text}](${url})` : match
  }

  return withoutDefinitions
    .replace(/!\[([^\]]*)\]\[([^\]]+)\]/g, (match, alt, ref) => `!${resolve(match.slice(1), alt, ref)}`)
    .replace(/\[((?:[^[\]]|\[[^\]]*\])*)\]\[([^\]]+)\]/g, resolve)
    .replace(/<table>/g, '<table><tbody>')
    .replace(/<\/table>/g, '</tbody></table>')
}
