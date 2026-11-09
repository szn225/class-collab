/**
 * 本地数据源（SPEC §5 契约 / §6 存储与数据结构 / §9.7 备份）
 *
 * 实现 core/types.ts 的 DataSource 接口，落在 wx.storage 上。
 *   - 存储键严格取自 STORAGE_KEYS（records / datasets / activeDatasetVersion / plans / settings）
 *   - 错误一律抛可判别错误码的 DataSourceError，绝不吞异常
 *   - importDataset：整包校验通过才落盘；落盘失败整体回滚、保留旧数据（§6.3.3 / §6.3.5）
 *   - 内置数据集 data/dataset-2026.cs.1.json 作为兜底（§6.1）
 *
 * 可测性：存储通过 StorageLike 注入（见 storage.ts），node 单测用 MemoryStorage。
 */

import type {
  Dataset,
  DataSource,
  DataSourceError,
  DataSourceErrorCode,
  ExamRecord,
} from '../core/types';
import { STORAGE_KEYS } from '../core/types';
import { MemoryStorage, createWxStorage, type StorageLike, type WxStorageApi } from './storage';
import { formatDatasetIssues, validateDataset } from './validate-dataset';
// 注意：小程序运行时无法 require .json（会去找 `xxx.json.js`），
// 故随包数据以 TS 模块形式引入；源数据仍是 data/dataset-2026.cs.1.json，
// 由 scripts/build_embedded_modules.py 生成、scripts/gate_frontend.py 保证同步。
import bundledRawDataset from '../data/dataset-2026.cs.1';

/** 构造可判别错误码的错误对象（UI 据 code 给出「重试 / 保留旧数据」出口） */
export function createDataSourceError(code: DataSourceErrorCode, message: string): DataSourceError {
  const error = new Error(message) as DataSourceError;
  error.name = 'DataSourceError';
  error.code = code;
  return error;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** 稳定的 JSON 序列化（键名排序），用于判断两份数据集内容是否完全一致 */
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(record[k])}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

export interface LocalDataSourceOptions {
  /** 存储实现；与 wx 二选一（wx 优先） */
  storage?: StorageLike;
  /** 小程序运行期注入 wx 对象 */
  wx?: WxStorageApi;
  /** 内置数据集加载器（默认读取随包 data/dataset-2026.cs.1.json，惰性校验） */
  loadBundledDataset?: () => Dataset;
}

export class LocalDataSource implements DataSource {
  private readonly storage: StorageLike;
  private readonly loader: () => Dataset;
  private bundledCache: Dataset | null = null;

  constructor(options: LocalDataSourceOptions = {}) {
    if (options.wx) {
      this.storage = createWxStorage(options.wx);
    } else {
      this.storage = options.storage ?? new MemoryStorage();
    }
    this.loader = options.loadBundledDataset ?? (() => this.loadBundledFromPackage());
  }

  /* -------------------------------------------------- 内置数据集 */

  /** 随包 JSON 兜底：首次使用时校验一次（包内数据非法属于构建事故，直接抛错暴露） */
  private loadBundledFromPackage(): Dataset {
    const result = validateDataset(bundledRawDataset);
    if (!result.ok) {
      throw createDataSourceError(
        'DATASET_NOT_FOUND',
        `内置数据集不合法：${formatDatasetIssues(result.issues)}`,
      );
    }
    return result.value;
  }

  private bundled(): Dataset {
    if (!this.bundledCache) this.bundledCache = this.loader();
    return this.bundledCache;
  }

  /* -------------------------------------------------- 内部读写 */

  private readStoredDatasets(): Dataset[] {
    const raw = this.storage.get(STORAGE_KEYS.datasets);
    if (!Array.isArray(raw)) return [];
    return raw.filter((d): d is Dataset => !!d && typeof d === 'object');
  }

  /** 可用数据集全集：用户导入的优先于同版本内置（同版本内容已在导入时校验一致） */
  private allDatasets(): Map<string, Dataset> {
    const map = new Map<string, Dataset>();
    const bundled = this.bundled();
    map.set(bundled.dataVersion, bundled);
    for (const d of this.readStoredDatasets()) map.set(d.dataVersion, d);
    return map;
  }

  /* -------------------------------------------------- DataSource 实现 */

  async getActiveDataset(): Promise<Dataset> {
    const pointer = this.storage.get(STORAGE_KEYS.activeDatasetVersion);
    const available = this.allDatasets();

    if (typeof pointer === 'string' && pointer.trim() !== '') {
      const found = available.get(pointer);
      if (found) return found;
      // 指针指向的数据集不存在（如换机后导入包缺失）—— 不静默改用其他口径，暴露给 UI 处理
      throw createDataSourceError(
        'DATASET_NOT_FOUND',
        `激活口径 ${pointer} 不存在，请重新导入该版本数据集或改用内置口径 ${this.bundled().dataVersion}`,
      );
    }

    // 无激活指针 → 内置数据集兜底（§6.1）
    return this.bundled();
  }

