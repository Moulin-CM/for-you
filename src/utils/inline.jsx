import { Fragment } from 'react'

// Markdown-lite: paragraphs (blank-line separated), soft line breaks,
// *bold*, _italic_. React nodes only, no innerHTML.

const INLINE = /(\*[^*\n]+\*|_[^_\n]+_)/g

function renderInlineTokens(line, keyPrefix) {
  const nodes = []
  let last = 0
  let k = 0
  line.replace(INLINE, (match, _tok, offset) => {
    if (offset > last) nodes.push(line.slice(last, offset))
    const inner = match.slice(1, -1)
    if (match[0] === '*') nodes.push(<strong key={`${keyPrefix}-b-${k++}`}>{inner}</strong>)
    else nodes.push(<em key={`${keyPrefix}-i-${k++}`}>{inner}</em>)
    last = offset + match.length
    return match
  })
  if (last < line.length) nodes.push(line.slice(last))
  return nodes
}

export function renderRichText(text) {
  if (!text) return null
  // Normalize line endings and split into paragraph blocks.
  const paragraphs = String(text).replace(/\r\n?/g, '\n').split(/\n{2,}/)
  return paragraphs.map((para, pi) => {
    const lines = para.split('\n')
    return (
      <p key={pi}>
        {lines.map((line, li) => (
          <Fragment key={li}>
            {renderInlineTokens(line, `${pi}-${li}`)}
            {li < lines.length - 1 && <br />}
          </Fragment>
        ))}
      </p>
    )
  })
}
