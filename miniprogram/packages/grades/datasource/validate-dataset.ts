/**
 * 数据集校验（SPEC §6.3.3 / AC-30 / AC-31）
 *
 * 用途：importDataset 落盘前的「整包校验」。任一字段非法 → 返回全部问题，导入方据此整体回滚。
 * 纯函数：不碰存储、不抛异常，可在 node 下直接单测。
 */

import type {
  AdmissionLine,
  Dataset,
  GroupTier,
  IndicatorSchool,
  IndicatorTotals,
  RankKind,
  RulePoint,
} from '../core/types';
import { validateTierThresholds } from '../core/tier';

export interface DatasetIssue {
  /** 字段路径，如 tierThresholds / admissionLines[3].cityRank */
  field: string;
  message: string;
}

export type DatasetValidation =
  | { ok: true; value: Dataset }
  | { ok: false; issues: DatasetIssue[] };

const RANK_KINDS: RankKind[] = ['exact', 'before', 'percentile', 'unknown'];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || isFiniteNumber(value);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function isNumberRecord(value: unknown, positiveOnly: boolean): value is Record<string, number> {
  if (!isPlainObject(value)) return false;
  return Object.values(value).every((v) => isFiniteNumber(v) && (!positiveOnly || v > 0));
}

/** 必填的顶层字段类型表：字段名 → 校验函数 */
const REQUIRED_SCALARS: { field: string; message: string; check: (v: unknown) => boolean }[] = [
  { field: 'dataVersion', message: 'dataVersion 必须是非空字符串', check: isNonEmptyString },
  { field: 'region', message: 'region 必须是非空字符串', check: isNonEmptyString },
  { field: 'effectiveFrom', message: 'effectiveFrom 必须是非空字符串（如 2026-07）', check: isNonEmptyString },
  { field: 'effectiveTo', message: 'effectiveTo 必须是字符串或 null', check: isNullableString },
  { field: 'note', message: 'note 必须是字符串', check: (v) => typeof v === 'string' },
  { field: 'sourceNote', message: 'sourceNote 必须是字符串', check: (v) => typeof v === 'string' },
  { field: 'disclaimer', message: 'disclaimer 必须是非空字符串（合规红线，不可缺）', check: isNonEmptyString },
  {
    field: 'examTotalScore',
    message: 'examTotalScore 必须是正数',
    check: (v) => isFiniteNumber(v) && v > 0,
  },
  {
    field: 'sportsScore',
    message: 'sportsScore 必须是 0 或正数',
    check: (v) => isFiniteNumber(v) && v >= 0,
  },
  {
    field: 'surveySubjects',
    message: 'surveySubjects 必须是字符串数组',
    check: (v) => Array.isArray(v) && v.every((s) => typeof s === 'string'),
  },
  {
    field: 'countedSubjects',
    message: 'countedSubjects 必须是字符串数组',
    check: (v) => Array.isArray(v) && v.every((s) => typeof s === 'string'),
  },
  {
    field: 'groupCoeffs',
    message: 'groupCoeffs 必须是「集团名 → 正数系数」映射',
    check: (v) => isNumberRecord(v, true),
  },
  {
    field: 'groupSizes',
    message: 'groupSizes 必须是「集团名 → 正数人数」映射',
    check: (v) => isNumberRecord(v, true),
  },
];

function checkControlLines(value: unknown, issues: DatasetIssue[]): void {
  if (!isPlainObject(value)) {
    issues.push({ field: 'controlLines', message: 'controlLines 必须是对象' });
    return;
  }
  for (const key of ['tier1', 'tier2', 'tier3']) {
    if (!isFiniteNumber(value[key]) || (value[key] as number) <= 0) {
      issues.push({ field: `controlLines.${key}`, message: `controlLines.${key} 必须是正数` });
    }
  }
}

