import { describe, expect, test } from 'vitest';
import { canAccessCalendarEntry, canAccessRehearsal, canAccessSong } from './access';

const band = { userId: 'me', bandId: 'b1', memberIds: ['me', 'pal'] };
const solo = { userId: 'me', bandId: null, memberIds: [] };

describe('song access (mirrors the Songs list scope)', () => {
  test('band songs of the active band', () => {
    expect(canAccessSong({ bandId: 'b1', addedById: 'stranger' }, band)).toBe(true);
    expect(canAccessSong({ bandId: 'b2', addedById: 'me' }, band)).toBe(false);
  });

  test('band-less songs added by a member of the active band', () => {
    expect(canAccessSong({ bandId: null, addedById: 'pal' }, band)).toBe(true);
    expect(canAccessSong({ bandId: null, addedById: 'stranger' }, band)).toBe(false);
  });

  test('without a band: only own band-less songs', () => {
    expect(canAccessSong({ bandId: null, addedById: 'me' }, solo)).toBe(true);
    expect(canAccessSong({ bandId: null, addedById: 'pal' }, solo)).toBe(false);
    expect(canAccessSong({ bandId: 'b1', addedById: 'me' }, solo)).toBe(false);
  });
});

describe('calendar entry access', () => {
  test('entries of the active band, or own band-less entries without a band', () => {
    expect(canAccessCalendarEntry({ bandId: 'b1', addedById: 'stranger' }, band)).toBe(true);
    expect(canAccessCalendarEntry({ bandId: 'b2', addedById: 'me' }, band)).toBe(false);
    expect(canAccessCalendarEntry({ bandId: null, addedById: 'me' }, band)).toBe(false);
    expect(canAccessCalendarEntry({ bandId: null, addedById: 'me' }, solo)).toBe(true);
    expect(canAccessCalendarEntry({ bandId: null, addedById: 'pal' }, solo)).toBe(false);
  });
});

test('rehearsal access follows the calendar rule', () => {
  expect(canAccessRehearsal({ bandId: 'b1', createdById: 'stranger' }, band)).toBe(true);
  expect(canAccessRehearsal({ bandId: 'b2', createdById: 'me' }, band)).toBe(false);
  expect(canAccessRehearsal({ bandId: null, createdById: 'me' }, solo)).toBe(true);
  expect(canAccessRehearsal({ bandId: null, createdById: 'pal' }, solo)).toBe(false);
});
