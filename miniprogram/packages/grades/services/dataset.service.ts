import { scopeKey, guardAwait } from '../utils/scope';
const { storage: gradeStorage } = require('../../../utils/grades');
/**
 * dataset.service —— 数据集与备份编排（SPEC §6.1 / §9.7 F11）
 *
 * 依赖：services/data-source（DataSource 接口）+ datasource/validate-dataset（整包校验）
 * 范围：激活口径读取、备份导出/导入（原子语义）、年度数据集热切换、免责声明取用。
 */

import { formatDatasetIssues, validateDataset } from '../datasource/validate-dataset';
import { STORAGE_KEYS } from '../core/types';
import type { Dataset, ExamRecord } from '../core/types';
import { backupFileName } from '../utils/format';
import { createDataSourceError, getDataSource } from './data-source';

/** 备份文件结构（schema 自校验，防误传其他 JSON） */
export interface BackupFile {
  schema: 'lazymom-cj-tracker/backup';
  schemaVersion: number;
  exportedAt: string;
  dataVersion: string;
  payload: {
    records: ExamRecord[];
    datasets: Record<string, Dataset>;
    activeDatasetVersion: string;
    plans: unknown[];
    settings: Record<string, unknown>;
    extras?: Record<string, unknown>;
  };
}

export const BACKUP_SCHEMA = 'lazymom-cj-tracker/backup';
export const BACKUP_SCHEMA_VERSION = 2;

export interface DatasetMeta {
  dataVersion: string;
  region: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  note: string;
  sourceNote: string;
  disclaimer: string;
  examTotalScore: number;
  sportsScore: number;
  admissionLineCount: number;
  admissionLineRankedCount: number;
  indicatorSchoolCount: number;
  ruleCount: number;
}

function readRaw<T>(key: string, fallback: T): T {
  try {
    const raw = gradeStorage.getStorageSync(key);
    return raw === '' || raw === undefined || raw === null ? fallback : (raw as T);
  } catch (e) {
    return fallback;
  }
}

function writeRaw(key: string, value: unknown): void {
  gradeStorage.setStorageSync(key, value);
}

/**
 * 读「由 createWxStorage（datasource/storage.ts）写入」的键。
 *
 * 为什么需要单独一套：datasource 层的所有写入都先 `JSON.stringify` 再落盘，
 * 所以 `datasets` / `activeDatasetVersion` 在 wx 存储里的**原始形态是 JSON 文本**。
 * 裸 `gradeStorage.getStorageSync` 拿到的是字符串（如 `"2026.CS.1-QC"` 带引号），
 * 直接当对象/数组用就会静默失效。
 *
 * 边界：字符串但不是合法 JSON → 返回 fallback（不抛）；对象/数组原样返回（兼容历史裸存）。
 */
function readSerialized<T>(key: string, fallback: T): T {
  try {
    const raw = gradeStorage.getStorageSync(key);
    if (raw === '' || raw === undefined || raw === null) return fallback;
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw) as T;
      } catch (e) {
        return fallback;
      }
    }
    return raw as T;
  } catch (e) {
    return fallback;
  }
}

/**
 * 写「由 createWxStorage 读取」的键：必须先 stringify。
 * 若裸存字符串，读侧 `JSON.parse('2026.CS.1')` 会抛错并被当成「无数据」吞掉 →
 * 激活指针静默丢失、回退内置口径。读写必须成对使用同一序列化约定。
 */
function writeSerialized(key: string, value: unknown): void {
  gradeStorage.setStorageSync(key, JSON.stringify(value));
}

/**
 * 数据集并集（R4-06）：`incoming` 里同版本覆盖 `base`，`incoming` 没有的版本原样保留。
 *
 * 恢复备份时为什么不能直接覆盖成「只剩备份里的数据集」：
 * 备份只带内置口径（N-01 之前的老备份 `payload.datasets` 恒为 `{}`）时，
 * 覆盖会把用户自己导入的年度口径整个删掉，而那些口径下的历史记录仍留在本机
 * （`records` 是整包覆盖的，记录本身不会连带消失）—— 用户一切回那个年度口径就
 * `DATASET_NOT_FOUND`，等于备份把数据删了。
 *
 * 顺序：`base` 的原有顺序在前（存储快照 diff 更小），新版本追加在后。
 */
