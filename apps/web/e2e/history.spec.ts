import { expect, test, type Page } from '@playwright/test';
import v2 from '../../../data/demo/spec-v2.json' with { type: 'json' };

const KEY = 'dksi.history.v1';
async function ask(page: Page, question: string) {
  await page.getByRole('textbox', {name:'질문', exact:true}).fill(question);
  await page.getByRole('button', {name:/^근거 찾기/}).click();
  await expect(page.getByRole('status')).toContainText('찾았어요');
}
function countAsk(page: Page) {
  const counter = { n: 0 };
  page.on('request', request => { if (request.url().endsWith('/api/ask')) counter.n += 1; });
  return counter;
}

test('keeps the latest five questions across reloads, collapsed by default', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.question-history')).toHaveCount(0);
  for (const question of ['NFC', 'BLE', 'UWB', '폐기', '공유', '로그']) await ask(page, question);
  await page.reload();
  const history = page.locator('details.question-history');
  await expect(history).not.toHaveAttribute('open', '');
  await expect(history.locator('summary')).toContainText('최근 질문');
  await expect(history.locator('.history-count')).toHaveText(/^5건/);
  await history.locator('summary').click();
  await expect(history.locator('.history-question')).toHaveText(['로그', '공유', '폐기', 'UWB', 'BLE']);
  await expect(history.getByText('이 브라우저에만 저장돼요 · 최근 5건')).toBeVisible();
});

test('opening a saved question restores it without a request and re-run asks once', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('radio', {name:'V2', exact:true}).check();
  await ask(page, 'NFC 태그로 접근할 수 있나?');
  await page.reload();
  const requests = countAsk(page);
  await page.locator('details.question-history summary').click();
  await page.getByRole('button', {name:/^NFC 태그로 접근할 수 있나\?/}).click();
  await expect(page.getByRole('textbox', {name:'질문', exact:true})).toHaveValue('NFC 태그로 접근할 수 있나?');
  await expect(page.getByRole('radio', {name:'V2', exact:true})).toBeChecked();
  await expect(page.getByRole('radio', {name:'키워드 검색'})).toBeChecked();
  await expect(page.locator('.saved-banner')).toContainText('저장된 결과');
  await expect(page.getByRole('status')).toContainText('저장된 결과예요.');
  await expect(page.getByText('DEMO-V2-REQ-011', {exact:true}).first()).toBeVisible();
  await expect(page.locator('details.question-history')).not.toHaveAttribute('open', '');
  await page.locator('details.question-history summary').click();
  await expect(page.locator('.question-history li.current .history-question')).toHaveText('NFC 태그로 접근할 수 있나?');
  await expect(page.locator('.saved-banner p')).toHaveCount(0);
  expect(requests.n).toBe(0);
  await page.getByRole('button', {name:'다시 실행', exact:true}).click();
  await expect(page.getByRole('status')).toContainText('검색이 완료됐어요.');
  await expect(page.locator('.saved-banner')).toHaveCount(0);
  expect(requests.n).toBe(1);
});

test('delete one and clear all persist after reload', async ({ page }) => {
  await page.goto('/');
  for (const question of ['NFC', 'BLE']) await ask(page, question);
  await page.locator('details.question-history summary').click();
  await page.getByRole('button', {name:'이 질문 삭제: BLE'}).click();
  await page.reload();
  await page.locator('details.question-history summary').click();
  await expect(page.locator('.history-question')).toHaveText(['NFC']);
  await page.getByRole('button', {name:'전체 삭제'}).click();
  await expect(page.locator('.question-history')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.question-history')).toHaveCount(0);
});

test('malformed storage is ignored and an old-version snapshot asks for a re-run', async ({ page }) => {
  const source = v2.requirements.find(item => item.requirementId === 'DEMO-V2-REQ-011')!;
  const evidence = { citationId: `SRC:DKSI-SYNTHETIC:V2:${source.requirementId}`, documentId: 'DKSI-SYNTHETIC', documentTitle: v2.title,
    version: 'V2', sectionId: source.sectionId, requirementId: source.requirementId, heading: source.heading, quote: source.text, fullText: source.text };
  const old = { id: 'old', question: '예전 질문', mode: 'keyword', versions: ['V2'], topK: 5, submittedAt: '2026-10-01T01:00:00.000Z',
    appVersion: '0.0.1', response: { status: 'search_only', answer: null, sources: [evidence], warnings: [] } };
  await page.addInitScript(([key, value]) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem(key, value); sessionStorage.setItem('seeded', '1'); } },
    [KEY, JSON.stringify([{ id: 'bad', question: '<img src=x>', mode: 'admin' }, old])]);
  await page.goto('/');
  await page.locator('details.question-history summary').click();
  await expect(page.locator('.history-question')).toHaveText(['예전 질문']);
  await page.getByRole('button', {name:/^예전 질문/}).click();
  await expect(page.locator('.saved-banner p')).toHaveText('이전 앱 버전에서 저장된 결과예요. 다시 실행해 최신 원문을 확인하세요.');

  await page.evaluate(key => localStorage.setItem(key, '{not json'), KEY);
  await page.reload();
  await expect(page.locator('.question-history')).toHaveCount(0);
  await ask(page, 'NFC');
});

test('history has no horizontal overflow at 375px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/');
  await ask(page, 'V2에서 UWB ranging 실패 시 NFC fallback 조건은 무엇인가요? 아주 긴 질문 문장이 한 줄 말줄임으로 표시되는지 확인합니다');
  await page.locator('details.question-history summary').click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});
