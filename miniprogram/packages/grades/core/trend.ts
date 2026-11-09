/**
 * 趋势序列（SPEC §9.4 —— 跨口径隔离，最关键的一条）
 *
 * 铁律（AC-19 / AC-20 / AC-21）：
 *   1) 校内考试无折算全市位次 → 该点 estimatedCityRank 恒为 null、hollow=true，
 *      **禁止置 0**（置 0 会产生「进步到第 0 名」的假点并误连折线）。
 *   2) 空点不参与 Y 轴映射（不落任何 Y 值）—— rankRange 只统计可连线的实心点。
 *   3) 空点处折线断开，不跨口径连线（segments 分段）。
 *   4) 不得因「无折算位次」而隐藏该次考试：空点仍保留在 points 中。
 *
 * 本文件只做序列编排，不含任何阈值/系数：数据来自记录自身的 derivedSnapshot（写入时冻结的口径）。
 */

import type { ExamRecord } from './types';

/** AC-19 要求的图例文案（逐字锁定） */
export const HOLLOW_POINT_LEGEND = '空心点 = 校内考试，无折算全市位次';

export interface TrendPoint {
  recordId: string;
  examName: string;
  /** YYYY-MM-DD */
  examDate: string;
  /** 折算/采用后的全市位次；空点为 null（禁止置 0） */
  estimatedCityRank: number | null;
  /** 空心点：无折算全市位次，不落 Y 值、不连线 */
  hollow: boolean;
  /** 可连线（estimatedCityRank 为有效数字） */
  connectable: boolean;
  /** 写入时冻结的档次标签 */
  tier: string | null;
  /** 校内考试才有：位次%（空点时的唯一可比口径，AC-22 校内之间比位次%） */
  schoolPositionPct: number | null;
}

export interface TrendSeries {
  /** 全部点，按考试日期升序（含空点，不隐藏任何一次考试） */
  points: TrendPoint[];
  /** 实线分段：每段是 points 的下标数组，段内相邻两点可连线；空点处断开 */
  segments: number[][];
  /** 可连线点总数 */
  connectableCount: number;
  /** 空心点总数 */
  hollowCount: number;
  /** AC-18：存在某段 ≥2 个可连线点时才展示折线 */
  canRenderLine: boolean;
  /** 仅由可连线点决定的 Y 轴值域；无任何可连线点为 null（空点不参与） */
  rankRange: { min: number; max: number } | null;
  legend: string;
}

function toPoint(record: ExamRecord): TrendPoint {
  const rank = record.derivedSnapshot ? record.derivedSnapshot.estimatedCityRank : null;
  const connectable = typeof rank === 'number' && Number.isFinite(rank);
  return {
    recordId: record.id,
    examName: record.examName,
    examDate: record.examDate,
    // 空点恒为 null —— 绝不兜底为 0
    estimatedCityRank: connectable ? rank : null,
    hollow: !connectable,
    connectable,
    tier: record.derivedSnapshot ? record.derivedSnapshot.tier : null,
    schoolPositionPct: record.derivedSnapshot ? record.derivedSnapshot.schoolPositionPct : null,
  };
}

/**
 * 由考试记录构建折线序列。
 * 排序：examDate 升序；同日保持传入顺序（Array.prototype.sort 在 ES2019+ 稳定）。
 */
export function buildTrend(records: ExamRecord[]): TrendSeries {
  const list = Array.isArray(records) ? records.slice() : [];
  list.sort((a, b) => (a.examDate < b.examDate ? -1 : a.examDate > b.examDate ? 1 : 0));

  const points = list.map(toPoint);

  // 连续可连线点分段：遇到空点即断开（AC-20），保证不跨口径连线
  const segments: number[][] = [];
  let current: number[] = [];
  for (let i = 0; i < points.length; i += 1) {
    if (points[i].connectable) {
      current.push(i);
    } else if (current.length > 0) {
      segments.push(current);
      current = [];
    }
  }
  if (current.length > 0) segments.push(current);

  const connectable = points.filter((p) => p.connectable);
  const rankRange =
    connectable.length > 0
      ? {
          min: Math.min(...connectable.map((p) => p.estimatedCityRank as number)),
          max: Math.max(...connectable.map((p) => p.estimatedCityRank as number)),
        }
      : null;

  return {
    points,
    segments,
    connectableCount: connectable.length,
    hollowCount: points.length - connectable.length,
    canRenderLine: segments.some((seg) => seg.length >= 2),
    rankRange,
    legend: HOLLOW_POINT_LEGEND,
  };
}
