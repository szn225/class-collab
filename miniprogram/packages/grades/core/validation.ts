/**
 * 录入校验（SPEC §9.1 / §9.2：AC-01 ~ AC-03、AC-09 ~ AC-13）
 *
 * 设计要点：
 *   - 入参是「原始输入」（RawExamInput）：UI 传进来的是字符串（可能含全角数字、空格、文字符号），
 *     故本模块**先解析再校验**，解析失败一律 NOT_A_NUMBER，绝不 parseFloat 兜底成数字。
 *   - 逐字段返回错误（就地提示，不跳页 —— SPEC §10），ok=false 时 value=null，UI 据此禁用保存（AC-11）。
 *   - 单科「分数 > 该科满分」用用户自填的 subjectScores[].full 校验（AC-12）。
 *   - 本模块是纯函数：不依赖 wx，可直接在 node 下单测。
 */

import type { Dataset, ExamInput, ExamScope, SubjectScore, SurveyGrade } from './types';

/** 原始输入单元：UI 层的输入框可能给出字符串 */
export type RawField = string | number | null | undefined;

export interface RawSubjectScoreInput {
  subject?: string | null;
  full?: RawField;
  score?: RawField;
}

/** 原始录入（未解析）—— 与 core/types.ts 的 ExamInput 同构，但数值字段允许字符串 */
export interface RawExamInput {
  cityRank?: RawField;
  groupName?: string | null;
  groupRank?: RawField;
  groupSize?: RawField;
  schoolRank?: RawField;
  schoolSize?: RawField;
  classRank?: RawField;
  classSize?: RawField;
  totalScore?: RawField;
  totalFull?: RawField;
  langMathEngTotal?: RawField;
  subjectScores?: RawSubjectScoreInput[] | null;
  surveyGrades?: Record<string, string> | null;
  qualityEval?: boolean | null;
}

export type ValidationCode =
  /** AC-11 必填缺失 */
  | 'REQUIRED'
  /** AC-10 非数字（含全角、空格、文字符号） */
  | 'NOT_A_NUMBER'
  /** AC-09 排名大于总人数 */
  | 'RANK_EXCEEDS_SIZE'
  /** AC-12 分数超过卷面满分 */
  | 'SCORE_EXCEEDS_FULL'
  /** 取值越界（位次须为 ≥1 的整数等） */
  | 'OUT_OF_RANGE';

export interface FieldError {
  /** 字段路径，如 schoolRank / subjectScores[0].score */
  field: string;
  code: ValidationCode;
  /** 就地提示文案（AC-09/10/11/12 指定文案在本模块生成） */
  message: string;
}

export interface ValidationResult {
  /** 是否可以保存（AC-11：ok=false 时禁用保存按钮） */
  ok: boolean;
  errors: FieldError[];
  /** 必填缺失字段（AC-11 高亮缺失项）；AC-13 修正后该数组即时清空 */
  missingFields: string[];
  /** 校验通过时的规范化 ExamInput；ok=false 时为 null（绝不提交半成品） */
  value: ExamInput | null;
}

const FIELD_LABELS: Record<string, string> = {
  cityRank: '全市位次',
  groupName: '关联集团',
  groupRank: '集团排名',
  groupSize: '集团总人数',
  schoolRank: '校排名',
  schoolSize: '校总人数',
  classRank: '班排名',
  classSize: '班总人数',
  totalScore: '总分',
  totalFull: '卷面满分',
  langMathEngTotal: '语数英三科总分',
};

function labelOf(field: string): string {
  return FIELD_LABELS[field] ?? field;
}

/** AC-10 就地提示文案 */
export const NOT_A_NUMBER_MESSAGE = '请输入数字';
/** AC-10 校验错误码对应文案（UI 可复用） */
export const REQUIRED_MESSAGE_SUFFIX = '不能为空';

