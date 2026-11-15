import { describe, expect, it } from 'vitest';
import { parseDate, parseTime } from '../src/state/parse';

const TODAY = '2026-11-17';

describe('parseDate', () => {
  it('reads full dates in several spellings', () => {
    expect(parseDate('2026-11-21', TODAY)).toBe('2026-11-21');
    expect(parseDate('2027/2/28', TODAY)).toBe('2027-02-28');
    expect(parseDate('2027 年 2 月 28 日', TODAY)).toBe('2027-02-28');
  });
  it('fills in the year for short dates', () => {
    expect(parseDate('11-21', TODAY)).toBe('2026-11-21');
    expect(parseDate('11 月 21 日', TODAY)).toBe('2026-11-21');
    expect(parseDate('12/15', TODAY)).toBe('2026-12-15');
  });
  it('takes a short date well in the past as next year', () => {
    expect(parseDate('2-28', TODAY)).toBe('2027-02-28');
    expect(parseDate('11-1', TODAY)).toBe('2026-11-01'); // two weeks ago stays this year
  });
  it('an empty field means no date', () => {
    expect(parseDate('  ', TODAY)).toBeNull();
  });
  it('rejects what is not a real date', () => {
    expect(parseDate('2026-02-30', TODAY)).toBeUndefined();
    expect(parseDate('13-01', TODAY)).toBeUndefined();
    expect(parseDate('下周五', TODAY)).toBeUndefined();
  });
});

describe('parseTime', () => {
  it('reads common spellings', () => {
    expect(parseTime('5:00')).toBe('05:00');
    expect(parseTime('05:00')).toBe('05:00');
    expect(parseTime('1730')).toBe('17:30');
    expect(parseTime('17.30')).toBe('17:30');
  });
  it('rejects impossible times', () => {
    expect(parseTime('24:00')).toBeUndefined();
    expect(parseTime('12:60')).toBeUndefined();
    expect(parseTime('早上')).toBeUndefined();
    expect(parseTime('')).toBeUndefined();
  });
});
