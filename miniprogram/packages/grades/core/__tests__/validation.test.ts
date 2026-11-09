import { describe, expect, it } from 'vitest';
import { NOT_A_NUMBER_MESSAGE, parseNumberField, requiredFieldsForScope, validateExamInput } from '../validation';
import type { RawExamInput } from '../validation';
import { dataset } from './fixtures';

describe('parseNumberField —— 非数字识别（AC-10）', () => {
  it('接受普通数字与数字字符串、前后空格', () => {
    expect(parseNumberField(38)).toEqual({ kind: 'value', value: 38 });
    expect(parseNumberField('38')).toEqual({ kind: 'value', value: 38 });
    expect(parseNumberField(' 38 ')).toEqual({ kind: 'value', value: 38 });
    expect(parseNumberField('587.5')).toEqual({ kind: 'value', value: 587.5 });
  });

  it('接受全角数字与全角小数点、全角空格', () => {
    expect(parseNumberField('３８')).toEqual({ kind: 'value', value: 38 });
    expect(parseNumberField('５８７．５')).toEqual({ kind: 'value', value: 587.5 });
    expect(parseNumberField('\u3000 620 \u3000')).toEqual({ kind: 'value', value: 620 });
  });

  it('空值为 empty（交由必填校验决定）', () => {
    expect(parseNumberField(null)).toEqual({ kind: 'empty' });
    expect(parseNumberField(undefined)).toEqual({ kind: 'empty' });
    expect(parseNumberField('')).toEqual({ kind: 'empty' });
    expect(parseNumberField('   ')).toEqual({ kind: 'empty' });
  });

  it('文字符号 / 逗号 / 百分号 / 单位 → invalid，绝不兜底成数字', () => {
    expect(parseNumberField('abc').kind).toBe('invalid');
    expect(parseNumberField('38岁').kind).toBe('invalid');
    expect(parseNumberField('1,000').kind).toBe('invalid');
    expect(parseNumberField('90%').kind).toBe('invalid');
    expect(parseNumberField('第一名').kind).toBe('invalid');
    expect(parseNumberField('3.8.1').kind).toBe('invalid');
    expect(parseNumberField(Number.NaN).kind).toBe('invalid');
  });
});

describe('requiredFieldsForScope —— 条件必填（AC-01/02/03）', () => {
  it('三类考试的必填口径源', () => {
    expect(requiredFieldsForScope('city')).toEqual(['cityRank']);
    expect(requiredFieldsForScope('group')).toEqual(['groupName', 'groupRank']);
    expect(requiredFieldsForScope('school')).toEqual(['schoolRank', 'schoolSize']);
  });
});

describe('validateExamInput —— 必填（AC-11）', () => {
  it('统考缺全市位次 → 阻止保存并标出缺失字段', () => {
    const result = validateExamInput('city', {}, dataset);
    expect(result.ok).toBe(false);
    expect(result.value).toBeNull();
    expect(result.missingFields).toEqual(['cityRank']);
    expect(result.errors).toEqual([
      { field: 'cityRank', code: 'REQUIRED', message: '全市位次不能为空' },
    ]);
  });

  it('集团联考缺集团与集团排名 → 两个缺失', () => {
    const result = validateExamInput('group', {}, dataset);
    expect(result.missingFields).toEqual(['groupName', 'groupRank']);
    expect(result.ok).toBe(false);
  });

  it('集团名只有空格视同缺失', () => {
    const result = validateExamInput('group', { groupName: '   ', groupRank: '210' }, dataset);
    expect(result.missingFields).toEqual(['groupName']);
  });

  it('校内考试缺校排名 / 校总人数 → 两个缺失（AC-03）', () => {
    const result = validateExamInput('school', { schoolRank: '' }, dataset);
    expect(result.missingFields).toEqual(['schoolRank', 'schoolSize']);
  });

  it('集团联考不要求校排名（降为选填，AC-02）', () => {
    const result = validateExamInput('group', { groupName: '长郡', groupRank: '210' }, dataset);
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });
});

