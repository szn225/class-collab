/**
 * record-form —— 录入表单的状态形态与「表单 ↔ core」适配
 *
 * 校验职责**全部**在 core/validation（单一事实来源，AC-09~AC-13）：
 *   本文件只负责把表单字符串态转成 RawExamInput，并把 core 的 FieldError[] 折成 UI 用的错误映射。
 * 纯函数，无副作用、无 wx API。
 */

import type { ExamInput, ExamScope, SurveyGrade } from '../core/types';
import { parseNumberField, validateExamInput } from '../core/validation';
import type { RawExamInput, ValidationResult } from '../core/validation';
import type { Dataset } from '../core/types';

export interface SubjectRow {
  /** 行标识（列表 key 与增删定位用） */
  id: string;
  subject: string;
  full: string;
  score: string;
}

export interface RecordForm {
  examName: string;
  examDate: string;
  scope: ExamScope;
  groupName: string;
  cityRank: string;
  groupRank: string;
  groupSize: string;
  schoolRank: string;
  schoolSize: string;
  classRank: string;
  classSize: string;
  totalScore: string;
  totalFull: string;
  langMathEngTotal: string;
  subjects: SubjectRow[];
  surveyGrades: Record<string, SurveyGrade | ''>;
  qualityEval: boolean | null;
  remark: string;
}

import subjectRules from '../data/subject-rules';
export const SUBJECT_PRESETS = subjectRules.subjects.map(s => s.name);
/** Fixed visible score rows; keep previously entered marks and custom paper maxima intact. */
export function hydrateSubjects(form: RecordForm): RecordForm {
  const existing = form.subjects || [];
  const subjects = subjectRules.subjects.map((s, i) => {
    const old = existing.find(r => r.subject === s.name || (s.name === '道法' && r.subject === '道德与法治'));
    return old ? {...old, full:old.full || String(s.paperFull)} : {id:'subject_'+i,subject:s.name,full:String(s.paperFull),score:''};
  });
  return {...form,subjects:subjects.concat(existing.filter(r => !subjects.some(s => s.id === r.id)))};
}

export function emptyForm(todayStr: string): RecordForm {
  return {
    examName: '',
    examDate: todayStr,
    scope: 'group',
    groupName: '',
    cityRank: '',
    groupRank: '',
    groupSize: '',
    schoolRank: '',
    schoolSize: '',
    classRank: '',
    classSize: '',
    totalScore: '',
    totalFull: '',
    langMathEngTotal: '',
    subjects: [],
    surveyGrades: {},
    qualityEval: null,
    remark: '',
  };
}

/** 表单（字符串态）→ core 的原始输入 */
export function toRawExamInput(form: RecordForm): RawExamInput {
  const grades: Record<string, string> = {};
  Object.keys(form.surveyGrades).forEach((k) => {
    const g = form.surveyGrades[k];
    if (g) grades[k] = g;
  });
  return {
    cityRank: form.cityRank,
    groupName: form.groupName,
    groupRank: form.groupRank,
    groupSize: form.groupSize,
    schoolRank: form.schoolRank,
    schoolSize: form.schoolSize,
    classRank: form.classRank,
    classSize: form.classSize,
    totalScore: form.totalScore,
    totalFull: form.totalFull,
    langMathEngTotal: form.langMathEngTotal,
    subjectScores: form.subjects.filter(s => s.score.trim() !== '').map((s) => ({ subject: s.subject, full: s.full, score: s.score })),
    surveyGrades: grades,
    qualityEval: form.qualityEval,
  };
}

/**
 * 宽松转换：用于「录入中」的实时结论条（允许字段尚未填完）。
 * 解析口径仍复用 core 的 parseNumberField，策略不重复实现。
 * 注意：**保存路径不得使用本函数**，必须用 validateForm(...).value（无半成品记录）。
 */
