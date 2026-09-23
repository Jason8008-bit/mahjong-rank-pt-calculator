import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = new URL('..', import.meta.url);
process.chdir(fileURLToPath(root));
function walk(directory) {
  return readdirSync(directory, {withFileTypes: true}).flatMap(entry => {
    const path = `${directory}/${entry.name}`;
    return entry.isDirectory() ? walk(path) : [path];
  });
}
const readmes = ['README.md', 'README.zh-TW.md', 'README.en.md'];
const guides = ['docs/usage.md', 'docs/usage.zh-TW.md', 'docs/usage.en.md'];
const files = [...readmes, ...guides, 'index.html', 'docs/algorithm.md', 'docs/screenshots.md', 'CONTRIBUTING.md', 'CHANGELOG.md',
  ...walk('src').filter(path => /\.(tsx|ts)$/.test(path) && !path.includes('.test.') && !path.includes('/test/'))];
const forbidden = /注册|登录|登陆|免费|付费|收费|订阅|试用|充值|价格|註冊|登錄|登入|免費|付費|收費|訂閱|試用|儲值|價格|ログイン|サインアップ|アカウント|無料|有料|課金|料金|お試し|\b(?:register|registration|login|log\s+in|sign\s+up|account|pricing|billing|subscription|free|paid|trial)\b/iu;
const errors = [];
for (const path of files) {
  const content = readFileSync(path, 'utf8');
  const match = content.match(forbidden);
  if (match) errors.push(`${path}: excluded public-copy term ${match[0]}`);
}
const names = [
  ['AI 牌谱复盘', '段位分析', '第一打模拟', '局面逆推', 'AI 陪练'],
  ['AI 牌譜復盤', '段位分析', '第一打模擬', '局面逆推', 'AI 陪練'],
  ['AI replay review', 'Rank analysis', 'First-discard simulation', 'Hand inference', 'AI practice'],
];
readmes.forEach((path, index) => {
  const content = readFileSync(path, 'utf8');
  for (const text of [...names[index], ...readmes, 'docs/images/tingque-replay.jpg', 'docs/images/tingque-replay-analysis.jpg',
    'docs/images/tingque-rank-analysis.jpg', guides[index], 'https://tingque.ai/', '160', 'MIT']) {
    if (!content.includes(text)) errors.push(`${path}: missing required information ${text}`);
  }
});
for (const path of guides) {
  const content = readFileSync(path, 'utf8');
  for (const text of ['npm ci', 'npm run dev', 'npm run build', 'npm run build:standalone', 'npm run verify',
    'npm run test:browser', 'rankpt analyze examples/request.json', 'from rankpt import analyze', '1e-12', '160', 'MIT']) {
    if (!content.includes(text)) errors.push(`${path}: missing required information ${text}`);
  }
}
for (const path of [...readmes, ...guides, 'docs/algorithm.md', 'docs/screenshots.md', 'CONTRIBUTING.md', 'CHANGELOG.md']) {
  for (const match of readFileSync(path, 'utf8').matchAll(/\]\(([^)]+)\)/g)) {
    const target = match[1];
    if (!/^(https?:|#)/.test(target) && !existsSync(resolve(dirname(path), target.split('#')[0]))) errors.push(`${path}: broken file link ${target}`);
  }
}
if (errors.length) throw new Error(errors.join('\n'));
console.log(`Public-copy PASS: ${files.length} files; three README editions, usage guides and relative links checked.`);
