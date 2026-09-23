import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import AxeBuilder from '@axe-core/playwright';

test('source file entry explains how to launch instead of displaying a blank page', async ({page}) => {
  await page.goto(pathToFileURL(resolve('index.html')).href);
  await expect(page.getByRole('heading', {name: '打开听雀工具'})).toBeVisible();
  await expect(page.getByText('npm run dev', {exact: true})).toBeVisible();
});

test('essential controls meet automated accessibility checks', async ({page}) => {
  await page.goto('/');
  const result = await new AxeBuilder({page}).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(result.violations.map(item => ({id: item.id, nodes: item.nodes.map(node => node.target)}))).toEqual([]);
  await page.getByLabel('pt 规则').selectOption('custom');
  await page.getByLabel('一位 pt').fill('');
  await page.getByRole('button', {name: '计算段位期望'}).click();
  await expect(page.getByRole('alert')).toBeFocused();
  await page.getByRole('button', {name: '计算段位期望'}).click();
  await expect(page.getByRole('alert')).toBeFocused();
  await page.getByRole('button', {name: '恢复默认'}).click();
  await page.getByLabel('排序').selectOption('asc');
  await page.getByRole('button', {name: /查看结局/}).first().click();
  const expanded = await new AxeBuilder({page}).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(expanded.violations.map(item => ({id: item.id, nodes: item.nodes.map(node => node.target)}))).toEqual([]);
});

test('desktop: compute, expand, paginate and export', async ({page}, info) => {
  const errors: string[] = [];
  page.on('pageerror', err => errors.push(err.message));
  await page.setViewportSize({width: 1440, height: 1000});
  await page.goto('/');
  await expect(page.getByRole('heading', {name: 'AI 牌谱复盘'})).toBeVisible();
  await expect(page.getByRole('region', {name: '五项核心能力'}).getByRole('link', {name: '前往 TingQue.ai 使用'})).toHaveCount(4);
  await page.getByRole('button', {name: /载入南4示例/}).click();
  await expect(page.getByLabel('起家东点数')).toHaveValue('45000');
  await page.getByLabel('起家东点数').fill('44000');
  await expect(page.getByRole('status')).toHaveText('输入已修改，点击计算更新结果。');
  await page.getByRole('button', {name: '计算段位期望'}).click();
  await expect(page.getByRole('status')).toHaveCount(0);
  await page.getByRole('button', {name: /查看结局/}).first().click();
  await expect(page.getByText('按当前简化规则终局')).toBeVisible();
  await page.getByRole('button', {name: '下一页'}).click();
  await expect(page.getByText('2 / 14', {exact: true})).toBeVisible();
  await page.getByLabel('结局类型').selectOption('tsumo');
  await expect(page.getByText('已筛选 36 / 160 项')).toBeVisible();
  const jsonEvent = page.waitForEvent('download');
  await page.getByRole('button', {name: '导出 JSON'}).click();
  const jsonFile = info.outputPath('analysis.json');
  await (await jsonEvent).saveAs(jsonFile);
  const payload = JSON.parse(await readFile(jsonFile, 'utf8'));
  expect(payload.request.scores[0]).toBe(44000);
  expect(payload.result.endings).toHaveLength(160);
  const csvEvent = page.waitForEvent('download');
  await page.getByRole('button', {name: '导出 CSV'}).click();
  const csvFile = info.outputPath('analysis.csv');
  await (await csvEvent).saveAs(csvFile);
  expect((await readFile(csvFile, 'utf8')).trim().split('\r\n')).toHaveLength(161);
  await page.getByRole('button', {name: '恢复默认'}).click();
  expect(errors).toEqual([]);
});

test('mobile: no page overflow, readable controls and accessible calculation', async ({page}, info) => {
  await page.setViewportSize({width: 390, height: 844});
  await page.goto('/');
  for (const width of [320, 390, 768, 1024]) {
    await page.setViewportSize({width, height: 844});
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Page width ${width}`).toBe(true);
  }
  await page.setViewportSize({width: 390, height: 844});
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('link', {name: '开始段位分析'}).click();
  await page.getByLabel('起家东点数').fill('');
  await page.getByRole('button', {name: '计算段位期望'}).click();
  await expect(page.getByRole('alert')).toContainText('起家东点数');
  await page.getByRole('button', {name: '恢复默认'}).click();
  await page.screenshot({path: info.outputPath('mobile.png'), fullPage: true});
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('standalone: file URL works offline without any network request', async ({context, page}, info) => {
  // WebKit's offline flag rejects even a plain local HTML navigation; block
  // HTTP from the start, then also enable offline mode once the file loads.
  await context.route(/^https?:/, route => route.abort('internetdisconnected'));
  if (info.project.name !== 'webkit') await context.setOffline(true);
  const external: string[] = [];
  const errors: string[] = [];
  page.on('request', request => { if (/^https?:/.test(request.url())) external.push(request.url()); });
  page.on('pageerror', err => errors.push(err.message));
  await page.goto(pathToFileURL(resolve('dist-standalone/index.html')).href);
  await context.setOffline(true);
  await expect(page.getByText('共 160 项结局')).toBeVisible();
  await page.getByLabel('pt 规则').selectOption('custom');
  await page.getByLabel('四位 pt').fill('-105');
  await page.getByRole('button', {name: '计算段位期望'}).click();
  await expect(page.locator('.ev-number').first()).toContainText('+0.00');
  const event = page.waitForEvent('download');
  await page.getByRole('button', {name: '导出 JSON'}).click();
  const out = info.outputPath('offline.json');
  await (await event).saveAs(out);
  expect(JSON.parse(await readFile(out, 'utf8')).result.endings).toHaveLength(160);
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});
