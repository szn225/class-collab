/**
 * SPEC §12 端到端验证断言 a ~ e
 *
 * 这是与源 Excel 手工口径对比的验收闸门：任何一条不过，Phase 3 收尾不予通过。
 * 全部断言使用真实实现的真实运行结果（不是「应该能过」）。
 */

import { describe, expect, it } from 'vitest';
import { convertByScope, convertGroupRankToCityRank } from '../conversion';
import { mapTier } from '../tier';
import { deriveSnapshot, position } from '../positioning';
import { buildTrend } from '../trend';
import { dataset, makeInput, makeRecord } from './fixtures';

describe('SPEC §12 关键断言', () => {
  it('a) 集团联考：长郡 集团排名 210 → 210 × 3.52 = 739.2 → 折算全市位次 739（约）', () => {
    const coeff = dataset.groupCoeffs['长郡'];
    expect(coeff).toBe(3.52);
    expect(210 * coeff).toBeCloseTo(739.2, 10);

    const outcome = convertByScope('group', makeInput('group', { groupName: '长郡', groupRank: 210 }), dataset);
    expect(outcome.cityRank).toBe(739);
    expect(outcome.isApprox).toBe(true);

    // 直接调底层换算函数，同样得 739
    expect(convertGroupRankToCityRank(210, coeff)).toBe(739);
  });

  it('b) 档次映射：739 ≤ 4212 → "四大本部"', () => {
    const result = position('group', makeInput('group', { groupName: '长郡', groupRank: 210 }), dataset);
    expect(result.cityRank).toBe(739);
    expect(result.tier).toBe('四大本部');
    expect(result.tierIndex).toBe(0);
    expect(mapTier(dataset, 739)?.tier).toBe('四大本部');
  });

  it('c) 校内考试：校排 38 / 校总人数 620 → 位次% = 0.0613，estimatedCityRank = null（不外推）', () => {
    const input = makeInput('school', { schoolRank: 38, schoolSize: 620 });
    expect(38 / 620).toBeCloseTo(0.0612903, 7);

    const snapshot = deriveSnapshot('school', input, dataset);
    expect(snapshot.schoolPositionPct).toBe(0.0613);
    expect(snapshot.estimatedCityRank).toBeNull();
    expect(snapshot.tier).toBeNull();

    const result = position('school', input, dataset);
    expect(result.cityRank).toBeNull();
    expect(result.isApprox).toBe(false);
    expect(result.tier).toBeNull();
    expect(result.note).toBe(
      '本次为校内考试，仅出校内位次%；如需全市位次与档次定位，请录入集团联考或全市统考成绩',
    );
  });

  it('d) 阈值边界：位次 = 4212 → 归入"四大本部"（闭区间归更优档）', () => {
    expect(mapTier(dataset, 4212)).toEqual({ tier: '四大本部', tierIndex: 0 });
    // 4213 立刻掉档，证明 4212 确实是闭区间的「更优档」而不是巧合
    expect(mapTier(dataset, 4213)).toEqual({ tier: '四大新校区', tierIndex: 1 });
  });

  it('e) 趋势图：[集团联考(739), 校内考试(null)] → 折线只连 1 点，校内考试为空心点且不连线，无"第 0 名"假点', () => {
    const series = buildTrend([
      makeRecord({
        id: 'exam-group',
        examName: '10月集团联考',
        examDate: '2026-10-08',
        scope: 'group',
        input: { groupName: '长郡', groupRank: 210 },
      }),
      makeRecord({
        id: 'exam-school',
        examName: '11月校内月考',
        examDate: '2026-11-10',
        scope: 'school',
        input: { schoolRank: 38, schoolSize: 620 },
      }),
    ]);

    // 折线只连 1 点 → 无法成线（1 个点连不成线段）
    expect(series.connectableCount).toBe(1);
    expect(series.segments).toEqual([[0]]);
    expect(series.canRenderLine).toBe(false);

    // 校内考试为空心点：无 Y 值、不连线
    expect(series.points[1]).toMatchObject({
      recordId: 'exam-school',
      estimatedCityRank: null,
      hollow: true,
      connectable: false,
    });

    // 无「第 0 名」假点
    expect(series.points.map((p) => p.estimatedCityRank)).toEqual([739, null]);
    expect(series.points.every((p) => p.estimatedCityRank !== 0)).toBe(true);
    // Y 轴值域也只含可连线点
    expect(series.rankRange).toEqual({ min: 739, max: 739 });
  });
});
