const { storage: gradeStorage } = require('../../../utils/grades');
/**
 * plan.service —— 复盘行动编排（SPEC §7 页4 / UIUX §9.4）
 *
 * 存储：STORAGE_KEYS.plans（SPEC §6.1 备份键之一）。
 * 说明：DataSource 接口（core/types.ts，冻结）未定义复盘读写，故本域由 services 承担；
 *       键名严格取自 STORAGE_KEYS，保证与备份范围一致。
 */

import { STORAGE_KEYS } from '../core/types';

export type PlanStatus = 'todo' | 'doing' | 'done';

export interface PlanItem {
  id: string;
  /** 改进动作（标题） */
  title: string;
  /** 关联：科目 */
  subject: string;
  /** 关联：知识点 / 失分点 */
  knowledge: string;
  /** 责任人：孩子 / 家长 */
  owner: string;
  /** YYYY-MM-DD */
  dueDate: string;
  status: PlanStatus;
  /** 复检结果，如「复检 +8 分」 */
  result: string;
  /** 来源考试 id */
  examId: string;
  createdAt: string;
}

export const PLAN_STATUS_TEXT: Record<PlanStatus, string> = {
  todo: '待处理',
  doing: '进行中',
  done: '已复检',
};

export const PLAN_STATUS_CLASS: Record<PlanStatus, string> = {
  todo: 'muted',
  doing: 'doing',
  done: 'done',
};

function read(): PlanItem[] {
  try {
    const raw = gradeStorage.getStorageSync(STORAGE_KEYS.plans);
    return Array.isArray(raw) ? (raw as PlanItem[]) : [];
  } catch (e) {
    return [];
  }
}

function write(list: PlanItem[]): void {
  gradeStorage.setStorageSync(STORAGE_KEYS.plans, list);
}

class PlanService {
  async list(filter: 'all' | 'todo' | 'done' = 'all'): Promise<PlanItem[]> {
    const list = read().slice();
    // 时限临近/超期优先，其次按创建时间倒序
    list.sort((a, b) => (a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0));
    if (filter === 'todo') return list.filter((p) => p.status !== 'done');
    if (filter === 'done') return list.filter((p) => p.status === 'done');
    return list;
  }

  async add(item: Omit<PlanItem, 'id' | 'createdAt'>): Promise<PlanItem> {
    const next: PlanItem = {
      ...item,
      id: `plan_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };
    const list = read();
    list.push(next);
    write(list);
    return next;
  }

  async updateStatus(id: string, status: PlanStatus, result = ''): Promise<void> {
    const list = read();
    const idx = list.findIndex((p) => p.id === id);
    if (idx < 0) return;
    list[idx] = { ...list[idx], status, result: result || list[idx].result };
    write(list);
  }

  async remove(id: string): Promise<void> {
    write(read().filter((p) => p.id !== id));
  }
}

export const planService = new PlanService();
