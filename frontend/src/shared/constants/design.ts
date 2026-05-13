export const GRADIENTS = [
  'linear-gradient(135deg,#0969da,#8250df)',
  'linear-gradient(135deg,#e63946,#f4a261)',
  'linear-gradient(135deg,#1a7f37,#0969da)',
  'linear-gradient(135deg,#8250df,#1a7f37)',
  'linear-gradient(135deg,#d4a72c,#cf222e)',
  'linear-gradient(135deg,#6e7781,#57606a)',
];

export const PROJECT_STOPWORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'from',
  'this',
  'that',
  'project',
  'issue',
  'pull',
  'request',
  '작업',
  '프로젝트',
  '이슈',
  '요청',
  '관련',
]);

export function pickGradient(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

export function tokenizeProjectText(text: string): string[] {
  const normalized = text.toLowerCase();
  const tokens = normalized.match(/[a-z0-9가-힣_+-]+/g) ?? [];
  return Array.from(
    new Set(tokens.filter((token) => token.length >= 2 && !PROJECT_STOPWORDS.has(token))),
  );
}