function mergeDatasets(base: Dataset[], incoming: Dataset[]): Dataset[] {
  const merged = base.slice();
  incoming.forEach((ds) => {
    const idx = merged.findIndex((x) => x.dataVersion === ds.dataVersion);
    if (idx >= 0) merged[idx] = ds;
    else merged.push(ds);
  });
  return merged;
}

class DatasetService {
  async getActiveDataset(): Promise<Dataset> {
 const gradeOperationScope = scopeKey(); void gradeOperationScope;

    return getDataSource().getActiveDataset();
  }

  /** 设置页 / 免责声明条所需的口径元信息 */
  async getMeta(): Promise<DatasetMeta> {
 const gradeOperationScope = scopeKey(); void gradeOperationScope;

    const d = await guardAwait(this.getActiveDataset(), gradeOperationScope);
    const ranked = d.admissionLines.filter((l) => l.cityRank !== null).length;
    return {
      dataVersion: d.dataVersion,
      region: d.region,
      effectiveFrom: d.effectiveFrom,
      effectiveTo: d.effectiveTo,
      note: d.note,
      sourceNote: d.sourceNote,
      disclaimer: d.disclaimer,
      examTotalScore: d.examTotalScore,
      sportsScore: d.sportsScore,
      admissionLineCount: d.admissionLines.length,
      admissionLineRankedCount: ranked,
      indicatorSchoolCount: d.indicatorSchools.length,
      ruleCount: d.rulePoints.length,
    };
  }

  async getDisclaimer(): Promise<string> {
 const gradeOperationScope = scopeKey(); void gradeOperationScope;

    const d = await guardAwait(this.getActiveDataset(), gradeOperationScope);
    return d.disclaimer;
  }

  async listDatasets(): Promise<Pick<Dataset, 'dataVersion' | 'effectiveFrom'>[]> {
 const gradeOperationScope = scopeKey(); void gradeOperationScope;

    return getDataSource().listDatasets();
  }

  /* -------------------- 导出（AC-29 / AC-32） -------------------- */

  /**
   * 生成备份内容。
   * @returns empty=true 表示无任何记录 → 调用方应提示「暂无可导出的数据」，不生成空文件（AC-32）
   */
  async buildBackup(): Promise<{ empty: boolean; fileName: string; content: string }> {
 const gradeOperationScope = scopeKey(); void gradeOperationScope;

    const ds = getDataSource();
    const records = await guardAwait(ds.getRecords(), gradeOperationScope);
    const fileName = backupFileName();
    if (records.length === 0 && !Object.keys(gradeStorage.getStorageSync(STORAGE_KEYS.settings) || {}).length && !(gradeStorage.getStorageSync(STORAGE_KEYS.plans) || []).length && !gradeStorage.getStorageSync('exam_draft')) {
      return { empty: true, fileName, content: '' };
    }
    const dataset = await guardAwait(ds.getActiveDataset(), gradeOperationScope);
    // datasets 由 datasource 经 createWxStorage 写入（原始形态是 JSON 文本）→ 必须 readSerialized
    const stored = readSerialized<Dataset[]>(STORAGE_KEYS.datasets, []);
    const datasetsMap: Record<string, Dataset> = {};
    if (Array.isArray(stored)) {
      stored.forEach((d) => {
        if (d && typeof d.dataVersion === 'string') datasetsMap[d.dataVersion] = d;
      });
    }
    const file: BackupFile = {
      schema: BACKUP_SCHEMA,
      schemaVersion: BACKUP_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      dataVersion: dataset.dataVersion,
      payload: {
        records,
        datasets: datasetsMap,
        activeDatasetVersion: readSerialized<string>(STORAGE_KEYS.activeDatasetVersion, dataset.dataVersion),
        plans: readRaw<unknown[]>(STORAGE_KEYS.plans, []),
        settings: readRaw<Record<string, unknown>>(STORAGE_KEYS.settings, {}),
        extras: Object.fromEntries(['exam_draft','last_exam_profile','exam_analysis_marks','target_school'].map(key => [key, gradeStorage.getStorageSync(key)])),
      },
    };
    return { empty: false, fileName, content: JSON.stringify(file) };
  }

  /* -------------------- 导入（AC-30 / AC-31 原子语义） -------------------- */

