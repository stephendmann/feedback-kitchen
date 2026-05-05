/**
 * @jest-environment jsdom
 *
 * Tests for the post-processor in shared.js.
 * Run with: npx jest js/shared.test.js
 */

const ORIGINAL_INTL = global.Intl;

function setLocale(locale) {
  function FakeDTF() {
    return { resolvedOptions: function () { return { locale: locale }; } };
  }
  FakeDTF.prototype = ORIGINAL_INTL.DateTimeFormat.prototype;
  global.Intl = Object.assign({}, ORIGINAL_INTL, { DateTimeFormat: FakeDTF });
}

function loadShared() {
  jest.resetModules();
  delete global.window.SA;
  require('./shared.js');
  return global.window.SA;
}

beforeEach(() => {
  setLocale('en-NZ');
});

afterAll(() => {
  global.Intl = ORIGINAL_INTL;
});

describe('postProcessAIBody (AU/NZ locale)', () => {
  test('restores criterion header en dash and normalises bare decimals', () => {
    const SA = loadShared();
    const input = [
      'New Product Idea - .5 / 10',
      'The response uses behavior and color well!'
    ].join('\n');

    const output = SA.postProcessAIBody(input);

    expect(output).toContain('New Product Idea – 0.5 / 10');
    expect(output).toContain('behaviour');
    expect(output).toContain('colour');
    expect(output).not.toContain('!');
  });

  test('flags duplicate hedge phrases from the second occurrence onward across criteria', () => {
    const SA = loadShared();
    const input = [
      ['Criterion One - 7 / 10',  'This section shows more rigour in its use of examples.'].join('\n'),
      ['Criterion Two - 8 / 10',  'This section needs more rigour in the comparison.'].join('\n')
    ].join('\n\n');

    const output = SA.postProcessAIBody(input);

    expect(output).toMatch(/Criterion One – 7 \/ 10[\s\S]*more rigour(?!\s+\[REVIEW)/);
    expect(output).toMatch(/Criterion Two – 8 \/ 10[\s\S]*more rigour \[REVIEW: duplicate phrase\]/);
  });

  test('preserves criterion blocks while cleaning punctuation and spelling', () => {
    const SA = loadShared();
    const input = [
      ['Charts & Data Use - 11 / 15',          'Your chart is clear—however  it uses color and judgment...'].join('\n'),
      ['Writing, APA & Presentation - 14 / 20', 'The structure is organized,but the center heading is inconsistent!'].join('\n')
    ].join('\n\n');

    const output = SA.postProcessAIBody(input);

    expect(output.split(/\n\s*\n/)).toHaveLength(2);
    expect(output).toContain('Your chart is clear, however it uses colour and judgement.');
    expect(output).toContain('The structure is organised, but the centre heading is inconsistent.');
  });
});

describe('postProcessSingle (AU/NZ locale)', () => {
  test('normalises punctuation, decimals, and AU/NZ spelling', () => {
    const SA = loadShared();
    const input = 'We emphasized behavior in the center... score was .5!';
    const output = SA.postProcessSingle(input);
    expect(output).toBe('We emphasised behaviour in the centre. score was 0.5.');
  });

  test('handles all emphasise forms correctly', () => {
    const SA = loadShared();
    expect(SA.postProcessSingle('emphasize')).toBe('emphasise');
    expect(SA.postProcessSingle('emphasized')).toBe('emphasised');
    expect(SA.postProcessSingle('emphasizes')).toBe('emphasises');
    expect(SA.postProcessSingle('emphasizing')).toBe('emphasising');
  });
});

describe('validateAIBody', () => {
  test('passes a fully conformant body', () => {
    setLocale('en-NZ');
    const SA = loadShared();
    const body = [
      'New Product Idea – 10 / 10\nThe concept is convincing and well-supported. Add one sentence that explains how you would test this with NZ consumers.',
      'NZ Market Definition – 4 / 10\nYour definition is too generic and lacks data. Support your definition with NZ demographics from Stats NZ.'
    ].join('\n\n');

    const result = SA.validateAIBody(body, { lengthMode: 'standard' });
    expect(result.ok).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  test('flags missing action verb on sentence 2', () => {
    const SA = loadShared();
    const body = 'New Product Idea – 10 / 10\nThe concept is convincing. The idea is ready to move forward.';
    const result = SA.validateAIBody(body, { lengthMode: 'standard' });
    expect(result.ok).toBe(false);
    expect(result.issues[0].messages.join(' ')).toMatch(/sentence 2 should start with/);
  });

  test('flags wrong sentence count', () => {
    const SA = loadShared();
    const body = 'Criterion – 5 / 10\nOnly one sentence here.';
    const result = SA.validateAIBody(body, { lengthMode: 'standard' });
    expect(result.ok).toBe(false);
    expect(result.issues[0].messages.join(' ')).toMatch(/expected 2 sentences/);
  });

  test('flags word cap exceeded in brief mode', () => {
    const SA = loadShared();
    // 35 words — exceeds 30-word brief cap
    const body = 'Criterion – 5 / 10\nYour analysis is generally clear and shows real engagement with the material throughout the entire submission. Add more specific examples to your section three discussion of segmentation strategies and target market data.';
    const result = SA.validateAIBody(body, { lengthMode: 'brief' });
    expect(result.ok).toBe(false);
    expect(result.issues[0].messages.join(' ')).toMatch(/exceeds brief word cap/);
  });

  test('flags verb overuse across more than two criteria', () => {
    const SA = loadShared();
    const body = [
      'C1 – 5 / 10\nFirst eval. Add specific examples to your section.',
      'C2 – 5 / 10\nSecond eval. Add citations to your introduction.',
      'C3 – 5 / 10\nThird eval. Add data to your conclusion.'
    ].join('\n\n');
    const result = SA.validateAIBody(body, { lengthMode: 'standard' });
    expect(result.overusedVerbs).toContain('Add');
    expect(result.ok).toBe(false);
  });

  test('annotates flagged blocks inline when validate flag enabled', () => {
    const SA = loadShared();
    const body = 'Criterion – 5 / 10\nFirst sentence. Improve this further.';
    const validation = SA.validateAIBody(body, { lengthMode: 'standard' });
    const annotated = SA.annotateAIBodyWithValidation(body, validation);
    expect(annotated).toMatch(/\[VALIDATION:/);
  });
});

describe('locale gating', () => {
  test('US locale: spelling left untouched', () => {
    setLocale('en-US');
    const SA = loadShared();
    const input = 'We emphasized behavior in the center.';
    expect(SA.postProcessSingle(input)).toBe('We emphasized behavior in the center.');
  });

  test('AU locale: spelling normalised', () => {
    setLocale('en-AU');
    const SA = loadShared();
    expect(SA.postProcessSingle('We emphasized color.')).toBe('We emphasised colour.');
  });

  test('config override forces AU/NZ regardless of locale', () => {
    setLocale('en-US');
    const SA = loadShared();
    const config = { spellingLocale: 'au-nz' };
    expect(SA.postProcessSingle('We emphasized color.', config)).toBe('We emphasised colour.');
  });

  test('config override forces US regardless of locale', () => {
    setLocale('en-NZ');
    const SA = loadShared();
    const config = { spellingLocale: 'us' };
    expect(SA.postProcessSingle('We emphasized color.', config)).toBe('We emphasized color.');
  });

  test('postProcessAIBody respects config.spellingLocale', () => {
    setLocale('en-US');
    const SA = loadShared();
    const input = 'Criterion - 5 / 10\nThe color was organized.';
    const output = SA.postProcessAIBody(input, { spellingLocale: 'au-nz' });
    expect(output).toContain('colour');
    expect(output).toContain('organised');
  });
});