describe('validateExamInput —— 排名大于总人数（AC-09）', () => {
  it('校排 700 / 校总 620 → 精确提示文案', () => {
    const result = validateExamInput('school', { schoolRank: '700', schoolSize: '620' }, dataset);
    expect(result.ok).toBe(false);
    const error = result.errors.find((e) => e.code === 'RANK_EXCEEDS_SIZE');
    expect(error?.field).toBe('schoolRank');
    expect(error?.message).toBe('校排名不能大于校总人数');
  });

  it('边界：校排 = 校总人数 → 允许（最低名次合法）', () => {
    const result = validateExamInput('school', { schoolRank: '620', schoolSize: '620' }, dataset);
    expect(result.ok).toBe(true);
  });

  it('边界：校排 = 1 → 允许（最高名次）', () => {
    const result = validateExamInput('school', { schoolRank: '1', schoolSize: '620' }, dataset);
    expect(result.ok).toBe(true);
  });

  it('集团排名 > 集团总人数同样拦截', () => {
    const result = validateExamInput(
      'group',
      { groupName: '长郡', groupRank: '5000', groupSize: '4200' },
      dataset,
    );
    const error = result.errors.find((e) => e.code === 'RANK_EXCEEDS_SIZE');
    expect(error?.message).toBe('集团排名不能大于集团总人数');
  });
});

describe('validateExamInput —— 非数字（AC-10）', () => {
  it('文字输入 → 就地提示「请输入数字」', () => {
    const result = validateExamInput('school', { schoolRank: 'abc', schoolSize: '620' }, dataset);
    expect(result.ok).toBe(false);
    const error = result.errors.find((e) => e.field === 'schoolRank');
    expect(error?.code).toBe('NOT_A_NUMBER');
    expect(error?.message).toBe(NOT_A_NUMBER_MESSAGE);
  });

  it('全角数字可通过，不再报错', () => {
    const result = validateExamInput('school', { schoolRank: '３８', schoolSize: '６２０' }, dataset);
    expect(result.ok).toBe(true);
    expect(result.value?.schoolRank).toBe(38);
    expect(result.value?.schoolSize).toBe(620);
  });

  it('位次必须 ≥1 的整数：38.5 / 0 → 越界', () => {
    const half = validateExamInput('school', { schoolRank: '38.5', schoolSize: '620' }, dataset);
    expect(half.errors.some((e) => e.code === 'OUT_OF_RANGE')).toBe(true);
    const zero = validateExamInput('school', { schoolRank: '0', schoolSize: '620' }, dataset);
    expect(zero.errors.some((e) => e.code === 'OUT_OF_RANGE')).toBe(true);
  });
});

