/**
 * 全局类型契约（冻结稿 v1.0 / 对应 SPEC v1.0 §5 §6.2）
 *
 * 铁律：
 *   - core/ 与 pages/ 的一切阈值、系数、满分，必须从 Dataset 注入；代码中零魔法数字。
 *   - estimatedCityRank 为 null 表示"无全市位次"，禁止置 0、禁止外推。
 *   - 本文件仅声明类型，不含任何运行期逻辑。
 */

/* ============================================================
 * 一、参照数据集（data/dataset-2026.cs.1.json）
 * ============================================================ */

/** 城市排名口径 */
export type RankKind = 'exact' | 'before' | 'percentile' | 'unknown';

/**
 * 档次阈值（8 档）。
 * 规则：cityRank <= upTo 时归入本档；upTo 为 null 表示兜底档（普高线附近）。
 * 闭区间归更优档 —— 恰好等于阈值时归入该档。
 */
export interface TierThreshold {
  upTo: number | null;
  tier: string;
}

/** 三层次最低控制线（仅入围门槛，不等于录取线） */
export interface ControlLines {
  tier1: number;
  tier2: number;
  tier3: number;
}

/** 录取线参照条目（源表④，共 72 条；其中 cityRank 非空者 57 条） */
export interface AdmissionLine {
  seq: number;
  school: string;
  plan: number | null;
  /** 2026 实际录取线（含体育 50 分，总分 630） */
  cutoff: number | null;
  /** 录取线对应全市位次（约）；null = 无绝对位次参照，定位时必须排除 */
  cityRank: number | null;
  rankKind: RankKind;
  /** 源表原文，供追溯 */
  rankRaw: string;
  rankNote: string;
  /** 该录取线对应的语数英三科总分 */
  langMathEngTotal: number | null;
  batch: string | null;
}

/** 指标生四类对口之一（四大 / 四新 / 五小 / 其它） */
export interface IndicatorTier {
  counterpart: string | null;
  plan: number | null;
  /** 填报比（同一对口高中的报名人数 ÷ 计划数）；部分校未统计则为 null */
  fillRatio: number | null;
  /** 该初中对口高中的指标生实际录取最低分 */
  minScore: number | null;
}

/** 指标生对照条目（源表⑥，共 150 校） */
export interface IndicatorSchool {
  seq: number;
  group: string;
  school: string;
  district: string | null;
  graduates: number | null;
  indicatorTotal: number | null;
  tiers: {
    fourBig: IndicatorTier;
    fourNew: IndicatorTier;
    fiveSmall: IndicatorTier;
    other: IndicatorTier;
  };
}

/** 指标生规则要点（源表⑦，共 8 条） */
export interface RulePoint {
  title: string;
  detail: string;
}

/** 集团排名 → 高中层次对照（源表⑤，共 11 档） */
export interface GroupTier {
  groupRankLabel: string;
  cityRankLabel: string;
  tier: string;
}

/** 指标生总量 */
export interface IndicatorTotals {
  graduates: number;
  indicatorPlan: number;
  planByTier: {
    fourBig: number;
    fourNew: number;
    fiveSmall: number;
    other: number;
  };
  admitted: number;
  completionRate: number;
}

/** 参照数据集 —— 全系统唯一口径来源 */
export interface Dataset {
  dataVersion: string;
  region: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  note: string;
  sourceNote: string;
  disclaimer: string;
  examTotalScore: number;
  sportsScore: number;
  /** 考查科目（等级制，不计总分） */
  surveySubjects: string[];
  /** 计分科目；源表未逐科列明时为空数组 */
  countedSubjects: string[];
  tierThresholds: TierThreshold[];
  controlLines: ControlLines;
  groupCoeffs: Record<string, number>;
  groupSizes: Record<string, number>;
  groupTiers: GroupTier[];
  admissionLines: AdmissionLine[];
  indicatorSchools: IndicatorSchool[];
  indicatorTotals: IndicatorTotals;
  rulePoints: RulePoint[];
}