const FULL_WIDTH_MAP: Record<string, string> = {
  '０': '0', '１': '1', '２': '2', '３': '3', '４': '4',
  '５': '5', '６': '6', '７': '7', '８': '8', '９': '9',
  '．': '.', '。': '.', '－': '-', '—': '-', '−': '-', '﹣': '-',
  '\u3000': ' ', // 全角空格
};

/** 全角 → 半角（数字、小数点、负号、空格）。其余字符原样保留，交给正则判定为非法。 */
function toHalfWidth(input: string): string {
  let out = '';
  for (const ch of input) {
    out += FULL_WIDTH_MAP[ch] ?? ch;
  }
  return out;
}

/** 合法数字：可选正负号 + 整数/小数（不接受逗号、百分号、单位等） */
const NUMBER_PATTERN = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/;

export type ParsedNumber =
  | { kind: 'empty' }
  | { kind: 'invalid'; raw: string }
  | { kind: 'value'; value: number };

/**
 * 解析单个数值字段。
 * 空（null / undefined / 纯空白）→ empty（交由必填校验决定是否报错）；
 * 全角数字、前后空格会被归一化后接受；文字符号 / 逗号 / 百分号 → invalid。
 */
export function parseNumberField(raw: RawField): ParsedNumber {
  if (raw === null || raw === undefined) return { kind: 'empty' };
  if (typeof raw === 'number') {
    return Number.isFinite(raw) ? { kind: 'value', value: raw } : { kind: 'invalid', raw: String(raw) };
  }
  const trimmed = toHalfWidth(String(raw)).trim();
  if (trimmed === '') return { kind: 'empty' };
  if (!NUMBER_PATTERN.test(trimmed)) return { kind: 'invalid', raw: String(raw) };
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return { kind: 'invalid', raw: String(raw) };
  return { kind: 'value', value };
}

/** 某 scope 下的条件必填字段（AC-01 / AC-02 / AC-03） */
export function requiredFieldsForScope(scope: ExamScope): string[] {
  switch (scope) {
    case 'city':
      return ['cityRank'];
    case 'group':
      return ['groupName', 'groupRank'];
    case 'school':
      return ['schoolRank', 'schoolSize'];
    default:
      return [];
  }
}

function isSurveyGrade(value: unknown): value is SurveyGrade {
  return value === 'A' || value === 'B' || value === 'C' || value === 'D';
}

interface RankVsSize {
  rankField: string;
  sizeField: string;
  /** AC-09 文案："校排名不能大于校总人数" */
  message: string;
}

const RANK_VS_SIZE: RankVsSize[] = [
  { rankField: 'schoolRank', sizeField: 'schoolSize', message: '校排名不能大于校总人数' },
  { rankField: 'groupRank', sizeField: 'groupSize', message: '集团排名不能大于集团总人数' },
  { rankField: 'classRank', sizeField: 'classSize', message: '班排名不能大于班总人数' },
];

/** 位次字段：必须是 ≥1 的整数 */
const RANK_FIELDS = ['cityRank', 'groupRank', 'schoolRank', 'classRank'];

/**
 * 校验并规范化一次录入。
 *
 * @param scope 考试类型（决定条件必填与口径源）
 * @param raw   原始输入（数值字段允许字符串）
 * @param dataset 当前口径数据集。
 *   注意：AC-12 按裁决收紧为「仅当用户显式填了 totalFull 时才校验总分超满分」后，
 *   本函数**已不读取 dataset 的任何字段** —— 但**不要**因此删除该形参。
 *   保留依据（team-lead 裁决 2026-10-15「保留签名一致性」）：
 *     ① core/ 的分层契约是「一切阈值/系数/满分从 Dataset 注入」。本函数若成为唯一不接收
 *        dataset 的例外，调用点就得记住"哪些校验要口径、哪些不要"，等于把复杂度从函数体
 *        推给调用方，不划算；
 *     ② 删除代价（跨组签名对齐 + 全量测试调用点改动）远大于收益；
 *     ③ 后续若新增数据驱动的口径一致性校验，可直接复用该形参，不必再触发一次签名变更。
 */
