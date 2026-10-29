import { expect, test } from '@playwright/test';

test('Spec Overview is reachable from the header and starts without a selection', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation', {name:'주요 메뉴'}).getByRole('link', {name:'Spec Overview'}).click();
  await expect(page).toHaveURL(/\/overview$/);
  await expect(page.getByRole('heading', {level:1, name:'스펙 한눈에 살펴보기'})).toBeVisible();
  await expect(page.getByRole('link', {name:'Spec Overview'})).toHaveAttribute('aria-current', 'page');
  await expect(page.getByText('타일을 누르면 두 버전의 문장을 나란히 볼 수 있어요.')).toBeVisible();
  expect(await page.locator('.map-tile').count()).toBeGreaterThanOrEqual(16);
});

test('spec map filters tiles by keyword and compares both versions of a tile', async ({ page }) => {
  await page.goto('/overview');
  await page.getByRole('searchbox', {name:'타일 찾기'}).fill('nfc');
  await expect(page.locator('.map-tile.hit').first()).toBeVisible();
  await expect(page.locator('.map-tile.dim').first()).toBeVisible();
  await expect(page.getByRole('status').filter({hasText:'개 일치'})).toBeVisible();
  await page.getByRole('searchbox', {name:'타일 찾기'}).fill('zzzz');
  await expect(page.getByText('일치하는 요구사항이 없어요.')).toBeVisible();
  await page.getByRole('searchbox', {name:'타일 찾기'}).fill('');

  await page.getByRole('button', {name:/^REQ-004 Delegated Sharing/}).click();
  const detail = page.getByRole('region', {name:'REQ-004 Delegated Sharing'});
  await expect(detail.getByText(/V1→V2 변경 정도 약 \d+% · 달라진 곳 \d+곳/)).toBeVisible();
  await expect(detail.locator('del').first()).toBeVisible();
  await expect(detail.locator('ins').first()).toBeVisible();
  await expect(detail.getByText('DEMO-V1-REQ-004')).toBeVisible();
  await expect(detail.getByText('DEMO-V2-REQ-004')).toBeVisible();

  await page.getByRole('button', {name:/^OVR-004 .*새로 생김/}).click();
  await expect(page.getByText('V2에서 새로 생긴 요구사항이에요.')).toBeVisible();
  await page.getByRole('button', {name:/^OVR-001 .*변경 없음/}).click();
  await expect(page.getByText('두 버전의 문장이 같아요.')).toBeVisible();
});

test('scenario simulator applies reviewed rules step by step', async ({ page }) => {
  await page.goto('/overview');
  const verdict = (name: string) => page.locator('.verdict').filter({has: page.locator('strong', {hasText: new RegExp(`^${name} `)})});
  await expect(page.getByText('규칙 검수 상태')).toBeVisible();
  // defaults: V2, UWB failed, NFC allowed, valid credential, entry-only permission
  await expect(verdict('출입')).toContainText('출입 허용');
  await expect(verdict('시동')).toContainText('시동 불가');
  await expect(verdict('시동')).toContainText('시동 권한 없음');
  await expect(page.locator('.scenario-steps .ref-button', {hasText:'DEMO-V2-REQ-011'})).toBeVisible();

  await page.getByLabel('스펙 버전').selectOption('V1');
  await expect(page.locator('.scenario-steps .ref-button', {hasText:'DEMO-V1-REQ-011'})).toBeVisible();
  await expect(page.locator('.scenario-steps .ref-button', {hasText:'DEMO-V2-REQ-011'})).toHaveCount(0);

  await page.getByLabel('NFC 출입 허용').selectOption('n');
  await expect(verdict('출입')).toContainText('출입 거부');
  await expect(verdict('시동')).toContainText('출입 단계에서 중단');

  await page.getByLabel('UWB 거리 측정').selectOption('ok');
  await page.getByLabel('부여된 권한').selectOption('both');
  await expect(verdict('출입')).toContainText('출입 허용');
  await expect(verdict('시동')).toContainText('시동 허용');

  await page.getByLabel('크리덴셜 상태').selectOption('suspended');
  await expect(page.locator('.scenario-steps li')).toHaveCount(1);
  await expect(verdict('출입')).toContainText('출입 거부');
});

for (const width of [375, 1280]) {
  test(`overview has no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({width, height:900});
    await page.goto('/overview');
    await page.getByRole('button', {name:/^REQ-004 Delegated Sharing/}).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('rule reference opens the original text with the supporting quote highlighted', async ({ page }) => {
  await page.setViewportSize({width:1280, height:900});
  await page.goto('/overview');
  await expect(page.getByText('단계의 순서는 이해를 돕기 위한 정리예요.')).toBeVisible();
  await expect(page.locator('.source-empty')).toBeVisible();
  await page.locator('.ref-button', {hasText:'DEMO-V2-REQ-012'}).click();
  await expect(page.locator('.source-text mark')).toHaveText("Entry-only or NFC-only permission SHALL NOT imply vehicle-start permission");
  await expect(page.locator('.source-id')).toContainText('V2');
  await page.getByLabel('스펙 버전').selectOption('V1');
  await expect(page.locator('.source-empty')).toBeVisible();
  await page.locator('.ref-button', {hasText:'DEMO-V1-REQ-012'}).click();
  await expect(page.locator('.source-text mark')).toHaveText("Entry-only access SHALL NOT imply permission to start the vehicle");
  await page.keyboard.press('Escape');
  await expect(page.locator('.source-empty')).toBeVisible();
});

test('on a phone the original text opens as a bottom sheet without overflow', async ({ page }) => {
  await page.setViewportSize({width:375, height:800});
  await page.goto('/overview');
  await expect(page.locator('.source-panel')).toBeHidden();
  await page.locator('.ref-button').first().click();
  await expect(page.locator('.source-panel.open')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', {name:'닫기'}).click();
  await expect(page.locator('.source-panel')).toBeHidden();
});