function checkGroupTiers(value: unknown, issues: DatasetIssue[]): GroupTier[] {
  if (!Array.isArray(value)) {
    issues.push({ field: 'groupTiers', message: 'groupTiers 必须是数组' });
    return [];
  }
  const out: GroupTier[] = [];
  value.forEach((raw, i) => {
    if (!isPlainObject(raw)) {
      issues.push({ field: `groupTiers[${i}]`, message: '必须是对象' });
      return;
    }
    if (!isNonEmptyString(raw.groupRankLabel) || !isNonEmptyString(raw.cityRankLabel) || !isNonEmptyString(raw.tier)) {
      issues.push({
        field: `groupTiers[${i}]`,
        message: 'groupRankLabel / cityRankLabel / tier 必须是非空字符串',
      });
      return;
    }
    out.push({ groupRankLabel: raw.groupRankLabel, cityRankLabel: raw.cityRankLabel, tier: raw.tier });
  });
  return out;
}

function checkAdmissionLines(value: unknown, issues: DatasetIssue[]): AdmissionLine[] {
  if (!Array.isArray(value)) {
    issues.push({ field: 'admissionLines', message: 'admissionLines 必须是数组' });
    return [];
  }
  const out: AdmissionLine[] = [];
  value.forEach((raw, i) => {
    if (!isPlainObject(raw)) {
      issues.push({ field: `admissionLines[${i}]`, message: '必须是对象' });
      return;
    }
    const bad: string[] = [];
    if (!isFiniteNumber(raw.seq)) bad.push('seq');
    if (!isNonEmptyString(raw.school)) bad.push('school');
    if (!isNullableNumber(raw.plan)) bad.push('plan');
    if (!isNullableNumber(raw.cutoff)) bad.push('cutoff');
    if (!isNullableNumber(raw.cityRank)) bad.push('cityRank');
    if (typeof raw.rankKind !== 'string' || !RANK_KINDS.includes(raw.rankKind as RankKind)) bad.push('rankKind');
    if (typeof raw.rankRaw !== 'string') bad.push('rankRaw');
    if (typeof raw.rankNote !== 'string') bad.push('rankNote');
    if (!isNullableNumber(raw.langMathEngTotal)) bad.push('langMathEngTotal');
    if (!isNullableString(raw.batch)) bad.push('batch');
    if (bad.length > 0) {
      issues.push({ field: `admissionLines[${i}]`, message: `字段缺失或类型错误：${bad.join(' / ')}` });
      return;
    }
    out.push(raw as unknown as AdmissionLine);
  });
  return out;
}

function checkIndicatorTiers(value: unknown): boolean {
  if (!isPlainObject(value)) return false;
  for (const key of ['fourBig', 'fourNew', 'fiveSmall', 'other']) {
    const tier = value[key];
    if (!isPlainObject(tier)) return false;
    if (!isNullableString(tier.counterpart)) return false;
    if (!isNullableNumber(tier.plan)) return false;
    if (!isNullableNumber(tier.fillRatio)) return false;
    if (!isNullableNumber(tier.minScore)) return false;
  }
  return true;
}

function checkIndicatorSchools(value: unknown, issues: DatasetIssue[]): IndicatorSchool[] {
  if (!Array.isArray(value)) {
    issues.push({ field: 'indicatorSchools', message: 'indicatorSchools 必须是数组' });
    return [];
  }
  const out: IndicatorSchool[] = [];
  value.forEach((raw, i) => {
    if (!isPlainObject(raw)) {
      issues.push({ field: `indicatorSchools[${i}]`, message: '必须是对象' });
      return;
    }
    const bad: string[] = [];
    if (!isFiniteNumber(raw.seq)) bad.push('seq');
    if (!isNonEmptyString(raw.group)) bad.push('group');
    if (!isNonEmptyString(raw.school)) bad.push('school');
    if (!isNullableString(raw.district)) bad.push('district');
    if (!isNullableNumber(raw.graduates)) bad.push('graduates');
    if (!isNullableNumber(raw.indicatorTotal)) bad.push('indicatorTotal');
    if (!checkIndicatorTiers(raw.tiers)) bad.push('tiers(fourBig/fourNew/fiveSmall/other)');
    if (bad.length > 0) {
      issues.push({ field: `indicatorSchools[${i}]`, message: `字段缺失或类型错误：${bad.join(' / ')}` });
      return;
    }
    out.push(raw as unknown as IndicatorSchool);
  });
  return out;
}

