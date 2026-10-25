// Display-only projection of the exact diff kept by the review/approval contract.
// Keep all text literal: Markdown, code and HTML must never become executable UI.
export function parseReviewDiff(diff) {
  const changes = [];
  let current = null, oldLine = 1, newLine = 1, inHunk = false;
  const unified = /^@@ /m.test(diff);
  for (const line of diff.replace(/\r\n/g, '\n').split('\n')) {
    const range = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line);
    if (range) {
      if (current) changes.push(current);
      current = null; oldLine = Number(range[1]); newLine = Number(range[2]); inHunk = true; continue;
    }
    if (/^(diff --git |index |--- |\+\+\+ )/.test(line) && !inHunk) continue;
    if (line.startsWith('diff --git ')) {
      if (current) changes.push(current);
      current = null; inHunk = false; continue;
    }
    if (unified && !inHunk) continue;
    if (line.startsWith('\\ No newline')) continue;
    if (line[0] === '-' || line[0] === '+') {
      current ??= { before: [], after: [], oldLine, newLine };
      if (line[0] === '-') { current.before.push(line.slice(1)); oldLine++; }
      else { current.after.push(line.slice(1)); newLine++; }
    } else {
      if (current) changes.push(current);
      current = null;
      if (line[0] === ' ') { oldLine++; newLine++; }
    }
  }
  if (current) changes.push(current);
  return changes;
}
