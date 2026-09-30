import { test } from 'node:test';
import assert from 'node:assert/strict';
import { accessStatus, sameOrigin } from '../lib/access.ts';
test('requires a session',()=>assert.equal(accessStatus(null,'jiajia@taowhale.com'),401));
test('rejects other verified emails',()=>assert.equal(accessStatus({email:'other@taowhale.com',verified:true},'jiajia@taowhale.com'),403));
test('rejects unverified owner email',()=>assert.equal(accessStatus({email:'jiajia@taowhale.com',verified:false},'jiajia@taowhale.com'),403));
test('accepts verified normalized owner email',()=>assert.equal(accessStatus({email:'JiaJia@taowhale.com',verified:true},'jiajia@taowhale.com'),200));
test('missing whitelist fails closed',()=>assert.equal(accessStatus({email:'jiajia@taowhale.com',verified:true},undefined),403));
test('rejects cross-origin and missing-origin writes',()=>{assert.equal(sameOrigin(new Request('https://example.com/api',{headers:{origin:'https://evil.com'}})),false);assert.equal(sameOrigin(new Request('https://example.com/api')),false);assert.equal(sameOrigin(new Request('https://example.com/api',{headers:{origin:'https://example.com'}})),true)});