function checkIndicatorTotals(value: unknown, issues: DatasetIssue[]): IndicatorTotals | null {
  if (!isPlainObject(value)) {
    issues.push({ field: 'indicatorTotals', message: 'indicatorTotals 必须是对象' });
    return null;
  }
  for (const key of ['graduates', 'indicatorPlan', 'admitted', 'completionRate']) {
    if (!isFiniteNumber(value[key])) {
      issues.push({ field: `indicatorTotals.${key}`, message: '必须是非负数字' });
    }
  }
  const planByTier = value.planByTier;
  if (!isPlainObject(planByTier)) {
    issues.push({ field: 'indicatorTotals.planByTier', message: 'planByTier 必须是对象' });
  } else {
    for (const key of ['fourBig', 'fourNew', 'fiveSmall', 'other']) {
      if (!isFiniteNumber(planByTier[key])) {
        issues.push({ field: `indicatorTotals.planByTier.${key}`, message: '必须是数字' });
      }
    }
  }
  return value as unknown as IndicatorTotals;
}

function checkRulePoints(value: unknown, issues: DatasetIssue[]): RulePoint[] {
  if (!Array.isArray(value)) {
    issues.push({ field: 'rulePoints', message: 'rulePoints 必须是数组' });
    return [];
  }
  const out: RulePoint[] = [];
  value.forEach((raw, i) => {
    if (!isPlainObject(raw) || !isNonEmptyString(raw.title) || !isNonEmptyString(raw.detail)) {
      issues.push({ field: `rulePoints[${i}]`, message: 'title / detail 必须是非空字符串' });
      return;
    }
    out.push({ title: raw.title, detail: raw.detail });
  });
  return out;
}

/**
 * 校验一份数据集（unknown 输入，来自用户导入的 JSON）。
 * 全部通过才返回 ok:true（整包校验通过才落盘 —— SPEC §6.3.5 原子语义）。
 */
export function validateDataset(json: unknown): DatasetValidation {
  const issues: DatasetIssue[] = [];

  if (!isPlainObject(json)) {
    return { ok: false, issues: [{ field: '$', message: '数据集必须是一个 JSON 对象' }] };
  }

  for (const rule of REQUIRED_SCALARS) {
    if (!rule.check(json[rule.field])) {
      issues.push({ field: rule.field, message: rule.message });
    }
  }

  // §6.3.3：tierThresholds 必须单调递增
  const thresholds = validateTierThresholds(json.tierThresholds);
  if (!thresholds.ok) {
    issues.push({ field: 'tierThresholds', message: thresholds.message });
  }

  checkControlLines(json.controlLines, issues);

  const groupTiers = checkGroupTiers(json.groupTiers, issues);
  const admissionLines = checkAdmissionLines(json.admissionLines, issues);
  const indicatorSchools = checkIndicatorSchools(json.indicatorSchools, issues);
  const indicatorTotals = checkIndicatorTotals(json.indicatorTotals, issues);
  const rulePoints = checkRulePoints(json.rulePoints, issues);

  if (issues.length > 0) return { ok: false, issues };

  const value: Dataset = {
    dataVersion: json.dataVersion as string,
    region: json.region as string,
    effectiveFrom: json.effectiveFrom as string,
    effectiveTo: json.effectiveTo as string | null,
    note: json.note as string,
    sourceNote: json.sourceNote as string,
    disclaimer: json.disclaimer as string,
    examTotalScore: json.examTotalScore as number,
    sportsScore: json.sportsScore as number,
    surveySubjects: json.surveySubjects as string[],
    countedSubjects: json.countedSubjects as string[],
    tierThresholds: thresholds.ok ? thresholds.thresholds : [],
    controlLines: json.controlLines as Dataset['controlLines'],
    groupCoeffs: json.groupCoeffs as Record<string, number>,
    groupSizes: json.groupSizes as Record<string, number>,
    groupTiers,
    admissionLines,
    indicatorSchools,
    indicatorTotals: indicatorTotals as IndicatorTotals,
    rulePoints,
  };

  return { ok: true, value };
}

/** 生成人类可读的校验失败摘要（UI 提示用） */
export function formatDatasetIssues(issues: DatasetIssue[], limit = 5): string {
  const head = issues.slice(0, limit).map((i) => `${i.field}：${i.message}`);
  const rest = issues.length > limit ? `（另有 ${issues.length - limit} 项问题）` : '';
  return head.join('；') + rest;
}
