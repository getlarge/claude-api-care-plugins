/**
 * Tests for NLP utilities
 * Run with: node --test src/nlp.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  pluralize,
  singularize,
  isVerb,
  isNoun,
  isUncountable,
  analyzeWord,
} from './rules/helpers/nlp.js';

describe('pluralize()', () => {
  describe('regular nouns', () => {
    it('pluralizes simple nouns', () => {
      assert.equal(pluralize('user'), 'users');
      assert.equal(pluralize('product'), 'products');
    });

    it('pluralizes noun-verb switches as nouns', () => {
      assert.equal(pluralize('order'), 'orders');
      assert.equal(pluralize('download'), 'downloads');
      assert.equal(pluralize('upload'), 'uploads');
    });
  });

  describe('irregular plurals (compromise built-in)', () => {
    it('handles person -> people', () => {
      assert.equal(pluralize('person'), 'people');
    });

    it('handles child -> children', () => {
      assert.equal(pluralize('child'), 'children');
    });

    it('handles index -> indices', () => {
      assert.equal(pluralize('index'), 'indices');
    });

    it('handles -es endings', () => {
      assert.equal(pluralize('bus'), 'buses');
      assert.equal(pluralize('box'), 'boxes');
    });

    it('handles -y endings', () => {
      assert.equal(pluralize('category'), 'categories');
      assert.equal(pluralize('story'), 'stories');
    });

    it('handles database -> databases', () => {
      assert.equal(pluralize('database'), 'databases');
    });
  });

  describe('API-specific uncountables (our extension)', () => {
    it('does not pluralize data', () => {
      assert.equal(pluralize('data'), 'data');
    });

    it('does not pluralize metadata', () => {
      assert.equal(pluralize('metadata'), 'metadata');
    });

    it('does not pluralize auth', () => {
      assert.equal(pluralize('auth'), 'auth');
    });

    it('does not pluralize config', () => {
      assert.equal(pluralize('config'), 'config');
    });

    it('does not pluralize settings', () => {
      assert.equal(pluralize('settings'), 'settings');
    });

    it('does not pluralize api', () => {
      assert.equal(pluralize('api'), 'api');
    });

    it('does not pluralize software', () => {
      assert.equal(pluralize('software'), 'software');
    });
  });

  describe('built-in uncountables', () => {
    it('does not pluralize information', () => {
      assert.equal(pluralize('information'), 'information');
    });
  });
});

describe('singularize()', () => {
  it('singularizes regular plurals', () => {
    assert.equal(singularize('users'), 'user');
    assert.equal(singularize('orders'), 'order');
  });

  it('singularizes irregular plurals', () => {
    assert.equal(singularize('people'), 'person');
    assert.equal(singularize('children'), 'child');
  });

  it('returns word unchanged if already singular', () => {
    assert.equal(singularize('user'), 'user');
    assert.equal(singularize('data'), 'data');
  });
});

describe('isVerb()', () => {
  describe('pure verbs', () => {
    it('identifies create as verb', () => {
      assert.equal(isVerb('create'), true);
    });

    it('identifies delete as verb', () => {
      assert.equal(isVerb('delete'), true);
    });

    it('identifies execute as verb', () => {
      assert.equal(isVerb('execute'), true);
    });
  });

  describe('noun-verb switches treated as nouns in API context', () => {
    // "run" is a noun-verb switch - in API context ("/runs", "a test run")
    // we treat it as a noun
    it('identifies run as noun (noun-verb switch)', () => {
      assert.equal(isVerb('run'), false);
    });
  });

  describe('nouns', () => {
    it('identifies user as not a verb', () => {
      assert.equal(isVerb('user'), false);
    });

    it('identifies product as not a verb', () => {
      assert.equal(isVerb('product'), false);
    });
  });

  describe('noun-verb switches (compromise handles these)', () => {
    it('identifies download as not primarily a verb (noun-verb)', () => {
      assert.equal(isVerb('download'), false);
    });

    it('identifies upload as not primarily a verb (noun-verb)', () => {
      assert.equal(isVerb('upload'), false);
    });

    it('identifies search as not primarily a verb (noun-verb)', () => {
      assert.equal(isVerb('search'), false);
    });

    it('identifies backup as not primarily a verb (noun-verb)', () => {
      assert.equal(isVerb('backup'), false);
    });

    it('identifies report as not primarily a verb (noun-verb)', () => {
      assert.equal(isVerb('report'), false);
    });
  });
});

describe('isNoun()', () => {
  it('identifies user as noun', () => {
    assert.equal(isNoun('user'), true);
  });

  it('identifies product as noun', () => {
    assert.equal(isNoun('product'), true);
  });

  it('identifies download as noun (noun-verb)', () => {
    assert.equal(isNoun('download'), true);
  });

  it('identifies data as noun (uncountable)', () => {
    assert.equal(isNoun('data'), true);
  });
});

describe('isUncountable()', () => {
  describe('API-specific uncountables (our extension)', () => {
    it('data is uncountable', () => {
      assert.equal(isUncountable('data'), true);
    });

    it('metadata is uncountable', () => {
      assert.equal(isUncountable('metadata'), true);
    });

    it('auth is uncountable', () => {
      assert.equal(isUncountable('auth'), true);
    });

    it('config is uncountable', () => {
      assert.equal(isUncountable('config'), true);
    });

    it('software is uncountable', () => {
      assert.equal(isUncountable('software'), true);
    });
  });

  describe('built-in uncountables (compromise)', () => {
    it('information is uncountable', () => {
      assert.equal(isUncountable('information'), true);
    });
  });

  describe('countable nouns', () => {
    it('user is countable', () => {
      assert.equal(isUncountable('user'), false);
    });

    it('product is countable', () => {
      assert.equal(isUncountable('product'), false);
    });
  });
});

describe('analyzeWord()', () => {
  it('analyzes a simple noun', () => {
    const result = analyzeWord('user');
    assert.equal(result.isNoun, true);
    assert.equal(result.isVerb, false);
    assert.equal(result.isUncountable, false);
    assert.ok(Array.isArray(result.tags));
  });

  it('analyzes a verb', () => {
    const result = analyzeWord('create');
    assert.equal(result.isVerb, true);
  });

  it('analyzes an uncountable noun', () => {
    const result = analyzeWord('data');
    assert.equal(result.isNoun, true);
    assert.equal(result.isUncountable, true);
    assert.equal(result.isVerb, false);
  });

  it('analyzes a noun-verb switch (download)', () => {
    const result = analyzeWord('download');
    // In API context, noun-verb switches are treated as nouns
    assert.equal(result.isNoun, true);
    assert.equal(result.isVerb, false);
  });

  it('analyzes a noun-verb switch (order)', () => {
    const result = analyzeWord('order');
    assert.equal(result.isNoun, true);
    assert.equal(result.isVerb, false);
  });
});