export function validateExamInput(scope: ExamScope, raw: RawExamInput, dataset: Dataset): ValidationResult {
  const input: RawExamInput = raw ?? {};
  const errors: FieldError[] = [];
  const missingFields: string[] = [];

  const add = (field: string, code: ValidationCode, message: string): void => {
    errors.push({ field, code, message });
  };

  const numericFields = [
    'cityRank', 'groupRank', 'groupSize', 'schoolRank', 'schoolSize',
    'classRank', 'classSize', 'totalScore', 'totalFull', 'langMathEngTotal',
  ] as const;

  const parsed: Record<string, ParsedNumber> = {};
  for (const field of numericFields) {
    const result = parseNumberField(input[field]);
    parsed[field] = result;
    if (result.kind === 'invalid') {
      // AC-10：非数字（含全角、空格、文字符号）→ 就地提示「请输入数字」，不兜底成 0
      add(field, 'NOT_A_NUMBER', NOT_A_NUMBER_MESSAGE);
    }
  }

  // AC-11 / AC-01~03：条件必填
  for (const field of requiredFieldsForScope(scope)) {
    if (field === 'groupName') {
      const name = typeof input.groupName === 'string' ? input.groupName.trim() : '';
      if (name === '') missingFields.push(field);
      continue;
    }
    const result = parsed[field];
    if (!result || result.kind === 'empty') missingFields.push(field);
  }
  for (const field of missingFields) {
    add(field, 'REQUIRED', `${labelOf(field)}${REQUIRED_MESSAGE_SUFFIX}`);
  }

  // 位次字段必须是 ≥1 的整数
  for (const field of RANK_FIELDS) {
    const result = parsed[field];
    if (result && result.kind === 'value') {
      if (!Number.isInteger(result.value) || result.value < 1) {
        add(field, 'OUT_OF_RANGE', `${labelOf(field)}必须是大于等于 1 的整数`);
      }
    }
  }

  // AC-09：排名 > 总人数
  for (const rule of RANK_VS_SIZE) {
    const rank = parsed[rule.rankField];
    const size = parsed[rule.sizeField];
    if (rank && size && rank.kind === 'value' && size.kind === 'value' && rank.value > size.value) {
      add(rule.rankField, 'RANK_EXCEEDS_SIZE', rule.message);
    }
  }

  // AC-12（P1）：分数 > 卷面满分 —— 仅当用户**显式填写了 totalFull** 时才校验。
  //
  // 裁决依据（team-lead 2026-10-15）：不再用 dataset.examTotalScore(630) 兜底当默认满分。
  // 校内测验卷面制式差异大（100 / 150 / 700 分制都常见），而 totalFull 并非必填，
  // 用 630 兜底会把 700 分制里合法的 650 分误拦 —— 「阻止保存」的体验伤害大于漏检收益，
  // 且 AC-12 本身是 P1。宁可漏检，不可误拦。
  const totalScore = parsed.totalScore;
  const explicitFull = parsed.totalFull;
  if (explicitFull && explicitFull.kind === 'value' && explicitFull.value <= 0) {
    add('totalFull', 'OUT_OF_RANGE', '卷面满分必须大于 0');
  } else if (
    totalScore &&
    totalScore.kind === 'value' &&
    explicitFull &&
    explicitFull.kind === 'value' &&
    totalScore.value > explicitFull.value
  ) {
    add('totalScore', 'SCORE_EXCEEDS_FULL', `总分不能超过满分 ${explicitFull.value}`);
  }

  // AC-12：分科分数 > 该科满分（提示该科目满分值）
  const rawSubjects = Array.isArray(input.subjectScores) ? input.subjectScores : [];
  const parsedSubjects = rawSubjects.map((s) => ({
    subject: typeof s?.subject === 'string' ? s.subject.trim() : '',
    full: parseNumberField(s?.full),
    score: parseNumberField(s?.score),
  }));
  parsedSubjects.forEach((s, i) => {
    const name = s.subject || `第 ${i + 1} 科`;
    if (s.subject === '') {
      add(`subjectScores[${i}].subject`, 'REQUIRED', `第 ${i + 1} 科的科目名称不能为空`);
    }
    if (s.full.kind === 'invalid') add(`subjectScores[${i}].full`, 'NOT_A_NUMBER', NOT_A_NUMBER_MESSAGE);
    if (s.score.kind === 'invalid') add(`subjectScores[${i}].score`, 'NOT_A_NUMBER', NOT_A_NUMBER_MESSAGE);
    if (s.full.kind === 'value' && s.full.value <= 0) {
      add(`subjectScores[${i}].full`, 'OUT_OF_RANGE', `${name}满分必须大于 0`);
    }
    if (s.score.kind === 'value' && s.full.kind === 'value' && s.full.value > 0 && s.score.value > s.full.value) {
      add(`subjectScores[${i}].score`, 'SCORE_EXCEEDS_FULL', `${name}分数不能超过满分 ${s.full.value}`);
    }
  });

  // 考查科目等级必须是 A/B/C/D
  const rawGrades = input.surveyGrades && typeof input.surveyGrades === 'object' ? input.surveyGrades : {};
  for (const [subject, grade] of Object.entries(rawGrades)) {
    if (!isSurveyGrade(grade)) {
      add(`surveyGrades.${subject}`, 'OUT_OF_RANGE', `${subject}等级必须是 A / B / C / D`);
    }
  }

  const ok = errors.length === 0;
  return {
    ok,
    errors,
    missingFields,
    value: ok ? normalizeExamInput(input, parsed, parsedSubjects) : null,
  };
}