  /**
   * 校验并恢复备份。**整包校验通过才落盘**：任一字段非法即抛错，
   * 且不写任何键，现有数据完整保留（AC-31）。
   */
  async restoreFromText(text: string): Promise<void> {
 const gradeOperationScope = scopeKey(); void gradeOperationScope;

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      throw createDataSourceError('IMPORT_INVALID', '文件不是合法 JSON，无法解析');
    }
    if (!parsed || typeof parsed !== 'object') {
      throw createDataSourceError('IMPORT_INVALID', '备份内容不是对象');
    }
    const f = parsed as Partial<BackupFile>;
    if (f.schema !== BACKUP_SCHEMA) {
      throw createDataSourceError('IMPORT_INVALID', '不是本工具的备份文件（schema 不匹配）');
    }
    if (typeof f.schemaVersion !== 'number' || !Number.isInteger(f.schemaVersion) || f.schemaVersion < 1 || f.schemaVersion > BACKUP_SCHEMA_VERSION) {
      throw createDataSourceError('IMPORT_INVALID', `备份版本不受支持：${String(f.schemaVersion)}`);
    }
    const payload = f.payload;
    if (!payload || typeof payload !== 'object') {
      throw createDataSourceError('IMPORT_INVALID', '备份缺少 payload');
    }
    if (!Array.isArray(payload.records)) {
      throw createDataSourceError('IMPORT_INVALID', 'payload.records 必须是数组');
    }
    payload.records.forEach((r, i) => {
      const rec = r as Partial<ExamRecord>;
      if (!rec || typeof rec !== 'object' || !rec.id || !rec.examName || !rec.examDate || !rec.scope) {
        throw createDataSourceError('IMPORT_INVALID', `第 ${i + 1} 条记录缺少必备字段`);
      }
      if (!rec.derivedSnapshot || typeof rec.derivedSnapshot !== 'object') {
        throw createDataSourceError('IMPORT_INVALID', `第 ${i + 1} 条记录缺少换算快照`);
      }
    });
    const datasets = payload.datasets && typeof payload.datasets === 'object' ? payload.datasets : {};
    const storedDatasets: Dataset[] = [];
    Object.keys(datasets).forEach((v) => {
      const result = validateDataset((datasets as Record<string, unknown>)[v]);
      if (!result.ok) {
        throw createDataSourceError(
          'IMPORT_INVALID',
          `备份内数据集 ${v} 不合法：${formatDatasetIssues(result.issues)}`,
        );
      }
      storedDatasets.push(result.value);
    });
    if (payload.activeDatasetVersion !== undefined && typeof payload.activeDatasetVersion !== 'string') {
      throw createDataSourceError('IMPORT_INVALID', 'activeDatasetVersion 必须是字符串');
    }

    // 旧版（R-01 修复之前）导出的备份把指针写成了**带引号的 JSON 文本**（形如 双引号+2026.CS.1+双引号）。
    // 若原样再 writeSerialized 一次会变成被二次转义的文本，datasource 只 parse 一层 → 查不到版本 →
    // 抛 DATASET_NOT_FOUND，用户自己的旧备份再也恢复不了。这里先归一化去引号。
    const rawPointer = payload.activeDatasetVersion;
    const pointer =
      typeof rawPointer === 'string' ? rawPointer.trim().replace(/^"+|"+$/g, '') : '';

    // 口径可达性：本机已有（内置 + 用户导入）∪ 本次备份携带。
    // 不可达就整包拒绝（保持 AC-31 原子语义）—— 绝不静默回退内置口径（无声改口径比报错更难查）。
    if (pointer !== '') {
      const available = new Set<string>([
        ...(await guardAwait(getDataSource().listDatasets(), gradeOperationScope)).map((d) => d.dataVersion),
        ...storedDatasets.map((d) => d.dataVersion),
      ]);
      if (!available.has(pointer)) {
        throw createDataSourceError(
          'IMPORT_INVALID',
          `备份使用的口径 ${pointer} 本机没有，请先在「设置 → 切换年度口径」导入该版本数据集，再恢复备份`,
        );
      }
    }