/* ============================================================
 * 二、用户记录
 * ============================================================ */

/** 考试范围（决定位次口径源） */
export type ExamScope = 'city' | 'group' | 'school';

/** 考查科目等级 */
export type SurveyGrade = 'A' | 'B' | 'C' | 'D';

/** 分科成绩 */
export interface SubjectScore {
  subject: string;
  full: number;
  score: number;
}

/** 录入输入（按 scope 条件必填；详见 SPEC §5 表 A 与 AC-01/02/03） */
export interface ExamInput {
  /** 统考：官方全市位次（口径源） */
  cityRank: number | null;
  /** 集团联考：关联集团 + 集团排名（口径源） */
  groupName: string | null;
  groupRank: number | null;
  groupSize: number | null;
  /** 校内考试：校排名 + 校总人数（口径源） */
  schoolRank: number | null;
  schoolSize: number | null;
  classRank: number | null;
  classSize: number | null;
  totalScore: number | null;
  totalFull: number | null;
  langMathEngTotal: number | null;
  subjectScores: SubjectScore[];
  surveyGrades: Record<string, SurveyGrade>;
  /** 综合素质评价是否达标 */
  qualityEval: boolean | null;
}

/** 分科分析结果 */
export interface SubjectAnalysis {
  subject: string;
  rate: number;
  vsSchoolAvg: number | null;
  vsGroupAvg: number | null;
  attribution: string | null;
}

/** 换算结果快照（写入时冻结，历史结论可复现） */
export interface DerivedSnapshot {
  schoolPositionPct: number | null;
  groupPositionPct: number | null;
  /** scope === 'school' 时恒为 null（不外推）；其余为折算约数 */
  estimatedCityRank: number | null;
  tier: string | null;
  tierIndex: number | null;
  deltaVsPrevRank: number | null;
  subjectAnalysis: SubjectAnalysis[];
}

/** 考试记录 */
export interface ExamRecord {
  id: string;
  /** 记录绑定的口径版本 */
  datasetVersion: string;
  examName: string;
  /** YYYY-MM-DD */
  examDate: string;
  scope: ExamScope;
  input: ExamInput;
  derivedSnapshot: DerivedSnapshot;
  createdAt: string;
  updatedAt: string;
}

/* ============================================================
 * 三、定位结果（core/ 纯函数输出）
 * ============================================================ */

export interface PositioningResult {
  /** 折算/采用后的全市位次；校内考试为 null */
  cityRank: number | null;
  /** 是否为折算约数（集团联考为 true，统考为 false） */
  isApprox: boolean;
  basis: ExamScope;
  tier: string | null;
  tierIndex: number | null;
  /** 校内考试时的引导文案等 */
  note: string | null;
}

/* ============================================================
 * 四、数据源接口（datasource/，可替换契约）
 * ============================================================ */

export type DataSourceErrorCode =
  | 'DATASET_NOT_FOUND'
  | 'IMPORT_INVALID'
  | 'RECORD_SAVE_FAILED';

export interface DataSourceError extends Error {
  code: DataSourceErrorCode;
}

/** 存储键（SPEC §6.1） */
export const STORAGE_KEYS = {
  records: 'records',
  datasets: 'datasets',
  activeDatasetVersion: 'activeDatasetVersion',
  plans: 'plans',
  settings: 'settings',
} as const;

export interface DataSource {
  getActiveDataset(): Promise<Dataset>;
  listDatasets(): Promise<Pick<Dataset, 'dataVersion' | 'effectiveFrom'>[]>;
  getRecords(): Promise<ExamRecord[]>;
  saveRecord(r: ExamRecord): Promise<void>;
  deleteRecord(id: string): Promise<void>;
  /** 年度热切换：校验通过才落盘 */
  importDataset(json: Dataset): Promise<void>;
}
