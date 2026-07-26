/**
 * @jest-environment jsdom
 *
 * FK-45 (D6 slice 1) — tests for the saveFile(blob, filename) shim.
 *
 * The shim tries window.showSaveFilePicker() (native Save-As: the marker
 * picks the folder) and falls back to the anchor-download path when the API
 * is absent (Firefox/Safari) or when the user cancels the dialog. A cancelled
 * dialog is a silent no-op: nothing written, no error surfaced.
 *
 * Run with: npx jest js/save-file.test.js
 */

const { saveFile } = require('./save-file.js');

// Capture every <a> the shim creates so tests can assert on the anchor path.
let createdAnchors;
let clickSpy;

beforeEach(() => {
  createdAnchors = [];
  clickSpy = jest.fn();

  const realCreate = document.createElement.bind(document);
  jest.spyOn(document, 'createElement').mockImplementation((tag) => {
    const el = realCreate(tag);
    if (String(tag).toLowerCase() === 'a') {
      el.click = clickSpy;
      createdAnchors.push(el);
    }
    return el;
  });

  // jsdom implements neither of these; the shim uses both on the anchor path.
  URL.createObjectURL = jest.fn(() => 'blob:mock-url');
  URL.revokeObjectURL = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
  delete window.showSaveFilePicker;
});

describe('saveFile — File System Access path', () => {
  test('writes the blob through the chosen handle and does not touch the anchor path', async () => {
    const write = jest.fn().mockResolvedValue(undefined);
    const close = jest.fn().mockResolvedValue(undefined);
    const handle = { createWritable: jest.fn().mockResolvedValue({ write, close }) };
    window.showSaveFilePicker = jest.fn().mockResolvedValue(handle);

    const blob = new Blob(['{}'], { type: 'application/json' });
    const outcome = await saveFile(blob, 'My_Scorer.json');

    expect(outcome).toBe('picker');
    expect(window.showSaveFilePicker).toHaveBeenCalledWith(
      expect.objectContaining({ suggestedName: 'My_Scorer.json' })
    );
    expect(write).toHaveBeenCalledWith(blob);
    expect(close).toHaveBeenCalled();
    expect(clickSpy).not.toHaveBeenCalled();
  });
});

describe('saveFile — anchor fallback', () => {
  test('uses an anchor download carrying the filename when the picker API is absent', async () => {
    // showSaveFilePicker intentionally undefined (Firefox/Safari).
    const blob = new Blob(['label,text\r\n'], { type: 'text/csv' });
    const outcome = await saveFile(blob, 'snippets.csv');

    expect(outcome).toBe('anchor');
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(createdAnchors).toHaveLength(1);
    expect(createdAnchors[0].download).toBe('snippets.csv');
    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    // Revoke timing is asserted separately below — it's deliberately delayed.
  });

  test('delays the revoke instead of firing it immediately after click, so Firefox/Safari cannot cut the download off', async () => {
    jest.useFakeTimers();
    try {
      const blob = new Blob(['label,text\r\n'], { type: 'text/csv' });
      const outcome = await saveFile(blob, 'snippets.csv');

      expect(outcome).toBe('anchor');
      expect(URL.revokeObjectURL).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1000);
      expect(URL.revokeObjectURL).toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('saveFile — write failure after the picker succeeds', () => {
  test('falls back to anchor download when writing to the chosen handle fails', async () => {
    const write = jest.fn().mockRejectedValue(new Error('disk full'));
    const handle = { createWritable: jest.fn().mockResolvedValue({ write, close: jest.fn() }) };
    window.showSaveFilePicker = jest.fn().mockResolvedValue(handle);

    const blob = new Blob(['{}'], { type: 'application/json' });
    const outcome = await saveFile(blob, 'My_Scorer.json');

    expect(outcome).toBe('anchor');
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(createdAnchors[0].download).toBe('My_Scorer.json');
  });
});

describe('saveFile — cancelled dialog', () => {
  test('is a silent no-op (nothing written, no error) when the user aborts', async () => {
    const abort = Object.assign(new Error('The user aborted a request.'), { name: 'AbortError' });
    window.showSaveFilePicker = jest.fn().mockRejectedValue(abort);

    const blob = new Blob(['{}'], { type: 'application/json' });
    const outcome = await saveFile(blob, 'My_Scorer.json');

    expect(outcome).toBe('cancelled');
    expect(clickSpy).not.toHaveBeenCalled();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
});
