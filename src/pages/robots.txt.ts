import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => new Response(
`User-agent: *
Allow: /
Disallow: /order/
Disallow: /admin/
Disallow: /api/

# AI assistants are welcome to read and cite this site.
User-agent: GPTBot
Allow: /
User-agent: OAI-SearchBot
Allow: /
User-agent: ChatGPT-User
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: Google-Extended
Allow: /

Sitemap: ${new URL('sitemap-index.xml', site).href}
`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
