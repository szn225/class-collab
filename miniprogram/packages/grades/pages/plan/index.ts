import { scopeKey, guardAwait } from '../../utils/scope';
const { gradePage }: { gradePage: typeof Page } = require('../../../../utils/grades');
/**
 * 复盘 —— 行动清单（SPEC §7 页4 / UIUX §9.4）
 *
 * 数据来源：plan.service（STORAGE_KEYS.plans）。
 * 复盘项由「考试详情」按最低得分率科目一键生成（UIUX §9.4 空状态约定）。
 */

import { PLAN_STATUS_CLASS, PLAN_STATUS_TEXT, planService } from '../../services/plan.service';
import type { PlanItem, PlanStatus } from '../../services/plan.service';
import { today } from '../../utils/format';
import { setTabBarValue } from '../../utils/tabbar';
import { trackEvent } from '../../utils/track';

interface PlanRow extends PlanItem {
  statusText: string;
  statusClass: string;
  dueShort: string;
  dueLabel: string;
  overdue: boolean;
  dueSoon: boolean;
}

const FILTERS = [
  { value: 'all', label: '全部' },
  { value: 'todo', label: '待办' },
  { value: 'done', label: '已复检' },
];

function addDays(base: string, days: number): string {
  const d = new Date(`${base}T00:00:00`);
  d.setDate(d.getDate() + days);
  const p = (n: number) => `${n}`.padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

gradePage({
  data: {
    filter: 'all' as 'all' | 'todo' | 'done',
    filters: FILTERS,
    items: [] as PlanRow[],
    emptyTitle: '还没有复盘项',
    loading: true,
  },

  onShow() {
    setTabBarValue(this, 2);
    this.load();
  },

  async load() {
 const gradeOperationScope = scopeKey(); void gradeOperationScope;

    const now = today();
    const soon = addDays(now, 3);
    const raw = await guardAwait(planService.list(this.data.filter), gradeOperationScope);
    const items: PlanRow[] = raw.map((p) => ({
      ...p,
      statusText: PLAN_STATUS_TEXT[p.status],
      statusClass: PLAN_STATUS_CLASS[p.status],
      dueShort: p.dueDate ? p.dueDate.slice(5) : '',
      dueLabel: p.status === 'done' ? '' : ' 止',
      overdue: p.status !== 'done' && !!p.dueDate && p.dueDate < now,
      dueSoon: p.status !== 'done' && !!p.dueDate && p.dueDate >= now && p.dueDate <= soon,
    }));
    const emptyTitle =
      this.data.filter === 'todo'
        ? '没有待办的复盘项'
        : this.data.filter === 'done'
          ? '还没有已复检的复盘项'
          : '还没有复盘项';
    this.setData({ items, emptyTitle, loading: false });
  },

  onPickFilter(e: WechatMiniprogram.BaseEvent) {
    const value = String(e.currentTarget.dataset.value) as 'all' | 'todo' | 'done';
    this.setData({ filter: value }, () => this.load());
  },

  async onToggleDone(e: WechatMiniprogram.BaseEvent) {
 const gradeOperationScope = scopeKey(); void gradeOperationScope;

    const id = String(e.currentTarget.dataset.id || '');
    const item = this.data.items.find((x) => x.id === id);
    if (!item) return;
    const next: PlanStatus = item.status === 'done' ? 'todo' : 'done';
    await guardAwait(planService.updateStatus(id, next, item.result), gradeOperationScope);
    trackEvent('plan_toggled', { ok: true });
    this.load();
  },

  /** 卡片操作收敛到 ActionSheet（UIUX §9.4） */
  onLongPress(e: WechatMiniprogram.BaseEvent) {
    const id = String(e.currentTarget.dataset.id || '');
    const item = this.data.items.find((x) => x.id === id);
    if (!item) return;
    wx.showActionSheet({
      itemList: ['标记已复检', '删除这项'],
      success: async (res) => {
 const gradeOperationScope = scopeKey(); void gradeOperationScope;

        if (res.tapIndex === 0) await guardAwait(planService.updateStatus(id, 'done', '已复检'), gradeOperationScope);
        if (res.tapIndex === 1) await guardAwait(planService.remove(id), gradeOperationScope);
        this.load();
      },
    });
  },

  goRecord() {
    wx.redirectTo({ url: '/packages/grades/pages/record/index' });
  },
});