describe('validateExamInput —— 分数超满分（AC-12，仅显式 totalFull 时校验总分）', () => {
  it('分科分数 > 该科满分 → 提示该科满分值', () => {
    const result = validateExamInput(
      'school',
      {
        schoolRank: '38',
        schoolSize: '620',
        subjectScores: [{ subject: '数学', full: '120', score: '130' }],
      },
      dataset,
    );
    expect(result.ok).toBe(false);
    const error = result.errors.find((e) => e.code === 'SCORE_EXCEEDS_FULL');
    expect(error?.field).toBe('subjectScores[0].score');
    expect(error?.message).toBe('数学分数不能超过满分 120');
  });

  it('总分 650 但未填 totalFull → 不校验、不误拦（700 分制校内测验场景）', () => {
    const result = validateExamInput(
      'school',
      { schoolRank: '38', schoolSize: '620', totalScore: '650' },
      dataset,
    );
    // 裁决（team-lead 2026-10-15）：不再用 dataset.examTotalScore(630) 兜底当默认满分，
    // 否则 700 分制里合法的 650 分会被误拦 —— 宁可漏检，不可误拦。
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.value?.totalScore).toBe(650);
  });

  it('总分 800 但未填 totalFull → 同样不拦（无从判定满分，不猜）', () => {
    const result = validateExamInput(
      'school',
      { schoolRank: '38', schoolSize: '620', totalScore: '800' },
      dataset,
    );
    expect(result.ok).toBe(true);
  });

  it('显式给出 totalFull 时以 totalFull 为准：650 > 630 → 拦截', () => {
    const result = validateExamInput(
      'school',
      { schoolRank: '38', schoolSize: '620', totalScore: '650', totalFull: '630' },
      dataset,
    );
    const error = result.errors.find((e) => e.code === 'SCORE_EXCEEDS_FULL');
    expect(error?.field).toBe('totalScore');
    expect(error?.message).toBe('总分不能超过满分 630');
  });

  it('显式 totalFull 未超时放行（支持 700 分制）', () => {
    const result = validateExamInput(
      'school',
      { schoolRank: '38', schoolSize: '620', totalScore: '680', totalFull: '700' },
      dataset,
    );
    expect(result.ok).toBe(true);
    expect(result.value?.totalFull).toBe(700);
  });

  it('显式 totalFull 非正数 → 越界', () => {
    const result = validateExamInput(
      'school',
      { schoolRank: '38', schoolSize: '620', totalScore: '100', totalFull: '0' },
      dataset,
    );
    const error = result.errors.find((e) => e.field === 'totalFull');
    expect(error?.message).toBe('卷面满分必须大于 0');
  });

  it('满分 = 得分 允许（闭区间）', () => {
    const result = validateExamInput(
      'school',
      { schoolRank: '38', schoolSize: '620', subjectScores: [{ subject: '数学', full: '120', score: '120' }] },
      dataset,
    );
    expect(result.ok).toBe(true);
  });
});

describe('validateExamInput —— 修正后即时放行（AC-13）与规范化输出', () => {
  it('错误修正后 errors 清空、ok 变 true', () => {
    const bad = validateExamInput('school', { schoolRank: '700', schoolSize: '620' }, dataset);
    expect(bad.ok).toBe(false);
    expect(bad.errors).toHaveLength(1);

    const fixed = validateExamInput('school', { schoolRank: '38', schoolSize: '620' }, dataset);
    expect(fixed.ok).toBe(true);
    expect(fixed.errors).toEqual([]);
    expect(fixed.missingFields).toEqual([]);
  });

  it('规范化输出把字符串转成数字、全角归一，并补全缺省字段', () => {
    const result = validateExamInput(
      'group',
      {
        groupName: ' 长郡 ',
        groupRank: '２１０',
        groupSize: '4200',
        subjectScores: [{ subject: '数学', full: '120', score: '108' }],
        surveyGrades: { 生物: 'B', 地理: 'A' },
        qualityEval: true,
      },
      dataset,
    );
    expect(result.ok).toBe(true);
    expect(result.value).toEqual({
      cityRank: null,
      groupName: '长郡',
      groupRank: 210,
      groupSize: 4200,
      schoolRank: null,
      schoolSize: null,
      classRank: null,
      classSize: null,
      totalScore: null,
      totalFull: null,
      langMathEngTotal: null,
      subjectScores: [{ subject: '数学', full: 120, score: 108 }],
      surveyGrades: { 生物: 'B', 地理: 'A' },
      qualityEval: true,
    });
  });

  it('考查科目等级非法 → 越界错误', () => {
    const raw: RawExamInput = {
      schoolRank: '38',
      schoolSize: '620',
      surveyGrades: { 生物: 'E' },
    };
    const result = validateExamInput('school', raw, dataset);
    const error = result.errors.find((e) => e.field === 'surveyGrades.生物');
    expect(error?.message).toBe('生物等级必须是 A / B / C / D');
  });
});
