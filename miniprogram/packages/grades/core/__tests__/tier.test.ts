import { describe, expect, it } from 'vitest';
import { mapTier, validateTierThresholds } from '../tier';
import type { Dataset, TierThreshold } from '../types';
import { dataset } from './fixtures';

describe('mapTier —— 8 档阈值映射（AC-16）', () => {
  it('739 → 四大本部（SPEC §12 断言 b）', () => {
    expect(mapTier(dataset, 739)).toEqual({ tier: '四大本部', tierIndex: 0 });
  });

  it('每个阈值恰好等于时归入该档（闭区间归更优档）', () => {
    const expected = [
      [4212, '四大本部', 0],
      [7250, '四大新校区', 1],
      [11389, '明德周南', 2],
      [15516, '麓山南雅中坚', 3],
      [23221, '第三梯队', 4],
      [27000, '第四梯队', 5],
      [35000, '第五梯队', 6],
    ] as const;
    for (const [rank, tier, index] of expected) {
      expect(mapTier(dataset, rank)).toEqual({ tier, tierIndex: index });
    }
  });

  it('阈值 +1 立刻掉到下一档（分段闭区间语义）', () => {
    expect(mapTier(dataset, 4213)).toEqual({ tier: '四大新校区', tierIndex: 1 });
    expect(mapTier(dataset, 7251)).toEqual({ tier: '明德周南', tierIndex: 2 });
    expect(mapTier(dataset, 35001)).toEqual({ tier: '普高线附近', tierIndex: 7 });
    expect(mapTier(dataset, 99999)).toEqual({ tier: '普高线附近', tierIndex: 7 });
  });

  it('第 1 名归入最优档', () => {
    expect(mapTier(dataset, 1)).toEqual({ tier: '四大本部', tierIndex: 0 });
  });

  it('null / 非数字位次 → 无档次（校内考试 AC-03）', () => {
    expect(mapTier(dataset, null)).toBeNull();
    expect(mapTier(dataset, undefined)).toBeNull();
    expect(mapTier(dataset, Number.NaN)).toBeNull();
  });

  it('数据集没有兜底档时超出阈值返回 null，不猜档', () => {
    const noFallback: Dataset = {
      ...dataset,
      tierThresholds: [{ upTo: 4212, tier: '四大本部' }],
    };
    expect(mapTier(noFallback, 5000)).toBeNull();
  });

  it('阈值一律来自 Dataset 注入（改阈值即改结论，代码零魔法数字）', () => {
    const patched: Dataset = {
      ...dataset,
      tierThresholds: [{ upTo: 500, tier: '实验档' }, { upTo: null, tier: '兜底档' }],
    };
    expect(mapTier(patched, 739)).toEqual({ tier: '兜底档', tierIndex: 1 });
    expect(mapTier(patched, 500)).toEqual({ tier: '实验档', tierIndex: 0 });
  });
});

describe('validateTierThresholds —— 单调递增校验（SPEC §6.3.3）', () => {
  it('本数据集阈值通过', () => {
    const result = validateTierThresholds(dataset.tierThresholds);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.thresholds).toHaveLength(8);
  });

  it('非数组 / 空数组 → 失败', () => {
    expect(validateTierThresholds('4212').ok).toBe(false);
    expect(validateTierThresholds([]).ok).toBe(false);
  });

  it('递减 / 相等 → 失败（必须严格递增）', () => {
    const decreasing: TierThreshold[] = [
      { upTo: 7250, tier: 'A' },
      { upTo: 4212, tier: 'B' },
      { upTo: null, tier: 'C' },
    ];
    expect(validateTierThresholds(decreasing).ok).toBe(false);
    const equal: TierThreshold[] = [
      { upTo: 4212, tier: 'A' },
      { upTo: 4212, tier: 'B' },
      { upTo: null, tier: 'C' },
    ];
    expect(validateTierThresholds(equal).ok).toBe(false);
  });

  it('兜底档（upTo=null）不在末位 → 失败', () => {
    const bad: TierThreshold[] = [
      { upTo: null, tier: '兜底' },
      { upTo: 4212, tier: 'A' },
    ];
    expect(validateTierThresholds(bad).ok).toBe(false);
  });

  it('tier 缺失 / upTo 类型错误 → 失败', () => {
    expect(validateTierThresholds([{ upTo: 4212 }]).ok).toBe(false);
    expect(validateTierThresholds([{ upTo: '4212', tier: 'A' }]).ok).toBe(false);
    expect(validateTierThresholds([{ upTo: 4212, tier: '  ' }]).ok).toBe(false);
  });
});
