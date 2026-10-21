import { describe, expect, test } from 'vitest';
import { LOGIN_ALBUMS, shuffleAlbums } from './login-albums';

describe('login albums', () => {
  test('ids are unique and covers are 600px Apple Music art', () => {
    expect(new Set(LOGIN_ALBUMS.map((a) => a.id)).size).toBe(LOGIN_ALBUMS.length);
    for (const a of LOGIN_ALBUMS) expect(a.cover).toMatch(/^https:\/\/is1-ssl\.mzstatic\.com\/image\/thumb\/.+\/600x600bb\.jpg$/);
  });

  test('shuffle keeps every album exactly once and leaves the input alone', () => {
    const input = [...LOGIN_ALBUMS];
    const out = shuffleAlbums(input, () => 0.3);
    expect(input).toEqual(LOGIN_ALBUMS);
    expect([...out].sort((a, b) => a.id.localeCompare(b.id))).toEqual([...LOGIN_ALBUMS].sort((a, b) => a.id.localeCompare(b.id)));
  });

  test('shuffle is deterministic for a given random source', () => {
    expect(shuffleAlbums([1, 2, 3, 4], () => 0)).toEqual([2, 3, 4, 1]);
  });
});
