/**
 * 8 档阈值映射（SPEC §2 F1 / AC-16 / §10 边界值）
 *
 * 规则：cityRank <= upTo 时归入本档；upTo 为 null 为兜底档（普高线附近）。
 * 闭区间归更优档 —— 恰好等于阈值时归入该档（断言 d：4212 → 四大本部）。
 *
 * 阈值一律从 Dataset 注入（dataset.tierThresholds），本文件零魔法数字。
 * 禁止使用源表⑤ groupTiers 的「对应高中层次」文字参与档次映射
 * （该文字把麓山国际 / 南雅并入四大新校区层，与 8 档口径不一致，仅作参照展示）。
 */

import type { Dataset, TierThreshold } from './types';

export interface TierMatch {
  /** 档次名称，如「四大本部」 */
  tier: string;
  /** 档位下标，0 为最优档（四大本部） */
  tierIndex: number;
}

/**
 * 位次 → 档次。
 * @param cityRank 全市位次；null / 非法值返回 null（校内考试无档次，AC-03）
 */
export function mapTier(dataset: Dataset, cityRank: number | null | undefined): TierMatch | null {
  if (typeof cityRank !== 'number' || !Number.isFinite(cityRank)) return null;
  const thresholds = dataset.tierThresholds;
  if (!Array.isArray(thresholds)) return null;

  for (let i = 0; i < thresholds.length; i += 1) {
    const t = thresholds[i];
    if (!t) continue;
    // 兜底档：upTo 为 null 表示「其余全部」
    if (t.upTo === null) return { tier: t.tier, tierIndex: i };
    // 闭区间：恰好等于阈值也归入本档（更优档）
    if (cityRank <= t.upTo) return { tier: t.tier, tierIndex: i };
  }
  // 无兜底档且位次超出所有阈值 —— 不猜档，返回 null
  return null;
}

export interface TierThresholdValidationOk {
  ok: true;
  thresholds: TierThreshold[];
}
export interface TierThresholdValidationFail {
  ok: false;
  message: string;
}
export type TierThresholdValidation = TierThresholdValidationOk | TierThresholdValidationFail;

/**
 * 校验 tierThresholds（SPEC §6.3.3「tierThresholds 单调递增」）。
 * 规则：非空数组；每项 { upTo: number|null, tier: 非空字符串 }；
 *       非 null 的 upTo 严格递增；null 兜底档只允许出现在末位。
 */
export function validateTierThresholds(value: unknown): TierThresholdValidation {
  if (!Array.isArray(value)) {
    return { ok: false, message: 'tierThresholds 必须是数组' };
  }
  if (value.length === 0) {
    return { ok: false, message: 'tierThresholds 不能为空数组' };
  }

  const thresholds: TierThreshold[] = [];
  let lastUpTo = -Infinity;

  for (let i = 0; i < value.length; i += 1) {
    const raw = value[i] as Record<string, unknown> | null | undefined;
    if (!raw || typeof raw !== 'object') {
      return { ok: false, message: `tierThresholds[${i}] 必须是对象` };
    }
    if (typeof raw.tier !== 'string' || raw.tier.trim() === '') {
      return { ok: false, message: `tierThresholds[${i}].tier 必须是非空字符串` };
    }
    const upTo = raw.upTo;
    if (upTo !== null && !(typeof upTo === 'number' && Number.isFinite(upTo))) {
      return { ok: false, message: `tierThresholds[${i}].upTo 必须是数字或 null` };
    }
    if (upTo === null) {
      if (i !== value.length - 1) {
        return { ok: false, message: `tierThresholds[${i}] 兜底档（upTo=null）只能出现在末位` };
      }
    } else {
      if (upTo <= lastUpTo) {
        return {
          ok: false,
          message: `tierThresholds 必须单调递增：第 ${i} 项 upTo=${upTo} 未大于前一项 ${lastUpTo}`,
        };
      }
      lastUpTo = upTo;
    }
    thresholds.push({ upTo: upTo as number | null, tier: raw.tier });
  }

  return { ok: true, thresholds };
}
