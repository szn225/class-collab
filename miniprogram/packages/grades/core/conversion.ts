/**
 * 位次折算（SPEC §9.3 / AC-14 / AC-15 / AC-17）
 *
 * 口径源由 scope 决定，互不叠加：
 *   city   → 直接采用官方全市位次，**不叠加任何集团系数**（AC-15）
 *   group  → 集团排名 × 集团系数 → 折算全市位次（约）（AC-14）
 *   school → 不外推全市位次，只出校内位次%（AC-03 / AC-17）
 *
 * 铁律：集团系数一律从 Dataset 注入，本文件零魔法数字；
 *       折算不出结果时返回 null + reason，**绝不返回 0**。
 */

import type { Dataset, ExamInput, ExamScope } from './types';
import { floorRank, isPositiveCount, isPositiveRank, roundRankPct } from './rounding';

export interface ConversionOutcome {
  /** 采用的全市位次（集团折算值 / 官方值）；校内考试或无法折算时为 null */
  cityRank: number | null;
  /** 是否为折算约数（集团联考 true，统考 false）—— UI 据此显示「（约）」 */
  isApprox: boolean;
  /** 校内位次% = 校排名 ÷ 校总人数（AC-17），无法计算为 null */
  schoolPositionPct: number | null;
  /** 集团位次% = 集团排名 ÷ 集团总人数，无法计算为 null */
  groupPositionPct: number | null;
  /** 未能折算的原因（仅用于 UI 提示），成功或无此概念时为 null */
  reason: string | null;
}

/** 从数据集取出集团系数；集团未收录或系数非法时返回 null（不静默按 1 折算） */
export function getGroupCoeff(dataset: Dataset, groupName: string | null | undefined): number | null {
  if (!groupName) return null;
  const coeff = dataset.groupCoeffs[groupName];
  return typeof coeff === 'number' && Number.isFinite(coeff) && coeff > 0 ? coeff : null;
}

/** 从数据集取出集团总人数（默认分母）；未收录返回 null */
export function getGroupSize(dataset: Dataset, groupName: string | null | undefined): number | null {
  if (!groupName) return null;
  const size = dataset.groupSizes[groupName];
  return isPositiveCount(size) ? size : null;
}

/**
 * 集团排名 × 集团系数 → 折算全市位次（约）。
 * 取整口径：向下取整，理由见 core/rounding.ts 文件头。
 */
export function convertGroupRankToCityRank(groupRank: number, coeff: number): number {
  return floorRank(groupRank * coeff);
}

/** 位次% = 排名 ÷ 总人数，四舍五入保留 4 位小数（断言 c：38 / 620 → 0.0613） */
export function rankPercent(
  rank: number | null | undefined,
  size: number | null | undefined,
): number | null {
  if (!isPositiveCount(size) || typeof rank !== 'number' || !Number.isFinite(rank) || rank < 0) {
    return null;
  }
  return roundRankPct(rank / size);
}

/**
 * 按 scope 决定口径源，产出折算结果（不含档次映射——那是 core/tier.ts 的职责）。
 *
 * 注意：scope 不在 ExamInput 内（它是 ExamRecord 的顶层字段，见 core/types.ts），
 * 故必须由调用方显式传入，避免「输入体里偷偷塞一个 scope」破坏冻结契型。
 *
 * 纯函数：任何输入组合都不抛异常，无法折算时返回 cityRank=null + reason。
 */
export function convertByScope(scope: ExamScope, input: ExamInput, dataset: Dataset): ConversionOutcome {
  const schoolPositionPct = rankPercent(input.schoolRank, input.schoolSize);
  const groupSize = isPositiveCount(input.groupSize)
    ? input.groupSize
    : getGroupSize(dataset, input.groupName);
  const groupPositionPct = rankPercent(input.groupRank, groupSize);

  switch (scope) {
    case 'city': {
      // AC-15：统考直接采用官方位次，不叠加系数
      const cityRank = isPositiveRank(input.cityRank) ? input.cityRank : null;
      return {
        cityRank,
        isApprox: false,
        schoolPositionPct,
        groupPositionPct,
        reason: cityRank === null ? '缺少官方全市位次' : null,
      };
    }

    case 'group': {
      // AC-14：集团排名 × 集团系数
      if (!isPositiveRank(input.groupRank)) {
        return {
          cityRank: null,
          isApprox: false,
          schoolPositionPct,
          groupPositionPct,
          reason: '缺少集团排名',
        };
      }
      const coeff = getGroupCoeff(dataset, input.groupName);
      if (coeff === null) {
        return {
          cityRank: null,
          isApprox: false,
          schoolPositionPct,
          groupPositionPct,
          reason: `集团「${input.groupName ?? '未填写'}」不在系数表中，无法折算`,
        };
      }
      return {
        cityRank: convertGroupRankToCityRank(input.groupRank, coeff),
        isApprox: true,
        schoolPositionPct,
        groupPositionPct,
        reason: null,
      };
    }

    case 'school':
    default: {
      // AC-03 / AC-21：校内考试不外推全市位次，恒为 null（禁止置 0）
      return {
        cityRank: null,
        isApprox: false,
        schoolPositionPct,
        groupPositionPct,
        reason: null,
      };
    }
  }
}
