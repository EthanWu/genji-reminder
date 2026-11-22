export async function probeSmsGateway() {
  if (process.env.VERCEL_ENV !== 'preview') return new Response(null, {status:404});
  const samples = [];
  for (let sample = 0; sample < 4; sample++) {
    const started = performance.now();
    try {
      const response = await fetch('https://sms.ap-hongkong.tencentcloudapi.com/', {
        method:'HEAD', cache:'no-store', redirect:'manual',
        headers:{Connection:'close'}, signal:AbortSignal.timeout(10_000),
      });
      samples.push({ms:Math.round(performance.now()-started),http:response.status});
    } catch (error) {
      const cause = error instanceof Error ? error.cause : undefined;
      const code = cause && typeof cause === 'object' && 'code' in cause ? cause.code : null;
      samples.push({ms:Math.round(performance.now()-started),error:error instanceof Error ? error.name : null,code});
    }
    if (sample < 3) await new Promise(resolve=>setTimeout(resolve,350));
  }
  return Response.json({region:process.env.VERCEL_REGION,samples},{headers:{'Cache-Control':'no-store'}});
}