  async listDatasets(): Promise<Pick<Dataset, 'dataVersion' | 'effectiveFrom'>[]> {
    return Array.from(this.allDatasets().values()).map((d) => ({
      dataVersion: d.dataVersion,
      effectiveFrom: d.effectiveFrom,
    }));
  }

  async getRecords(): Promise<ExamRecord[]> {
    const raw = this.storage.get(STORAGE_KEYS.records);
    if (!Array.isArray(raw)) return [];
    return raw.filter((r): r is ExamRecord => !!r && typeof r === 'object');
  }

  async saveRecord(record: ExamRecord): Promise<void> {
    if (!record || typeof record.id !== 'string' || record.id === '') {
      throw createDataSourceError('RECORD_SAVE_FAILED', '记录缺少 id，拒绝落盘');
    }
    const records = await this.getRecords();
    const index = records.findIndex((r) => r.id === record.id);
    if (index >= 0) {
      records[index] = record;
    } else {
      records.push(record);
    }
    try {
      this.storage.set(STORAGE_KEYS.records, records);
    } catch (error) {
      throw createDataSourceError('RECORD_SAVE_FAILED', `保存记录失败：${errorMessage(error)}`);
    }
  }

  async deleteRecord(id: string): Promise<void> {
    const records = await this.getRecords();
    const next = records.filter((r) => r.id !== id);
    try {
      this.storage.set(STORAGE_KEYS.records, next);
    } catch (error) {
      throw createDataSourceError('RECORD_SAVE_FAILED', `删除记录失败：${errorMessage(error)}`);
    }
  }

  /**
   * 年度热切换（§6.3.2 / §6.3.3）：
   *   1. 整包校验（必填字段、tierThresholds 单调递增）—— 不通过直接 IMPORT_INVALID，不落盘
   *   2. dataVersion 唯一：与既有数据集同版本但内容不同 → IMPORT_INVALID（不得静默覆盖旧口径）；
   *      同版本且内容完全一致 → 幂等成功（保证备份恢复可重复执行）
   *   3. 原子落盘：datasets + activeDatasetVersion 一起写；任一失败整体回滚，保留旧数据
   */
  async importDataset(json: Dataset): Promise<void> {
    const validated = validateDataset(json);
    if (!validated.ok) {
      throw createDataSourceError(
        'IMPORT_INVALID',
        `数据集校验失败：${formatDatasetIssues(validated.issues)}`,
      );
    }
    const incoming = validated.value;

    const bundled = this.bundled();
    const stored = this.readStoredDatasets();
    const existing = stored.find((d) => d.dataVersion === incoming.dataVersion)
      ?? (bundled.dataVersion === incoming.dataVersion ? bundled : undefined);

    if (existing && stableStringify(existing) !== stableStringify(incoming)) {
      throw createDataSourceError(
        'IMPORT_INVALID',
        `数据集 ${incoming.dataVersion} 已存在且内容不同，拒绝覆盖（dataVersion 必须唯一）`,
      );
    }

    // 内置版本无需重复存储，只切激活指针
    const needWriteDataset = bundled.dataVersion !== incoming.dataVersion;
    const nextStored = needWriteDataset
      ? (existing ? stored.map((d) => (d.dataVersion === incoming.dataVersion ? incoming : d)) : [...stored, incoming])
      : stored;

    const prevStored = this.storage.get(STORAGE_KEYS.datasets);
    const prevPointer = this.storage.get(STORAGE_KEYS.activeDatasetVersion);

    try {
      if (needWriteDataset) this.storage.set(STORAGE_KEYS.datasets, nextStored);
      this.storage.set(STORAGE_KEYS.activeDatasetVersion, incoming.dataVersion);
    } catch (error) {
      // 原子回滚：尽力恢复导入前的 datasets 与激活指针
      try {
        if (prevStored === undefined) this.storage.remove(STORAGE_KEYS.datasets);
        else this.storage.set(STORAGE_KEYS.datasets, prevStored);
        if (prevPointer === undefined) this.storage.remove(STORAGE_KEYS.activeDatasetVersion);
        else this.storage.set(STORAGE_KEYS.activeDatasetVersion, prevPointer);
      } catch {
        // 回滚本身失败：原异常优先抛出（不吞导入失败），由 UI 提示用户重试
      }
      throw createDataSourceError('IMPORT_INVALID', `导入落盘失败，已回滚并保留旧数据：${errorMessage(error)}`);
    }
  }
}

/** 便捷工厂（与 class 等价，供 services 层按接口注入） */
export function createLocalDataSource(options: LocalDataSourceOptions = {}): LocalDataSource {
  return new LocalDataSource(options);
}
