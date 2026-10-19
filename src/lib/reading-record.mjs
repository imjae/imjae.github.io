export function isCalendarDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value ?? '')
    && !Number.isNaN(Date.parse(value))
    && new Date(value).toISOString().slice(0, 10) === value;
}

export function prepareReadingBook(options) {
  const title = options.bookTitle?.trim();
  const author = options.bookAuthor?.trim();
  const finished = options.bookFinished?.trim();
  const note = options.bookNote?.trim();
  if (!title || title.length > 160) throw new Error('책 제목은 1~160자로 적어 주세요.');
  if (author && author.length > 120) throw new Error('저자는 120자 이내로 적어 주세요.');
  if (finished && !isCalendarDate(finished)) throw new Error('다 읽은 날짜를 확인해 주세요.');
  if (note && note.length > 280) throw new Error('짧은 감상은 280자 이내로 적어 주세요.');
  return { title, ...(author ? { author } : {}), ...(finished ? { finished } : {}), ...(note ? { note } : {}) };
}

export const readingSections = ['기억에 남는 내용', '덧붙이는 생각'];
