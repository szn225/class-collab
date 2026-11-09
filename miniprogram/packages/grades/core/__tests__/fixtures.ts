/**
 * 测试夹具：直接引用【已冻结】的包内参照数据集，不做任何二次改写。
 * （core/ 的单测靠这份夹具保证「阈值/系数/满分从 Dataset 注入」这条铁律被真实检验）
 */

import type { Dataset, ExamInput, ExamRecord, ExamScope } from '../types';
import { deriveSnapshot } from '../positioning';
import rawDataset from '../../data/dataset-2026.cs.1.json';

/** 唯一口径来源：miniprogram/data/dataset-2026.cs.1.json */
export const dataset = rawDataset as unknown as Dataset;

export function makeInput(scope: ExamScope, overrides: Partial<ExamInput> = {}): ExamInput {
  return {
    cityRank: null,
    groupName: null,
    groupRank: null,
    groupSize: null,
    schoolRank: null,
    schoolSize: null,
    classRank: null,
    classSize: null,
    totalScore: null,
    totalFull: null,
    langMathEngTotal: null,
    subjectScores: [],
    surveyGrades: {},
    qualityEval: null,
    ...overrides,
  };
}

export interface MakeRecordParams {
  id: string;
  examName: string;
  examDate: string;
  scope: ExamScope;
  input?: Partial<ExamInput>;
  prevCityRank?: number | null;
}

export function makeRecord(params: MakeRecordParams): ExamRecord {
  const input = makeInput(params.scope, params.input);
  return {
    id: params.id,
    datasetVersion: dataset.dataVersion,
    examName: params.examName,
    examDate: params.examDate,
    scope: params.scope,
    input,
    derivedSnapshot: deriveSnapshot(params.scope, input, dataset, params.prevCityRank ?? null),
    createdAt: `${params.examDate}T00:00:00Z`,
    updatedAt: `${params.examDate}T00:00:00Z`,
  };
}
