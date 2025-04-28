export const MAX_WORDS = 10; // max words per segment
export const MIN_WORDS = 4;  // min words per segment
export const WINDOW    = 3;  // look this many tokens back for a break

const SENT_BOUNDARY = /(?<!\d)(?<=[.!?])\s+/g; 
const CLAUSE_BREAK  = /,|;|\s+(?:ve|ama|fakat)\s+/i;

function cleanFinal(str: string): string {
  return str.replace(/[.!?]+$/, '.');
}

function splitSentences(text: string): string[] {
  return text.split(SENT_BOUNDARY).map(t => t.trim()).filter(Boolean);
}

/** split a *long* sentence into smart chunks */
function chunks(sent: string): string[] {
  const words = sent.split(/\s+/);
  const out: string[] = [];
  let i = 0;

  while (i < words.length) {
    let j = Math.min(i + MAX_WORDS, words.length);

    // look WINDOW tokens backwards for a nicer break
    for (let k = j; k > i && j - k <= WINDOW; k--) {
      const snippet = words.slice(i, k).join(' ');
      if (CLAUSE_BREAK.test(snippet)) {
        j = k;
        break;
      }
    }

    out.push(words.slice(i, j).join(' '));
    i = j;
  }

  // merge last fragment if too small
  if (out.length > 1 && out[out.length - 1].split(' ').length < MIN_WORDS) {
    const tail = out.pop()!;
    // strip trailing punctuation from previous chunk before merge
    out[out.length - 1] = out[out.length - 1].replace(/[.!?]+$/, '') + ' ' + tail;
  }

  return out.map(cleanFinal);
}

export function segmentScript(text: string): string[] {
  const segs: string[] = [];
  for (const s of splitSentences(text)) {
    if (s.split(' ').length > MAX_WORDS) segs.push(...chunks(s));
    else segs.push(cleanFinal(s));
  }
  return segs;
}

/** groups segment indices by the sentence they belong to */
export function sentenceBuckets(segs: string[]): number[][] {
  const buckets: number[][] = [];
  let current: number[] = [];
  segs.forEach((_, idx) => {
    current.push(idx);
    if (segs[idx].match(/[.!?]\s*$/)) {
      buckets.push(current);
      current = [];
    }
  });
  if (current.length) buckets.push(current);
  return buckets;
}
