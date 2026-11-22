import { createHash, createHmac } from 'node:crypto';

const host = 'sms.volcengineapi.com';
const query = 'Action=SendSms&Version=2020-01-01';
const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');
const hmac = (key: string | Buffer, value: string) => createHmac('sha256', key).update(value).digest();

export function buildSmsRequest(phone: string, code: string, accessKey: string, secret: string, now = new Date()) {
  const body = JSON.stringify({
    SmsAccount: '882818d6',
    Sign: '鲸海拾贝科技（厦门）有限公司',
    TemplateID: 'S1T_1y2pba1wwre9u',
    TemplateParam: JSON.stringify({code}),
    PhoneNumbers: phone,
  });
  const dateTime = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const date = dateTime.slice(0, 8);
  const region = 'cn-north-1';
  const service = 'volcSMS';
  const scope = `${date}/${region}/${service}/request`;
  const hash = sha256(body);
  const signedHeaders = 'host;x-content-sha256;x-date';
  const canonical = ['POST', '/', query, `host:${host}\nx-content-sha256:${hash}\nx-date:${dateTime}\n`, signedHeaders, hash].join('\n');
  const signingKey = hmac(hmac(hmac(hmac(secret, date), region), service), 'request');
  const signature = hmac(signingKey, ['HMAC-SHA256', dateTime, scope, sha256(canonical)].join('\n')).toString('hex');
  return {
    url: `https://${host}/?${query}`,
    init: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
        'X-Date': dateTime,
        'X-Content-Sha256': hash,
        Authorization: `HMAC-SHA256 Credential=${accessKey}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
      },
      body,
    },
  };
}

function diagnosticValue(value: unknown) {
  return typeof value === 'string' && /^[A-Za-z0-9_.:-]{1,120}$/.test(value) ? value : null;
}

export async function sendSms(phone: string, code: string, accessKey: string, secret: string) {
  const started = Date.now();
  const {url, init} = buildSmsRequest(phone, code, accessKey, secret);
  const signal = AbortSignal.timeout(30_000);
  let response: Response | undefined;
  let data: {
    ResponseMetadata?: {RequestId?: string; Error?: {Code?: string}};
    Result?: {MessageID?: string[]};
  } | null = null;
  let phase = 'connect';
  try {
    response = await fetch(url, {...init, redirect: 'error', signal});
    phase = 'parse';
    data = await response.json();
    phase = 'provider';
    if (!response.ok || data?.ResponseMetadata?.Error || !data?.Result?.MessageID?.[0]) {
      throw new Error('SMS delivery request rejected');
    }
  } catch (error) {
    const cause = error instanceof Error ? error.cause : undefined;
    const networkCode = cause && typeof cause === 'object' && 'code' in cause ? cause.code : undefined;
    console.error('Volcengine SMS failed', JSON.stringify({
      phase,
      elapsedMs: Date.now() - started,
      timedOut: signal.aborted,
      httpStatus: response?.status ?? null,
      businessCode: diagnosticValue(data?.ResponseMetadata?.Error?.Code),
      requestId: diagnosticValue(data?.ResponseMetadata?.RequestId)
        ?? diagnosticValue(response?.headers.get('x-request-id'))
        ?? diagnosticValue(response?.headers.get('x-tt-logid')),
      errorType: diagnosticValue(error instanceof Error ? error.name : undefined),
      networkCode: diagnosticValue(networkCode),
    }));
    throw error;
  }
}