export function toExamInput(form: RecordForm): ExamInput {
  const n = (raw: string): number | null => {
    const p = parseNumberField(raw);
    return p.kind === 'value' ? p.value : null;
  };
  const subjectScores = form.subjects
    .filter((s) => s.subject.trim() !== '' && s.score.trim() !== '')
    .map((s) => ({ subject: s.subject.trim(), full: n(s.full) ?? 0, score: n(s.score) ?? 0 }))
    .filter((s) => s.full > 0);
  const surveyGrades: Record<string, SurveyGrade> = {};
  Object.keys(form.surveyGrades).forEach((k) => {
    const g = form.surveyGrades[k];
    if (g) surveyGrades[k] = g;
  });
  return {
    cityRank: n(form.cityRank),
    groupName: form.groupName.trim() === '' ? null : form.groupName.trim(),
    groupRank: n(form.groupRank),
    groupSize: n(form.groupSize),
    schoolRank: n(form.schoolRank),
    schoolSize: n(form.schoolSize),
    classRank: n(form.classRank),
    classSize: n(form.classSize),
    totalScore: n(form.totalScore),
    totalFull: n(form.totalFull),
    langMathEngTotal: n(form.langMathEngTotal),
    subjectScores,
    surveyGrades,
    qualityEval: form.qualityEval,
  };
}

export interface FormValidation {
  ok: boolean;
  /** 字段路径 → 就地提示文案 */
  errorMap: Record<string, string>;
  /** 缺失的必填项标签（顺序即聚焦顺序） */
  missingLabels: string[];
  /** 校验通过后的规范输入；ok=false 时为 null */
  value: ExamInput | null;
  /** 分科行的首条错误（表单内只有一个分科提示位） */
  subjectError: string;
}

const RECORD_FIELD_LABELS: Record<string, string> = {
  examName: '考试名称',
  examDate: '考试日期',
};

/**
 * 表单校验 = 记录级必填（考试名称/日期，SPEC §4.3 表 A）+ core 的录入校验。
 * 修正任一字段后重跑本函数即自动清告警（AC-13）。
 */
export function validateForm(form: RecordForm, dataset: Dataset): FormValidation {
  const errorMap: Record<string, string> = {};
  const missingLabels: string[] = [];

  if (form.examName.trim() === '') {
    errorMap.examName = '考试名称不能为空';
    missingLabels.push(RECORD_FIELD_LABELS.examName);
  }
  if (form.examDate.trim() === '') {
    errorMap.examDate = '考试日期不能为空';
    missingLabels.push(RECORD_FIELD_LABELS.examDate);
  }

  const core: ValidationResult = validateExamInput(form.scope, toRawExamInput(form), dataset);

  // core 的字段路径 → 表单字段名（分科行单独收敛为 subjectError）
  let subjectError = '';
  core.errors.forEach((e) => {
    if (e.field.indexOf('subjectScores') === 0) {
      if (!subjectError) subjectError = e.message;
      return;
    }
    if (e.field.indexOf('surveyGrades.') === 0) return;
    if (!errorMap[e.field]) errorMap[e.field] = e.message;
  });
  core.missingFields.forEach((f) => {
    if (f === 'groupName') missingLabels.push('关联集团');
    else if (f === 'cityRank') missingLabels.push('全市位次');
    else if (f === 'groupRank') missingLabels.push('集团排名');
    else if (f === 'schoolRank') missingLabels.push('校排名');
    else if (f === 'schoolSize') missingLabels.push('校总人数');
  });

  return {
    ok: Object.keys(errorMap).length === 0 && core.ok,
    errorMap,
    missingLabels,
    value: core.value,
    subjectError,
  };
}

/** 「沿用上次」画像（AC-04/05 + UIUX §9.2.4） */
export interface ExamProfile {
  scope: ExamScope;
  groupName: string;
  groupSize: string;
  schoolSize: string;
  examName?: string;
}

export function applyProfile(form: RecordForm, profile: ExamProfile | null): RecordForm {
  if (!profile) return form;
  return {
    ...form,
    scope: profile.scope || form.scope,
    groupName: profile.groupName || form.groupName,
    groupSize: profile.groupSize || form.groupSize,
    schoolSize: profile.schoolSize || form.schoolSize,
  };
}

/** 从表单回推「沿用上次」画像 */
export function profileOf(form: RecordForm): ExamProfile {
  return {
    scope: form.scope,
    groupName: form.groupName.trim(),
    groupSize: form.groupSize.trim(),
    schoolSize: form.schoolSize.trim(),
    examName: form.examName.trim(),
  };
}
