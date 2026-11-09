import raw from '../data/dataset-2026.cs.1';
import type { Dataset, ExamRecord } from '../core/types';
import { deriveSnapshot } from '../core/positioning';
import { emptyForm, toExamInput } from './record-form';
export function startDemo(): void {
 const dataset = raw as unknown as Dataset;
 let previous: number | null = null;
 const records: ExamRecord[] = [5200, 4800, 4300].map((rank, i) => {
  const date = ['2026-09-10', '2026-10-10', '2026-11-05'][i];
  const input = toExamInput({ ...emptyForm(date), scope: 'city', cityRank: String(rank) });
  const derivedSnapshot = deriveSnapshot('city', input, dataset, previous);
  previous = rank;
  return { id: 'demo_exam_' + i, datasetVersion: dataset.dataVersion, examName: ['入学检测（示例）','月考（示例）','期中（示例）'][i], examDate: date, scope: 'city', input, derivedSnapshot, createdAt: date+'T00:00:00.000Z', updatedAt: date+'T00:00:00.000Z' };
 });
 require('../../../utils/grades').startDemo({records:JSON.stringify(records)});
}
