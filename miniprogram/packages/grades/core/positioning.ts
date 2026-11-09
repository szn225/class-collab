/**
 * 定位编排（SPEC §9.3 / §9.4 / §6.2 DerivedSnapshot）
 *
 * 职责：按 scope 决定口径源 → 折算位次 → 映射档次 → 产出 PositioningResult / DerivedSnapshot。
 * 本文件不含阈值、系数、满分常量：全部由 Dataset 注入。
 * 铁律：校内考试 estimatedCityRank 恒为 null（不外推、不置 0，AC-03 / AC-21）。
 */

import type { Dataset, DerivedSnapshot, ExamInput, ExamScope, PositioningResult, SubjectAnalysis } from './types';
import { convertByScope } from './conversion';
import { mapTier } from './tier';
import { roundRankPct } from './rounding';

/** AC-03 校内考试引导占位文案（逐字锁定，勿改） */
export const SCHOOL_SCOPE_NOTE =
  '本次为校内考试，仅出校内位次%；如需全市位次与档次定位，请录入集团联考或全市统考成绩';

/** 折算失败提示前缀 */
export const CONVERSION_FAILED_NOTE_PREFIX = '未能折算全市位次：';

function buildNote(scope: ExamScope, reason: string | null): string | null {
  // AC-03：校内考试一律显示引导占位，不显示折算位次与档次
  if (scope === 'school') return SCHOOL_SCOPE_NOTE;
  if (reason) return CONVERSION_FAILED_NOTE_PREFIX + reason;
  return null;
}

/**
 * 单次定位：scope + 输入 + 数据集 → PositioningResult。
 * 纯函数，任何输入组合都不抛异常。
 *
 * 注意：scope 是 ExamRecord 的顶层字段（不在 ExamInput 内），必须显式传入。
 */
export function position(scope: ExamScope, input: ExamInput, dataset: Dataset): PositioningResult {
  const outcome = convertByScope(scope, input, dataset);
  const match = mapTier(dataset, outcome.cityRank);

  return {
    cityRank: outcome.cityRank,
    isApprox: outcome.isApprox,
    basis: scope,
    tier: match ? match.tier : null,
    tierIndex: match ? match.tierIndex : null,
    note: buildNote(scope, outcome.reason),
  };
}

/**
 * 分科得分率分析。
 * rate = 该科得分 ÷ 该科满分；满分缺失 / 非正数的科目跳过（不臆造 0 分）。
 * vsSchoolAvg / vsGroupAvg 需校内与集团均分数据，Dataset 未提供 → 恒为 null，由上层补齐。
 */
export function buildSubjectAnalysis(input: ExamInput): SubjectAnalysis[] {
  const scores = Array.isArray(input.subjectScores) ? input.subjectScores : [];
  const out: SubjectAnalysis[] = [];
  for (const s of scores) {
    if (!s || typeof s.subject !== 'string' || s.subject === '') continue;
    if (typeof s.full !== 'number' || !Number.isFinite(s.full) || s.full <= 0) continue;
    if (typeof s.score !== 'number' || !Number.isFinite(s.score)) continue;
    out.push({
      subject: s.subject,
      rate: roundRankPct(s.score / s.full),
      vsSchoolAvg: null,
      vsGroupAvg: null,
      attribution: null,
    });
  }
  return out;
}

/**
 * 换算结果快照（写入记录时冻结，历史结论按当时口径可复现 —— SPEC §6.3.4）。
 *
 * @param prevCityRank 上一次「可折算记录」的全市位次；用于 deltaVsPrevRank。
 *                     AC-22：校内考试不参与跨口径比较，此时应为 null。
 * @returns deltaVsPrevRank = 本次位次 − 上次位次（负数 = 进步，与 SPEC §6.2 示例一致）
 */
export function deriveSnapshot(
  scope: ExamScope,
  input: ExamInput,
  dataset: Dataset,
  prevCityRank: number | null = null,
): DerivedSnapshot {
  const outcome = convertByScope(scope, input, dataset);
  const match = mapTier(dataset, outcome.cityRank);

  // AC-21：校内考试恒 null，禁止外推、禁止置 0
  const estimatedCityRank = scope === 'school' ? null : outcome.cityRank;

  return {
    schoolPositionPct: outcome.schoolPositionPct,
    groupPositionPct: outcome.groupPositionPct,
    estimatedCityRank,
    tier: match ? match.tier : null,
    tierIndex: match ? match.tierIndex : null,
    deltaVsPrevRank:
      estimatedCityRank !== null && typeof prevCityRank === 'number' && Number.isFinite(prevCityRank)
        ? estimatedCityRank - prevCityRank
        : null,
    subjectAnalysis: buildSubjectAnalysis(input),
  };
}