function numOrNull(result: ParsedNumber | undefined): number | null {
  return result && result.kind === 'value' ? result.value : null;
}

/** 校验通过后转成规范 ExamInput（仅在 ok=true 时调用） */
function normalizeExamInput(
  input: RawExamInput,
  parsed: Record<string, ParsedNumber>,
  parsedSubjects: { subject: string; full: ParsedNumber; score: ParsedNumber }[],
): ExamInput {
  const subjectScores: SubjectScore[] = [];
  for (const s of parsedSubjects) {
    // ok=true 时每项均已通过校验，此处不会命中
    if (s.full.kind !== 'value' || s.score.kind !== 'value') continue;
    subjectScores.push({ subject: s.subject, full: s.full.value, score: s.score.value });
  }

  const surveyGrades: Record<string, SurveyGrade> = {};
  const rawGrades = input.surveyGrades && typeof input.surveyGrades === 'object' ? input.surveyGrades : {};
  for (const [subject, grade] of Object.entries(rawGrades)) {
    if (isSurveyGrade(grade)) surveyGrades[subject] = grade;
  }

  const groupName = typeof input.groupName === 'string' && input.groupName.trim() !== ''
    ? input.groupName.trim()
    : null;

  return {
    cityRank: numOrNull(parsed.cityRank),
    groupName,
    groupRank: numOrNull(parsed.groupRank),
    groupSize: numOrNull(parsed.groupSize),
    schoolRank: numOrNull(parsed.schoolRank),
    schoolSize: numOrNull(parsed.schoolSize),
    classRank: numOrNull(parsed.classRank),
    classSize: numOrNull(parsed.classSize),
    totalScore: numOrNull(parsed.totalScore),
    totalFull: numOrNull(parsed.totalFull),
    langMathEngTotal: numOrNull(parsed.langMathEngTotal),
    subjectScores,
    surveyGrades,
    qualityEval: input.qualityEval === true ? true : input.qualityEval === false ? false : null,
  };
}
