import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { FaqSchemaScript, faqSchema } from '@/components/seo/article'

describe('faqSchema', () => {
  it('builds a FAQPage with joined answers', () => {
    const s = faqSchema([{ q: 'Q?', a: ['One.', 'Two.'] }])
    expect(s['@type']).toBe('FAQPage')
    expect(s.mainEntity).toHaveLength(1)
    expect(s.mainEntity[0].name).toBe('Q?')
    expect(s.mainEntity[0].acceptedAnswer.text).toBe('One. Two.')
  })

  it('handles an empty FAQ list', () => {
    expect(faqSchema([]).mainEntity).toEqual([])
  })
})

describe('FaqSchemaScript', () => {
  it('escapes "<" so FAQ copy cannot break out of the JSON-LD script tag', () => {
    const { container } = render(
      <FaqSchemaScript faq={[{ q: 'x', a: ['</script><script>alert(1)</script>'] }]} />
    )
    const html = container.querySelector('script')!.innerHTML
    expect(html).not.toContain('</script>')
    expect(html).not.toContain('<script>')
    expect(html).toContain('\\u003c')
  })
})