    if (payload.extras && (typeof payload.extras !== 'object' || Array.isArray(payload.extras) || Object.keys(payload.extras).some(key => !['exam_draft','last_exam_profile','exam_analysis_marks','target_school'].includes(key)))) throw createDataSourceError('IMPORT_INVALID', '备份附加资料格式无效');
    // —— 校验全部通过，开始落盘 ——
    // 每个键都必须用「它的日常写入方」那套约定，否则恢复后的存储形态与平时不同，
    // 读取端只要哪天不再宽容就会在「恢复过备份的用户」身上炸（隐蔽的偶发 bug）。
    //   records            → local-datasource 经 createWxStorage 写，原始形态是 JSON 文本 → writeSerialized
    //   datasets / active… → 同上 → writeSerialized
    //   plans              → plan.service 直接 gradeStorage.setStorageSync(list) 存裸数组 → writeRaw
    //   settings           → 本文件 patchSettings 用 writeRaw 存裸对象 → writeRaw
    //
    // 数据集按**并集**落盘（R4-06）：左侧集合与上面口径可达性判定完全同源（本机已有 ∪ 备份携带），
    // 同版本以备份为准（用户要恢复的就是这份），备份没有的版本保留本机，不会被这份备份删掉。
    const localDatasets = readSerialized<Dataset[]>(STORAGE_KEYS.datasets, []);
    const keptDatasets = mergeDatasets(
      Array.isArray(localDatasets) ? localDatasets : [],
      storedDatasets,
    );
    try {
      gradeStorage.transaction(() => {
      if (payload.extras) Object.entries(payload.extras).forEach(([key, value]) => gradeStorage.setStorageSync(key, value));
      writeSerialized(STORAGE_KEYS.records, payload.records);
      writeSerialized(STORAGE_KEYS.datasets, keptDatasets);
      if (pointer) {
        writeSerialized(STORAGE_KEYS.activeDatasetVersion, pointer);
      }
      if (Array.isArray(payload.plans)) writeRaw(STORAGE_KEYS.plans, payload.plans);
      if (payload.settings && typeof payload.settings === 'object') {
        writeRaw(STORAGE_KEYS.settings, payload.settings);
      }
      });
    } catch (e) {
      throw createDataSourceError('RECORD_SAVE_FAILED', '写入本机存储失败，已保留原有数据');
    }
  }

  /** 年度热切换（ADR-005）：导入数据集 JSON，校验通过即切激活指针 */
  async importDatasetFromText(text: string): Promise<string> {
 const gradeOperationScope = scopeKey(); void gradeOperationScope;

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      throw createDataSourceError('IMPORT_INVALID', '文件不是合法 JSON，无法解析');
    }
    const result = validateDataset(parsed);
    if (!result.ok) {
      throw createDataSourceError('IMPORT_INVALID', `数据集校验失败：${formatDatasetIssues(result.issues)}`);
    }
    await guardAwait(getDataSource().importDataset(result.value), gradeOperationScope);
    return result.value.dataVersion;
  }

  /* -------------------- 设置项（本机） -------------------- */

  getSetting<T>(key: string, fallback: T): T {
    const all = this.getSettings();
    const v = all[key];
    return v === undefined ? fallback : (v as T);
  }

  /** 写单个设置项：复用 patchSettings（其底层 getSettings 已做脏值兜底，避免 strict 下赋值抛 TypeError） */
  setSetting(key: string, value: unknown): void {
    this.patchSettings({ [key]: value });
  }

  /**
   * 读取全部设置项。
   * 存储里的 settings 可能是历史脏值（字符串 / 数组 / null），统一兜底成 `{}`，
   * 保证调用方拿到的永远是可展开的对象。
   */
  getSettings(): Record<string, unknown> {
    const all = readRaw<Record<string, unknown>>(STORAGE_KEYS.settings, {});
    if (!all || typeof all !== 'object' || Array.isArray(all)) return {};
    return all;
  }

  /**
   * 浅合并写入设置项（只覆盖 patch 里出现的键，其余设置原样保留）。
   * 用于目标校这类「单键复合值」，避免整包覆盖掉其他设置。
   */
  patchSettings(patch: Record<string, unknown>): void {
    const next: Record<string, unknown> = { ...this.getSettings(), ...patch };
    writeRaw(STORAGE_KEYS.settings, next);
  }
}

export const datasetService = new DatasetService();
