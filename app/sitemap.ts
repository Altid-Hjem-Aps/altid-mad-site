import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://altidmad.dk'
  return [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/billigste-supermarked`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/madpakker-paa-budget`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/madbudget`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/beregn-dit-madbudget`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/madplan-efter-tilbud`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/madbudget-familie-paa-4`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/mad-for-3000-om-maaneden`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/spar-penge-paa-dagligvarer`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/graensehandel-beregner`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/jul-paa-budget`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/kontakt`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/presse`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/privatlivspolitik`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/slet-konto`, changeFrequency: 'monthly', priority: 0.5 },
  ]
}
