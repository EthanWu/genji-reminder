import {test} from 'node:test';
import assert from 'node:assert/strict';
import { aiInputSchema } from '../lib/ai-input.ts';
test('rejects malformed bodies and unsupported modes',()=>{for(const input of [null,{}, {text:'hello',mode:'delete'},{text:' ',mode:'ask'},{text:'a'.repeat(20001),mode:'ask'}])assert.equal(aiInputSchema.safeParse(input).success,false)});
test('accepts existing ask and extract contracts',()=>{for(const mode of ['ask','extract'])assert.equal(aiInputSchema.safeParse({text:'测试',mode}).success,true)});
