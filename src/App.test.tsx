import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import App from './App';

it('presents five functional entries with explicit destinations', () => {
  render(<App />);
  const grid = screen.getByRole('region', {name: '五项核心能力'});
  expect(within(grid).getAllByRole('article')).toHaveLength(5);
  const urls = within(grid).getAllByRole('link').map(link => link.getAttribute('href'));
  expect(urls).toEqual(['https://tingque.ai/order/url', '#rank-analyzer', 'https://tingque.ai/order/sim', 'https://tingque.ai/order/reverse', 'https://tingque.ai/order/room']);
});
it('handles editing, invalid input, re-analysis, filters and reset', async () => {
  const user = userEvent.setup();
  render(<App />);
  expect(screen.getByText('共 160 项结局')).toBeInTheDocument();
  const score = screen.getByLabelText('起家东点数');
  await user.clear(score);
  await user.click(screen.getByRole('button', {name: '计算段位期望'}));
  expect(screen.getByRole('alert')).toHaveTextContent('起家东点数');
  await user.type(score, '35000');
  await user.click(screen.getByRole('button', {name: '计算段位期望'}));
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.queryByText('输入已修改，点击计算更新结果。')).not.toBeInTheDocument();
  await user.selectOptions(screen.getByLabelText('结局类型'), 'ryuukyoku');
  expect(screen.getByText('已筛选 16 / 160 项')).toBeInTheDocument();
  await user.click(screen.getByRole('button', {name: '恢复默认'}));
  expect(score).toHaveValue(25000);
});
it('computes a custom pt table and exposes terminal details', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.selectOptions(screen.getByLabelText('pt 规则'), 'custom');
  const fourth = screen.getByLabelText('四位 pt');
  await user.clear(fourth);
  await user.type(fourth, '-105');
  await user.selectOptions(screen.getByLabelText('场局'), '11');
  await user.click(screen.getByRole('button', {name: '计算段位期望'}));
  expect(screen.getAllByText('+0.00').length).toBeGreaterThanOrEqual(4);
  await user.click(screen.getAllByRole('button', {name: /查看结局/})[0]);
  expect(screen.getByText(/按当前简化规则终局/)).toBeInTheDocument();
});
