import { useEffect } from 'react'
import { useLocation } from 'react-router'

function AutoSentraFont() {
  const { pathname } = useLocation()

  useEffect(() => {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          const parent = node.parentElement
          if (!parent) return NodeFilter.FILTER_REJECT
          // Lewati script, style, input, atau elemen yang sudah diberi font-sentra
          if (
            ['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT'].includes(parent.tagName) ||
            parent.closest('.font-sentra')
          ) {
            return NodeFilter.FILTER_REJECT
          }
          if (/\bSENTRA\b/.test(node.nodeValue)) {
            return NodeFilter.FILTER_ACCEPT
          }
          return NodeFilter.FILTER_SKIP
        },
      }
    )

    const nodes = []
    let current
    while ((current = walker.nextNode())) {
      nodes.push(current)
    }

    nodes.forEach((textNode) => {
      const fragment = document.createDocumentFragment()
      const parts = textNode.nodeValue.split(/(\bSENTRA\b)/g)

      parts.forEach((part) => {
        if (part === 'SENTRA') {
          const span = document.createElement('span')
          span.className = 'font-sentra'
          span.textContent = part
          fragment.appendChild(span)
        } else if (part) {
          fragment.appendChild(document.createTextNode(part))
        }
      })

      textNode.parentNode.replaceChild(fragment, textNode)
    })
  }, [pathname])

  return null
}

export default AutoSentraFont