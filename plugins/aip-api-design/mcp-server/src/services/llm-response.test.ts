import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractJson, parseJsonResponse } from './llm-response.js';

describe('extractJson', () => {
  it('extracts JSON from code block', () => {
    const text = '```json\n{"foo": "bar"}\n```';
    assert.equal(extractJson(text), '{"foo": "bar"}');
  });

  it('extracts first complete JSON object', () => {
    const text = 'Here is the result: {"found": true} and some notes {}';
    assert.equal(extractJson(text), '{"found": true}');
  });

  it('handles nested objects correctly', () => {
    const text = 'Result: {"outer": {"inner": 1}} text after';
    assert.equal(extractJson(text), '{"outer": {"inner": 1}}');
  });

  it('handles deeply nested objects', () => {
    const text = '{"a":{"b":{"c":1}}} extra';
    assert.equal(extractJson(text), '{"a":{"b":{"c":1}}}');
  });

  it('returns null when no JSON found', () => {
    assert.equal(extractJson('no json here'), null);
  });

  it('returns null for unclosed braces', () => {
    assert.equal(extractJson('{"unclosed": '), null);
  });

  it('extracts first complete object even with extra closing braces', () => {
    // Extra closing braces are ignored - we extract the first valid object
    assert.equal(extractJson('{"too":"many"}}}'), '{"too":"many"}');
  });

  it('ignores text before JSON', () => {
    const text = 'Let me find that for you: {"result": true}';
    assert.equal(extractJson(text), '{"result": true}');
  });
});

describe('parseJsonResponse', () => {
  it('parses extracted JSON', () => {
    const text = 'Result: {"found": true}';
    const result = parseJsonResponse(text);
    assert.deepEqual(result, { found: true });
  });

  it('returns null for invalid JSON', () => {
    const text = 'Result: {invalid}';
    const result = parseJsonResponse(text);
    assert.equal(result, null);
  });

  it('returns null when no JSON present', () => {
    const result = parseJsonResponse('no json here');
    assert.equal(result, null);
  });
});
