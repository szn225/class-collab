import { describe, expect, it } from 'vitest';
import {
  convertByScope,
  convertGroupRankToCityRank,
  getGroupCoeff,
  getGroupSize,
  rankPercent,
} from '../conversion';
import { floorRank, roundRankPct } from '../rounding';
import { dataset, makeInput } from './fixtures';

describe('数据集事实（冻结基线，防被静默篡改）', () => {
  it('集团系数与 8 档阈值与 SPEC 一致', () => {
    expect(dataset.groupCoeffs).toEqual({
      长郡: 3.52,
      雅礼: 4.23,
      '师大附中': 5.11,
      长沙市一中: 7.82,
    });
    expect(dataset.tierThresholds.map((t) => t.upTo)).toEqual([
      4212, 7250, 11389, 15516, 23221, 27000, 35000, null,
    ]);
    expect(dataset.examTotalScore).toBe(630);
    expect(dataset.sportsScore).toBe(50);
    expect(dataset.admissionLines).toHaveLength(72);
    expect(dataset.admissionLines.filter((a) => a.cityRank !== null)).toHaveLength(57);
    expect(dataset.indicatorSchools).toHaveLength(150);
  });
});

describe('取整口径', () => {
  it('折算全市位次向下取整（739.2 → 739）', () => {
    expect(floorRank(739.2)).toBe(739);
    expect(floorRank(4212.6)).toBe(4212);
    expect(floorRank(7665)).toBe(7665);
  });

  it('位次% 四舍五入保留 4 位（0.0612903… → 0.0613）', () => {
    expect(roundRankPct(38 / 620)).toBe(0.0613);
    expect(rankPercent(38, 620)).toBe(0.0613);
  });

  it('非有限数字抛错，不静默兜底为 0', () => {
    expect(() => floorRank(Number.NaN)).toThrow(TypeError);
    expect(() => floorRank(Number.POSITIVE_INFINITY)).toThrow(TypeError);
  });
});

describe('getGroupCoeff / getGroupSize', () => {
  it('读取四个集团系数', () => {
    expect(getGroupCoeff(dataset, '长郡')).toBe(3.52);
    expect(getGroupCoeff(dataset, '雅礼')).toBe(4.23);
    expect(getGroupCoeff(dataset, '师大附中')).toBe(5.11);
    expect(getGroupCoeff(dataset, '长沙市一中')).toBe(7.82);
  });

  it('未收录集团返回 null（不按 1 折算）', () => {
    expect(getGroupCoeff(dataset, '不存在的集团')).toBeNull();
    expect(getGroupCoeff(dataset, null)).toBeNull();
    expect(getGroupCoeff(dataset, '')).toBeNull();
  });

  it('集团总人数来自数据集', () => {
    expect(getGroupSize(dataset, '长郡')).toBe(21363);
    expect(getGroupSize(dataset, '不存在')).toBeNull();
  });
});

describe('convertGroupRankToCityRank', () => {
  it('210 × 3.52 → 739（SPEC §12 断言 a）', () => {
    expect(convertGroupRankToCityRank(210, 3.52)).toBe(739);
  });

  it('1500 × 5.11 → 7665（源表⑤示例为整数乘算）', () => {
    // 5.11 二进制表示误差 → 需要确认向下取整不产生 7664
    expect(convertGroupRankToCityRank(1500, 5.11)).toBe(7665);
  });

  it('四个集团各自折算', () => {
    expect(convertGroupRankToCityRank(210, 3.52)).toBe(739);
    expect(convertGroupRankToCityRank(210, 4.23)).toBe(888);
    expect(convertGroupRankToCityRank(210, 5.11)).toBe(1073);
    expect(convertGroupRankToCityRank(210, 7.82)).toBe(1642);
  });
});

describe('rankPercent', () => {
  it('38 / 620 → 0.0613', () => {
    expect(rankPercent(38, 620)).toBe(0.0613);
  });

  it('分母缺失 / 非法 → null（不返回 0）', () => {
    expect(rankPercent(38, null)).toBeNull();
    expect(rankPercent(38, 0)).toBeNull();
    expect(rankPercent(38, undefined)).toBeNull();
  });
});

describe('convertByScope —— 按 scope 决定口径源', () => {
  it('city：直接采用官方位次，不叠加任何集团系数（AC-15）', () => {
    const outcome = convertByScope(
      'city',
      makeInput('city', { cityRank: 3000, groupName: '长郡', groupRank: 210 }),
      dataset,
    );
    expect(outcome.cityRank).toBe(3000);
    expect(outcome.isApprox).toBe(false);
  });

  it('group：集团排名 × 集团系数（AC-14）', () => {
    const outcome = convertByScope('group', makeInput('group', { groupName: '长郡', groupRank: 210 }), dataset);
    expect(outcome.cityRank).toBe(739);
    expect(outcome.isApprox).toBe(true);
  });

  it('school：不外推全市位次，只出位次%（AC-03/AC-17）', () => {
    const outcome = convertByScope('school', makeInput('school', { schoolRank: 38, schoolSize: 620 }), dataset);
    expect(outcome.cityRank).toBeNull();
    expect(outcome.isApprox).toBe(false);
    expect(outcome.schoolPositionPct).toBe(0.0613);
  });

  it('school 即使带了集团信息也不外推', () => {
    const outcome = convertByScope(
      'school',
      makeInput('school', { schoolRank: 38, schoolSize: 620, groupName: '长郡', groupRank: 10 }),
      dataset,
    );
    expect(outcome.cityRank).toBeNull();
  });

  it('group 缺集团排名 → null + reason（绝不置 0）', () => {
    const outcome = convertByScope('group', makeInput('group', { groupName: '长郡' }), dataset);
    expect(outcome.cityRank).toBeNull();
    expect(outcome.reason).toContain('集团排名');
  });

  it('group 集团未收录 → null + reason', () => {
    const outcome = convertByScope('group', makeInput('group', { groupName: '某民办集团', groupRank: 100 }), dataset);
    expect(outcome.cityRank).toBeNull();
    expect(outcome.reason).toContain('系数表');
  });

  it('group 位次% 用输入的分母优先，缺省回退数据集集团总人数', () => {
    const withInput = convertByScope(
      'group',
      makeInput('group', { groupName: '长郡', groupRank: 210, groupSize: 4200 }),
      dataset,
    );
    expect(withInput.groupPositionPct).toBe(0.05);
    const fallback = convertByScope('group', makeInput('group', { groupName: '长郡', groupRank: 210 }), dataset);
    expect(fallback.groupPositionPct).toBe(Math.round((210 / 21363) * 10000) / 10000);
  });
});
