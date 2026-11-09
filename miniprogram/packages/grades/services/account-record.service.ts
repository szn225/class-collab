import type { Dataset, ExamRecord } from '../core/types';
import type { RecordForm } from './record-form';
import { recordService } from './record.service';
import { scopeKey, guardAwait } from '../utils/scope';
const grades = require('../../../utils/grades');
const auth = require('../../../utils/auth');

/** A save action owns a stable record ID, so retrying a lost cloud response cannot duplicate an exam. */
export async function saveRecordToAccount(form: RecordForm, dataset: Dataset, id: string): Promise<ExamRecord> {
  if (!auth.isLoggedIn()) throw new Error('请登录后保存成绩');
  const scope = scopeKey();
  if (!grades.status().enabled) await guardAwait(grades.enableSync(), scope);
  if (grades.status().conflict) throw new Error('两份成绩资料有冲突，填写内容已保留。请在学生设置中选择要保留的版本。');
  const existing = await guardAwait(recordService.get(id), scope);
  const record = existing || await guardAwait(recordService.save(form, dataset, id), scope);
  await guardAwait(grades.sync(), scope);
  if (grades.status().conflict) throw new Error('云端有更新，成绩已保留在本机。请在学生设置中处理后重试。');
  return record;
}
