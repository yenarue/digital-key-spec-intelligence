import { expect, test } from '@playwright/test';
import uiText from '../src/content/ui-text.json' with { type: 'json' };

for (const reason of ['timeout', 'citation_validation', 'malformed', 'rate_limit'] as const) {
  test(`controlled ${reason} response displays its own cause and keeps evidence`, async ({page, request}) => {
    const actual = await (await request.post('/api/ask', {data:{question:'NFC', mode:'keyword'}})).json();
    await page.route('**/api/ask', route => route.fulfill({json:{...actual, status:'llm_unavailable', answer:null,
      failureReason:reason, warnings:[uiText.answer.failures[reason].message]}}));
    await page.goto('/');
    await page.getByRole('radio', {name:'AI 검색', exact:true}).check();
    await page.getByRole('textbox', {name:'질문', exact:true}).fill('NFC');
    await page.getByRole('button', {name:/^근거 찾기/}).click();
    await expect(page.getByRole('heading', {name:uiText.answer.failures[reason].heading, exact:true})).toBeVisible();
    await expect(page.locator('.result-warnings')).toHaveText(uiText.answer.failures[reason].message);
    await expect(page.locator('.sources-panel article').first()).toBeVisible();
    if (reason !== 'citation_validation') await expect(page.getByText(uiText.answer.failures.citation_validation.message)).toHaveCount(0);
  });
}

test('platform HTML 504 displays timeout instead of citation or unreadable response', async ({page}) => {
  await page.route('**/api/ask', route => route.fulfill({status:504, contentType:'text/html', body:'<html>Gateway Timeout</html>'}));
  await page.goto('/');
  await page.getByRole('radio', {name:'AI 검색', exact:true}).check();
  await page.getByRole('textbox', {name:'질문', exact:true}).fill('NFC');
  await page.getByRole('button', {name:/^근거 찾기/}).click();
  await expect(page.locator('#question-error[role=alert]')).toHaveText(uiText.errors.timeout);
});
