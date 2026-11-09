/**
 * 展示层格式化工具（纯函数，无副作用）
 * 只做「值 → 字符串」的转换，不含业务判断。
 */

/** 5321 → "5,321" */
export function formatRank(n: number | null | undefined): string {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '—';
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** 0.0613 → "6.1%"（位次% 一律保留 1 位小数） */
export function formatPct(rate: number | null | undefined, digits = 1): string {
  if (typeof rate !== 'number' || !Number.isFinite(rate)) return '—';
  return `${(rate * 100).toFixed(digits)}%`;
}

/** 0.85 → "85%"（得分率取整） */
export function formatScoreRate(rate: number | null | undefined): string {
  if (typeof rate !== 'number' || !Number.isFinite(rate)) return '—';
  return `${Math.round(rate * 100)}%`;
}

/** 差值：+8.0 / −4.0 */
export function formatDiff(v: number | null | undefined, digits = 1): string {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '—';
  const sign = v > 0 ? '+' : v < 0 ? '−' : '';
  return `${sign}${Math.abs(v).toFixed(digits)}`;
}

export interface DeltaView {
  /** 进步(位次下降) = up；退步(位次上升) = down；无变化/无参照 = flat */
  dir: 'up' | 'down' | 'flat';
  /** 箭头图标名（TDesign Icons）：进步指向下、退步指向上 —— 与「位次越小越好」一致 */
  icon: string;
  /** 文字主通道，如 "进步 1,204 位" */
  text: string;
  /** 语义色后缀，配合 .chip 使用：chip up / chip down / chip flat */
  chipClass: 'up' | 'down' | 'flat';
}

/**
 * 反向指标：位次 delta 的方向呈现（三重保险之「箭头 + 文字」通道）。
 * delta = 本次位次 − 上次位次；为负表示位次变小 = 进步。
 */
export function formatRankDelta(delta: number | null | undefined): DeltaView {
  if (typeof delta !== 'number' || !Number.isFinite(delta) || delta === 0) {
    return { dir: 'flat', icon: 'minus', text: '与上次持平', chipClass: 'flat' };
  }
  if (delta < 0) {
    return {
      dir: 'up',
      icon: 'arrow-down',
      text: `进步 ${formatRank(Math.abs(delta))} 位`,
      chipClass: 'up',
    };
  }
  return {
    dir: 'down',
    icon: 'arrow-up',
    text: `退步 ${formatRank(delta)} 位`,
    chipClass: 'down',
  };
}

/** "2026-04-18" → "4月18日" */
export function formatDateCn(date: string | null | undefined): string {
  if (!date || typeof date !== 'string') return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return date;
  return `${Number(m[2])}月${Number(m[3])}日`;
}

/** "2026-04-18" → "4月" */
export function formatMonthCn(date: string | null | undefined): string {
  if (!date || typeof date !== 'string') return '';
  const m = /^(\d{4})-(\d{2})/.exec(date);
  return m ? `${Number(m[2])}月` : '';
}

/** 今天 YYYY-MM-DD */
export function today(now: Date = new Date()): string {
  const p = (n: number) => `${n}`.padStart(2, '0');
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

/** 导出文件名：备份-2026-10-15.json */
export function backupFileName(now: Date = new Date()): string {
  return `备份-${today(now)}.json`;
}

/** 口径标签 */
export function scopeLabel(scope: string): string {
  if (scope === 'city') return '全市统考';
  if (scope === 'group') return '集团联考';
  return '校内考试';
}
