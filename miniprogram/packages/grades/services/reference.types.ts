/* ============================================================
 * 参照库视图模型与常量（录取线 / 指标生对照）
 *
 * 从 reference.service 拆出，保证 service 文件单一职责且 ≤300 行（架构 C7）。
 * 仅类型与展示常量，不含业务逻辑。
 * ============================================================ */

import type { IndicatorSchool } from '../core/types';

export type Verdict = 'chong' | 'wen' | 'bao';

export const VERDICT_LABEL: Record<Verdict, string> = { chong: '冲', wen: '稳', bao: '保' };

/* -------------------- 录取线（57 校） -------------------- */

/** 录取线排序口径（UIUX §9.5）：按录取线分数 / 按录取位次 */
export type AdmissionSort = 'rank' | 'cutoff';

export interface AdmissionRow {
  seq: number;
  school: string;
  cutoffText: string;
  rankText: string;
  batch: string;
  verdict: Verdict | null;
  verdictLabel: string;
  gapText: string;
  gapDir: 'p' | 'n' | 'flat';
  /** 是否已被家长标记为目标校（回流趋势目标线，UIUX §9.6-5） */
  isTarget: boolean;
}

export interface AdmissionView {
  myRankText: string;
  hasRank: boolean;
  rows: AdmissionRow[];
  rankedCount: number;
  note: string;
}

/* -------------------- 指标生对照（150 校） -------------------- */

export interface IndicatorRow {
  seq: number;
  school: string;
  group: string;
  district: string;
  graduatesText: string;
  indicatorTotalText: string;
  topTierLabel: string;
  topCounterpart: string;
  topPlanText: string;
  topRatioText: string;
}

export type IndicatorTierKey = 'fourBig' | 'fourNew' | 'fiveSmall' | 'other';

export interface IndicatorTierView {
  key: IndicatorTierKey;
  label: string;
  counterpart: string;
  planText: string;
  ratioText: string;
  minScoreText: string;
}

export interface IndicatorGateView {
  checked: boolean;
  passed: boolean;
  messages: string[];
  bioGeoText: string;
  qualityText: string;
}

export interface IndicatorDetailView {
  school: IndicatorSchool | null;
  tiers: IndicatorTierView[];
  /** 当前选中的对口类别（校内竞争位按该类别名额计算） */
  activeTier: IndicatorTierKey;
  /** AC-26：校内竞争位（显著标注「不是全市排名」） */
  competitionRankText: string;
  competitionNote: string;
  /** 选中的对口高中名（「本校 × 某目标高中」的表达） */
  competitionTarget: string;
  competitionPlanText: string;
  gate: IndicatorGateView;
  tieNote: string;
  empty: boolean;
}

/** 四类对口的展示顺序与名称 */
export const TIER_META: { key: IndicatorTierKey; label: string }[] = [
  { key: 'fourBig', label: '四大对口' },
  { key: 'fourNew', label: '四新对口' },
  { key: 'fiveSmall', label: '五小对口' },
  { key: 'other', label: '其它对口' },
];
