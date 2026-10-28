import { expect, test } from '@playwright/test';
import v1 from '../../../data/demo/spec-v1.json' with { type: 'json' };
import webPackage from '../package.json' with { type: 'json' };

test('real API preserves source fields and version, rejects invalid and unsupported requests', async ({ request }) => {
  const response = await request.post('/api/ask', { data: { question: 'NFC 태그로 접근할 수 있나?', versions: ['V1'] } });
  expect(response.status()).toBe(200);
  const result = await response.json();
  expect(result.status).toBe('search_only');
  expect(result.answer).toBeNull();
  expect(result.sources.length).toBeGreaterThan(0);
  expect(result.sources.length).toBeLessThanOrEqual(5);
  expect(result.sources.some((s: {requirementId:string}) => s.requirementId === 'DEMO-V1-REQ-011')).toBe(true);
  for (const source of result.sources) {
    const original = v1.requirements.find(r => r.requirementId === source.requirementId);
    expect(source.version).toBe('V1');
    expect(source.documentTitle).toBe(v1.title);
    expect(source.quote).toBe(original?.text);
    expect(source.fullText).toBe(original?.text);
  }
  const none = await request.post('/api/ask', { data: { question: '우주선 추진엔진 사양이 뭐야?' } });
  expect(await none.json()).toMatchObject({status:'insufficient_evidence', answer:null, sources:[]});
  for (const data of [{question:''},{question:'x'.repeat(501)},{question:'NFC',versions:['V3']},{question:'NFC',topK:9}]) {
    expect((await request.post('/api/ask', {data})).status()).toBe(400);
  }
  expect((await request.post('/api/ask', {data:'x'.repeat(9000),headers:{'content-type':'application/json'}})).status()).toBe(413);
});

test('question to actual search, source expansion and inert MCP', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Digital Key Spec Intelligence');
  await expect(page.getByText('Digital Key Spec Intelligence', {exact:true})).toBeVisible();
  await expect(page.locator('.app-release')).toHaveText(`v${webPackage.version}`);
  await page.getByRole('button', {name:'DEMO', exact:true}).hover();
  await expect(page.getByText('Synthetic demo — not an official specification', {exact:true})).toBeVisible();
  await page.mouse.move(0, 700);
  await expect(page.getByRole('tooltip')).toBeHidden();
  await expect(page.getByRole('button', {name:'Local MCP · Coming soon'})).toBeDisabled();
  await page.getByText('이 서비스는 무엇인가요?').click();
  await expect(page.getByText('스펙 문서 원문 기반의 근거를 함께 보여줘요', {exact:false})).toBeVisible();
  await page.getByRole('radio', {name:'V1', exact:true}).check();
  await page.getByRole('textbox', {name:'질문', exact:true}).fill('NFC 태그로 접근할 수 있나?');
  await page.getByRole('button', {name:/^근거 찾기/}).click();
  await expect(page.getByText('DEMO-V1-REQ-011', {exact:true}).first()).toBeVisible();
  await expect(page.getByText('DEMO-V2-REQ-011', {exact:true})).toHaveCount(0);
  await page.getByText('원문 전체 보기', {exact:true}).first().click();
  await expect(page.locator('details[open]:not(.about)')).toHaveCount(1);
});

test('unsupported question shows honest empty state', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', {name:'질문', exact:true}).fill('우주선 추진엔진 사양이 뭐야?');
  await page.getByRole('button', {name:/^근거 찾기/}).click();
  await expect(page.getByText(/답변 근거를 찾지 못했/)).toBeVisible();
});

test('evidence cards show matched terms and highlight them without altering the quote', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('radio', {name:'V1', exact:true}).check();
  await page.getByRole('textbox', {name:'질문', exact:true}).fill('디지털키가 뭐야?');
  await page.getByRole('button', {name:/^근거 찾기/}).click();
  const card = page.locator('article.evidence-card').first();
  await expect(card.getByText('DEMO-V1-OVR-001', {exact:true})).toBeVisible();
  const terms = card.getByRole('list', {name:'일치한 검색어'});
  await expect(terms.getByRole('listitem')).toHaveText(['digital동의어', '디지털키']);
  await expect(card.locator('blockquote mark')).toHaveText(['digital']);
  const source = v1.requirements.find(item => item.requirementId === 'DEMO-V1-OVR-001')!;
  await expect(card.locator('blockquote')).toHaveText(source.text);
});

