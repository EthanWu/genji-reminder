import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildSmsRequest, sendSms } from '../lib/volc-sms.ts';

test('signs the reviewed Volcengine template request with the exact JSON body', () => {
  const {url, init} = buildSmsRequest('13800138000', '012345', 'test-ak', 'test-sk', new Date('2026-11-22T00:01:02Z'));
  assert.equal(url, 'https://sms.volcengineapi.com/?Action=SendSms&Version=2020-01-01');
  assert.equal(init.headers['X-Date'], '20261122T000102Z');
  assert.deepEqual(JSON.parse(init.body), {
    SmsAccount: '882818d6',
    Sign: '鲸海拾贝科技（厦门）有限公司',
    TemplateID: 'S1T_1y2pba1wwre9u',
    TemplateParam: '{"code":"012345"}',
    PhoneNumbers: '13800138000',
  });
  assert.equal(init.headers.Authorization, 'HMAC-SHA256 Credential=test-ak/20261122/cn-north-1/volcSMS/request, SignedHeaders=host;x-content-sha256;x-date, Signature=7d0b0cd7c5571ebb9b1973092b4fb87d287ab267218c3c3f0651d3fd365ed183');
});

test('treats HTTP 200 with a provider error as a failed submission', async t => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({
    ResponseMetadata: {Error: {Code: 'TEST_REJECTED'}},
  }));
  await assert.rejects(sendSms('13800138000', '012345', 'fake', 'fake'), /rejected/);
});
