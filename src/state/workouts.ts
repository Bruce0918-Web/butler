import type { Block, Lift, Move, Slot } from './types';

// CJK ranges and full-width punctuation are written as escapes so tools/punct.mjs cannot alter these patterns.
const HAN = '\\u4e00-\\u9fff';
const DIGIT_THEN_WORD = new RegExp(`(\\d)(?=[${HAN}]|lbs|kg)`, 'g');
const WORD_THEN_DIGIT = new RegExp(`([${HAN}])(?=\\d)`, 'g');
const CLAUSE_END = /[;；。]/;
const LEADING_MARK = /^[:：\s]+/;
const NOT_HAN_PREFIX = new RegExp(`^[^${HAN}]+`);
const MOVE = /^(.*?)\s+([A-Za-z][A-Za-z ()]*?)\s+(\d+\s*×.*)$/;
const HAS_WEIGHT = /\d\s*(lbs|kg)/;
const SEP = '；';

/** Puts a space between a number and the word or unit next to it: "145lbs" → "145 lbs", "第4组" → "第 4 组". */
export function tidy(text: string): string {
  return text.replace(DIGIT_THEN_WORD, '$1 ').replace(WORD_THEN_DIGIT, '$1 ').trim();
}

/** "深蹲 Squat (Barbell) 4×6–8" → its three parts. Text that does not fit the pattern is kept whole as the name. */
export function parseMove(part: string): Pick<Move, 'zh' | 'en' | 'sets'> {
  const m = part.trim().match(MOVE);
  return m ? { zh: m[1].trim(), en: m[2].trim(), sets: m[3].replace(/\s+/g, '') } : { zh: part.trim(), en: '', sets: '' };
}

/** How many leading characters of `clause` name this move (the longest piece of its name the clause starts with). */
function nameLength(clause: string, zh: string): number {
  for (let len = Math.min(zh.length, clause.length); len >= 2; len--)
    for (let i = 0; i + len <= zh.length; i++) if (clause.startsWith(zh.slice(i, i + len))) return len;
  return 0;
}

const join = (a: string, b: string) => (a && b ? a + SEP + b : a || b);

/**
 * Turns the old one-sentence workouts into blocks of separate exercises.
 * A clause of the note goes to an exercise only when it starts with that exercise's name, or when the block
 * has a single exercise and the clause states a weight. Everything else stays in the block's note, unchanged
 * apart from spacing. Nothing is guessed.
 */
export function structure(lifts: Record<string, Lift[]>): Record<string, Block[]> {
  const out: Record<string, Block[]> = {};
  for (const [name, rows] of Object.entries(lifts))
    out[name] = rows.map((row, b) => {
      const moves: Move[] = row.name.split(' + ').map((part, i) => ({ id: `${name}-${b}-${i}`, ...parseMove(part), target: '' }));
      const rest: string[] = [];
      for (const clause of row.note.split(CLAUSE_END).map((c) => c.trim()).filter(Boolean)) {
        const lengths = moves.map((m) => nameLength(clause, m.zh));
        const best = Math.max(...lengths);
        const owners = lengths.filter((l) => l === best).length;
        if (best >= 2 && owners === 1) {
          const move = moves[lengths.indexOf(best)];
          move.target = join(move.target, tidy(clause.slice(best).replace(LEADING_MARK, '')));
        } else if (moves.length === 1 && HAS_WEIGHT.test(clause)) moves[0].target = join(moves[0].target, tidy(clause));
        else rest.push(tidy(clause));
      }
      return { id: `${name}-${b}`, kind: row.group.replace(NOT_HAN_PREFIX, ''), note: rest.join(SEP), moves };
    });
  return out;
}

const TRAINING = /力量|跑|拳击|热身|冷水|灵活性|心理演练/;
const FOOD = /香蕉|酸奶|奶昔/;
const PREP = /热身|冷水|灵活性|心理演练/;

/** The day's timeline items that are training: tagged as such, or named after a kind of training. */
export const trainingSlots = (slots: Slot[]) => slots.filter((s) => (s.tag === '训练' || TRAINING.test(s.title)) && !FOOD.test(s.title));

/** The session itself, as opposed to warm-ups and recovery around it. */
export const mainSlot = (slots: Slot[]) => trainingSlots(slots).find((s) => !PREP.test(s.title)) ?? null;
