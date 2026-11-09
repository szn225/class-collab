import { describe, expect, it } from 'vitest';
import { HOLLOW_POINT_LEGEND, buildTrend } from '../trend';
import { makeRecord } from './fixtures';

describe('buildTrend —— 跨口径隔离（AC-18 ~ AC-21）', () => {
  it('断言 e：[集团联考(739), 校内考试(null)] → 折线只 1 点可连、空心点不连线、无第 0 名假点', () => {
    const series = buildTrend([
      makeRecord({ id: 'r1', examName: '10月集团联考', examDate: '2026-10-08', scope: 'group', input: { groupName: '长郡', groupRank: 210 } }),
      makeRecord({ id: 'r2', examName: '11月校内月考', examDate: '2026-11-10', scope: 'school', input: { schoolRank: 38, schoolSize: 620 } }),
    ]);

    expect(series.points).toHaveLength(2);
    expect(series.points[0].estimatedCityRank).toBe(739);
    expect(series.points[0].connectable).toBe(true);
    expect(series.points[0].hollow).toBe(false);

    // 校内考试：空点、不落 Y 值、不连线
    expect(series.points[1].estimatedCityRank).toBeNull();
    expect(series.points[1].hollow).toBe(true);
    expect(series.points[1].connectable).toBe(false);
    // 唯一可比口径是位次%，仍照常带出
    expect(series.points[1].schoolPositionPct).toBe(0.0613);

    expect(series.segments).toEqual([[0]]);
    expect(series.connectableCount).toBe(1);
    expect(series.hollowCount).toBe(1);
    expect(series.canRenderLine).toBe(false);
    expect(series.legend).toBe(HOLLOW_POINT_LEGEND);

    // 禁止置 0：任何点位都不得出现 0
    expect(series.points.some((p) => p.estimatedCityRank === 0)).toBe(false);
    expect(series.points.map((p) => p.estimatedCityRank)).toEqual([739, null]);
  });

  it('空点处断线，跨口径不连线（AC-20）', () => {
    const series = buildTrend([
      makeRecord({ id: 'r1', examName: '第1次', examDate: '2026-09-01', scope: 'group', input: { groupName: '长郡', groupRank: 210 } }),
      makeRecord({ id: 'r2', examName: '第2次', examDate: '2026-10-01', scope: 'school', input: { schoolRank: 38, schoolSize: 620 } }),
      makeRecord({ id: 'r3', examName: '第3次', examDate: '2026-11-01', scope: 'group', input: { groupName: '长郡', groupRank: 400 } }),
      makeRecord({ id: 'r4', examName: '第4次', examDate: '2026-12-01', scope: 'city', input: { cityRank: 5000 } }),
    ]);

    // r1 与 r3/r4 之间隔着空点 r2 → 分成 [0] 与 [2,3] 两段，绝不跨空点连线
    expect(series.segments).toEqual([[0], [2, 3]]);
    expect(series.canRenderLine).toBe(true);
    expect(series.hollowCount).toBe(1);
    expect(series.connectableCount).toBe(3);
  });

  it('不隐藏无折算位次的考试（AC-20）', () => {
    const series = buildTrend([
      makeRecord({ id: 'r1', examName: '仅校内', examDate: '2026-09-01', scope: 'school', input: { schoolRank: 10, schoolSize: 600 } }),
    ]);
    expect(series.points).toHaveLength(1);
    expect(series.points[0].hollow).toBe(true);
    expect(series.segments).toEqual([]);
    expect(series.canRenderLine).toBe(false);
  });

  it('按考试日期升序排列（乱序输入也稳定）', () => {
    const series = buildTrend([
      makeRecord({ id: 'c', examName: 'C', examDate: '2026-12-01', scope: 'group', input: { groupName: '长郡', groupRank: 300 } }),
      makeRecord({ id: 'a', examName: 'A', examDate: '2026-09-01', scope: 'group', input: { groupName: '长郡', groupRank: 100 } }),
      makeRecord({ id: 'b', examName: 'B', examDate: '2026-10-01', scope: 'group', input: { groupName: '长郡', groupRank: 200 } }),
    ]);
    expect(series.points.map((p) => p.recordId)).toEqual(['a', 'b', 'c']);
    expect(series.segments).toEqual([[0, 1, 2]]);
  });

  it('Y 轴值域只由可连线点决定，空点不参与', () => {
    const series = buildTrend([
      makeRecord({ id: 'r1', examName: '第1次', examDate: '2026-09-01', scope: 'group', input: { groupName: '长郡', groupRank: 210 } }),
      makeRecord({ id: 'r2', examName: '校内', examDate: '2026-10-01', scope: 'school', input: { schoolRank: 38, schoolSize: 620 } }),
      makeRecord({ id: 'r3', examName: '第3次', examDate: '2026-11-01', scope: 'city', input: { cityRank: 5000 } }),
    ]);
    expect(series.rankRange).toEqual({ min: 739, max: 5000 });
  });

  it('无记录 / 无任何可折算记录 → 空序列，不崩、不造假点', () => {
    expect(buildTrend([])).toMatchObject({ points: [], segments: [], canRenderLine: false, rankRange: null });
    const allSchool = buildTrend([
      makeRecord({ id: 'r1', examName: '校内', examDate: '2026-09-01', scope: 'school', input: { schoolRank: 10, schoolSize: 600 } }),
    ]);
    expect(allSchool.rankRange).toBeNull();
  });

  it('不修改传入数组（纯函数）', () => {
    const records = [
      makeRecord({ id: 'b', examName: 'B', examDate: '2026-10-01', scope: 'group', input: { groupName: '长郡', groupRank: 200 } }),
      makeRecord({ id: 'a', examName: 'A', examDate: '2026-09-01', scope: 'group', input: { groupName: '长郡', groupRank: 100 } }),
    ];
    const before = records.map((r) => r.id);
    buildTrend(records);
    expect(records.map((r) => r.id)).toEqual(before);
  });
});
