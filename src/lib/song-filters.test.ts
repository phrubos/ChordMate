import { describe, expect, test } from 'vitest';
import { parseSongFilters, serializeSongFilters } from './song-filters';

describe('parseSongFilters', () => {
  test('defaults', () => {
    expect(parseSongFilters({})).toEqual({ hasTab: false, favOnly: false, sort: 'artist', view: 'grid' });
  });

  test('reads valid values and drops invalid ones', () => {
    const f = parseSongFilters({ status: 'ok', view: 'list', difficulty: '3', hasTab: '1', fav: '1', sort: 'date', search: 'hotel' });
    expect(f).toEqual({ status: 'ok', view: 'list', difficulty: 3, hasTab: true, favOnly: true, sort: 'date', search: 'hotel' });
    expect(parseSongFilters({ status: 'x' }).status).toBeUndefined();
    expect(parseSongFilters({ difficulty: '9' }).difficulty).toBeUndefined();
    expect(parseSongFilters({ view: 'table' }).view).toBe('grid');
  });
});

describe('serializeSongFilters', () => {
  test('omits defaults', () => {
    expect(serializeSongFilters({ view: 'grid', sort: 'artist' }, new URLSearchParams('view=list'))).toBe('');
  });

  test('merges with the current params and removes cleared keys', () => {
    expect(serializeSongFilters({ status: 'ready' }, new URLSearchParams('search=a&view=list'))).toBe('search=a&view=list&status=ready');
    expect(serializeSongFilters({ status: undefined, hasTab: false }, new URLSearchParams('status=ok&hasTab=1&fav=1'))).toBe('fav=1');
    expect(serializeSongFilters({ favOnly: true, difficulty: 4 }, new URLSearchParams())).toBe('fav=1&difficulty=4');
  });
});
