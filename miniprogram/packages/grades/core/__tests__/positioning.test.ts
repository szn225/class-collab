import { describe, expect, it } from 'vitest';
import {
  CONVERSION_FAILED_NOTE_PREFIX,
  SCHOOL_SCOPE_NOTE,
  buildSubjectAnalysis,
  deriveSnapshot,
  position,
} from '../positioning';
import { dataset, makeInput } from './fixtures';

describe('position —— 定位编排', () => {
  it('集团联考：长郡 210 → 位次 739（约）→ 四大本部', () => {
    const result = position('group', makeInput('group', { groupName: '长郡', groupRank: 210 }), dataset);
    expect(result).toEqual({
      cityRank: 739,
      isApprox: true,
      basis: 'group',
      tier: '四大本部',
      tierIndex: 0,
      note: null,
    });
  });

  it('全市统考：采用官方位次，标注非约数，不叠加系数', () => {
    const result = position(
      'city',
      makeInput('city', { cityRank: 9000, groupName: '长郡', groupRank: 210 }),
      dataset,
    );
    expect(result.cityRank).toBe(9000);
    expect(result.isApprox).toBe(false);
    expect(result.tier).toBe('明德周南');
    expect(result.tierIndex).toBe(2);
  });

  it('校内考试：无全市位次、无档次，改显引导占位（AC-03）', () => {
    const result = position('school', makeInput('school', { schoolRank: 38, schoolSize: 620 }), dataset);
    expect(result.cityRank).toBeNull();
    expect(result.tier).toBeNull();
    expect(result.tierIndex).toBeNull();
    expect(result.note).toBe(SCHOOL_SCOPE_NOTE);
  });

  it('集团未收录：位次留空并说明原因，不猜档', () => {
    const result = position('group', makeInput('group', { groupName: '某集团', groupRank: 10 }), dataset);
    expect(result.cityRank).toBeNull();
    expect(result.tier).toBeNull();
    expect(result.note?.startsWith(CONVERSION_FAILED_NOTE_PREFIX)).toBe(true);
  });
});

describe('buildSubjectAnalysis', () => {
  it('得分率 = 得分 ÷ 满分，均分差值留给上层补齐', () => {
    const analysis = buildSubjectAnalysis(
      makeInput('group', {
        subjectScores: [
          { subject: '数学', full: 120, score: 108 },
          { subject: '语文', full: 120, score: 90 },
        ],
      }),
    );
    expect(analysis).toEqual([
      { subject: '数学', rate: 0.9, vsSchoolAvg: null, vsGroupAvg: null, attribution: null },
      { subject: '语文', rate: 0.75, vsSchoolAvg: null, vsGroupAvg: null, attribution: null },
    ]);
  });

  it('满分缺失或非正数的科目跳过，不臆造 0 分', () => {
    const analysis = buildSubjectAnalysis(
      makeInput('group', {
        subjectScores: [
          { subject: '体育', full: 0, score: 50 },
          { subject: '', full: 100, score: 90 },
          { subject: '物理', full: 70, score: 60 },
        ],
      }),
    );
    expect(analysis.map((a) => a.subject)).toEqual(['物理']);
  });
});

describe('deriveSnapshot —— 写入时冻结的快照', () => {
  it('校内考试 estimatedCityRank 恒为 null，位次% 照常算出（断言 c）', () => {
    const snapshot = deriveSnapshot('school', makeInput('school', { schoolRank: 38, schoolSize: 620 }), dataset);
    expect(snapshot.estimatedCityRank).toBeNull();
    expect(snapshot.schoolPositionPct).toBe(0.0613);
    expect(snapshot.tier).toBeNull();
    expect(snapshot.tierIndex).toBeNull();
  });

  it('集团联考快照含位次、档次与分科分析', () => {
    const snapshot = deriveSnapshot(
      'group',
      makeInput('group', {
        groupName: '长郡',
        groupRank: 210,
        groupSize: 4200,
        totalScore: 587,
        totalFull: 630,
        subjectScores: [{ subject: '数学', full: 120, score: 108 }],
      }),
      dataset,
    );
    expect(snapshot.estimatedCityRank).toBe(739);
    expect(snapshot.tier).toBe('四大本部');
    expect(snapshot.tierIndex).toBe(0);
    expect(snapshot.groupPositionPct).toBe(0.05);
    expect(snapshot.subjectAnalysis).toHaveLength(1);
  });

  it('deltaVsPrevRank = 本次 − 上次（负数代表进步，与 SPEC §6.2 示例一致）', () => {
    const snapshot = deriveSnapshot(
      'group',
      makeInput('group', { groupName: '长郡', groupRank: 210 }),
      dataset,
      1943,
    );
    expect(snapshot.deltaVsPrevRank).toBe(-1204);
  });

  it('无上次位次或本次无位次时 delta 为 null，绝不参与跨口径比较（AC-22）', () => {
    const noPrev = deriveSnapshot('group', makeInput('group', { groupName: '长郡', groupRank: 210 }), dataset);
    expect(noPrev.deltaVsPrevRank).toBeNull();
    const school = deriveSnapshot(
      'school',
      makeInput('school', { schoolRank: 38, schoolSize: 620 }),
      dataset,
      1943,
    );
    expect(school.deltaVsPrevRank).toBeNull();
  });
});
