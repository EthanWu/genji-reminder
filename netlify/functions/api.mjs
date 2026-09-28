const upstream = 'https://qingyu-resource-workspace.super-jelly-9940.chatgpt.site';
export default async (request) => {
  const url = new URL(request.url);
  const target = upstream + url.pathname.replace(/^\/.netlify\/functions\/api/, '/api') + url.search;
  const headers = new Headers(request.headers);
  headers.set('origin', upstream);
  headers.set('x-heipu-proxy-secret', process.env.HEIPU_PROXY_SECRET || '');
  headers.delete('host');
  const response = await fetch(target, { method: request.method, headers, body: ['GET','HEAD'].includes(request.method) ? undefined : request.body, redirect: 'manual' });
  const out = new Response(response.body, response);
  out.headers.set('access-control-allow-origin', '*');
  return out;
};