for (const width of [375,1280]) {
  test(`layout has no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({width,height:900}); await page.goto('/');
    await page.getByRole('textbox', {name:'질문',exact:true}).fill('V2에서 UWB ranging 실패 시 NFC fallback 조건은?');
    await page.getByRole('button', {name:/^근거 찾기/}).click();
    await expect(page.getByText('DEMO-V2-REQ-010',{exact:true}).first()).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({path:`output/playwright/dksi-${width}.png`,fullPage:true});
  });
}

test('mocked answered UI safely links to an actual source and focuses its card', async ({ page, request }) => {
  const actualResponse=await request.post('/api/ask',{data:{question:'NFC',versions:['V1'],mode:'keyword'}});
  const actual=await actualResponse.json();
  const source=actual.sources[0];
  await page.route('**/api/ask',route=>route.fulfill({json:{...actual,status:'answered',answer:`<b>권한</b>은 별도로 확인해야 합니다. [${source.citationId}]`,warnings:[]}}));
  await page.goto('/');
  await page.getByRole('radio',{name:'AI 검색',exact:true}).check();
  await page.getByRole('textbox',{name:'질문',exact:true}).fill('NFC');
  await page.getByRole('button',{name:/^근거 찾기/}).click();
  await expect(page.getByText('<b>권한</b>은 별도로 확인해야 합니다.',{exact:false})).toBeVisible();
  await expect(page.locator('.answer-prose b')).toHaveCount(0);
  await page.getByRole('link',{name:`근거 1: ${source.version} ${source.requirementId}`,exact:true}).click();
  const card=page.locator('article.evidence-card').first();
  await expect(card).toBeFocused();
  await card.locator('summary').click();
  await expect(card.locator('details')).toHaveAttribute('open','');
  await expect(card.getByText(source.citationId,{exact:true})).toBeVisible();
});

test('pending request prevents duplicate sends and preserves input on fallback',async({page,request})=>{
  const actual=await (await request.post('/api/ask',{data:{question:'NFC',versions:['V1'],mode:'keyword'}})).json();
  let calls=0;
  let release!:()=>void;
  const ready=new Promise<void>(resolve=>{release=resolve;});
  await page.route('**/api/ask',async route=>{calls++;await ready;await route.fulfill({json:actual});});
  await page.goto('/');
  await page.getByRole('radio',{name:'AI 검색',exact:true}).check();
  const input=page.getByRole('textbox',{name:'질문',exact:true});
  await input.fill('NFC');
  await page.getByRole('button',{name:/^근거 찾기/}).click();
  await expect(input).toBeDisabled();
  await expect(page.getByRole('radio',{name:'키워드 검색',exact:true})).toBeDisabled();
  await expect(page.getByRole('radio',{name:'AI 검색',exact:true})).toBeDisabled();
  await expect(page.getByRole('button',{name:/^찾는 중/})).toBeDisabled();
  await page.locator('form').evaluate(form=>{(form as HTMLFormElement).requestSubmit();});
  release();
  await expect(page.getByText('검색 결과를 확인하세요',{exact:true})).toBeVisible();
  expect(calls).toBe(1);
  await expect(input).toHaveValue('NFC');
});


test('explicit modes reuse current-input results without automatic requests and clear on input/version changes',async({page,request})=>{
  const actual=await (await request.post('/api/ask',{data:{question:'NFC',versions:['V1'],mode:'keyword'}})).json();
  const source=actual.sources[0];
  const calls: {mode:string;question:string;versions:string[];topK:number}[]=[];
  await page.route('**/api/ask',async route=>{
    const body=route.request().postDataJSON();
    calls.push(body);
    await route.fulfill({json:body.mode==='keyword' ? {...actual,warnings:[]} : {...actual,status:'answered',answer:`가상 조건입니다. [${source.citationId}]`,warnings:[]}});
  });
  await page.goto('/');
  const keyword=page.getByRole('radio',{name:'키워드 검색',exact:true});
  const ai=page.getByRole('radio',{name:'AI 검색',exact:true});
  const input=page.getByRole('textbox',{name:'질문',exact:true});
  const submit=page.getByRole('button',{name:/^근거 찾기/});
  await expect(keyword).toBeChecked();
  await page.getByRole('button',{name:/^시동 권한/}).click();
  await ai.check(); await keyword.check();
  await input.fill('NFC');
  await page.getByRole('radio',{name:'V1',exact:true}).check();
  expect(calls).toHaveLength(0);
  await submit.click();
  await expect(page.getByRole('heading',{name:'키워드 검색 결과',exact:true})).toBeVisible();
  expect(calls).toEqual([{question:'NFC',versions:['V1'],topK:5,mode:'keyword'}]);
  await expect(page.locator('.result-context')).toContainText('키워드 검색');
  await ai.check();
  await expect(page.locator('.result-block')).toHaveCount(0);
  expect(calls).toHaveLength(1);
  await submit.click();
  await expect(page.getByRole('heading',{name:'근거 기반 답변',exact:true})).toBeVisible();
  expect(calls[1]).toMatchObject({mode:'ai',question:'NFC',versions:['V1'],topK:5});
  await expect(page.locator('.result-context')).toContainText('AI 검색');
  await keyword.check();
  await expect(page.getByRole('heading',{name:'키워드 검색 결과',exact:true})).toBeVisible();
  await expect(page.locator('.result-context')).toContainText('이전 실행 결과');
  await ai.check();
  await expect(page.getByRole('heading',{name:'근거 기반 답변',exact:true})).toBeVisible();
  await expect(page.locator('.result-context')).toContainText('이전 실행 결과');
  expect(calls).toHaveLength(2);
  // Explicit resubmission is intentional: it must not silently reuse the cache.
  await submit.click();
  await expect(page.getByRole('heading',{name:'근거 기반 답변',exact:true})).toBeVisible();
  expect(calls).toHaveLength(3);
  await input.fill('BLE');
  await expect(page.locator('.result-block')).toHaveCount(0);
  await keyword.check();
  await expect(page.locator('.result-block')).toHaveCount(0);
  await input.fill('NFC');
  await expect(page.locator('.result-block')).toHaveCount(0);
  await submit.click();
  await expect(page.getByRole('heading',{name:'키워드 검색 결과',exact:true})).toBeVisible();
  expect(calls).toHaveLength(4);
  await page.getByRole('radio',{name:'V2',exact:true}).check();
  await page.getByRole('radio',{name:'V1',exact:true}).check();
  await expect(page.locator('.result-block')).toHaveCount(0);
  expect(calls).toHaveLength(4);
});

test('AI failure preserves evidence with a different label from intentional keyword search',async({page,request})=>{
  const actual=await (await request.post('/api/ask',{data:{question:'NFC',versions:['V1'],mode:'keyword'}})).json();
  await page.route('**/api/ask',route=>route.fulfill({json:{...actual,status:'llm_unavailable',warnings:['AI 답변 대기 시간이 초과되었습니다. 검색된 근거를 확인해주세요.']}}));
  await page.goto('/');
  await page.getByRole('radio',{name:'AI 검색',exact:true}).check();
  await page.getByRole('textbox',{name:'질문',exact:true}).fill('NFC');
  await page.getByRole('button',{name:/^근거 찾기/}).click();
  await expect(page.getByRole('heading',{name:'AI 답변을 가져오지 못했어요',exact:true})).toBeVisible();
  await expect(page.locator('.result-context')).toContainText('AI 검색');
  await expect(page.getByText(actual.sources[0].requirementId,{exact:true}).first()).toBeVisible();
  await expect(page.getByRole('heading',{name:'키워드 검색 결과',exact:true})).toHaveCount(0);
});
