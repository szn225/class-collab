import { describe, expect, it } from 'vitest';
import type { Dataset, ExamRecord } from '../../core/types';
import { STORAGE_KEYS } from '../../core/types';
import { LocalDataSource, createLocalDataSource } from '../local-datasource';
import { MemoryStorage, type StorageLike, type WxStorageApi } from '../storage';
import { validateDataset } from '../validate-dataset';
import rawBundledDataset from '../../data/dataset-2026.cs.1.json';
import { makeRecord } from '../../core/__tests__/fixtures';

const bundledValidated = validateDataset(rawBundledDataset);
if (!bundledValidated.ok) {
  throw new Error(`内置数据集校验失败：${JSON.stringify(bundledValidated.issues)}`);
}
const bundled: Dataset = bundledValidated.value;

function setup(): { storage: MemoryStorage; ds: LocalDataSource } {
  const storage = new MemoryStorage();
  return { storage, ds: createLocalDataSource({ storage }) };
}

async function expectDataSourceError(promise: Promise<unknown>, code: string): Promise<void> {
  await expect(promise).rejects.toMatchObject({ code, name: 'DataSourceError' });
}

describe('validateDataset —— 内置数据集与导入校验（§6.3.3 / AC-31）', () => {
  it('随包数据集校验通过，且与 SPEC 事实一致', () => {
    expect(bundledValidated.ok).toBe(true);
    expect(bundled.dataVersion).toBe('2026.CS.1');
    expect(bundled.admissionLines).toHaveLength(72);
    expect(bundled.admissionLines.filter((a) => a.cityRank !== null)).toHaveLength(57);
    expect(bundled.admissionLines.filter((a) => a.cityRank === null)).toHaveLength(15);
    expect(bundled.indicatorSchools).toHaveLength(150);
    expect(bundled.tierThresholds).toHaveLength(8);
    expect(bundled.groupCoeffs).toEqual({ 长郡: 3.52, 雅礼: 4.23, '师大附中': 5.11, 长沙市一中: 7.82 });
    expect(bundled.groupTiers).toHaveLength(11);
    expect(bundled.rulePoints).toHaveLength(8);
    expect(bundled.controlLines).toEqual({ tier1: 563, tier2: 553, tier3: 516 });
  });

  it('缺必填字段 / 非对象 / 阈值非单调 → 拒绝并给出字段级问题', () => {
    expect(validateDataset(null).ok).toBe(false);
    expect(validateDataset('{}').ok).toBe(false);
    expect(validateDataset([]).ok).toBe(false);

    const missing = validateDataset({ dataVersion: '2027.CS.1' });
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.issues.length).toBeGreaterThan(3);

    const nonMonotonic = validateDataset({
      ...rawBundledDataset,
      tierThresholds: [
        { upTo: 7250, tier: '四大本部' },
        { upTo: 4212, tier: '四大新校区' },
        { upTo: null, tier: '普高线附近' },
      ],
    });
    expect(nonMonotonic.ok).toBe(false);
    if (!nonMonotonic.ok) {
      expect(nonMonotonic.issues.some((i) => i.field === 'tierThresholds')).toBe(true);
    }

    const badCoeff = validateDataset({ ...rawBundledDataset, groupCoeffs: { 长郡: 0 } });
    expect(badCoeff.ok).toBe(false);
  });
});

describe('LocalDataSource —— 激活口径与内置兜底', () => {
  it('无激活指针 → 回退随包内置数据集', async () => {
    const { ds } = setup();
    const active = await ds.getActiveDataset();
    expect(active.dataVersion).toBe('2026.CS.1');
    expect(active.disclaimer).toBe(bundled.disclaimer);
  });

  it('激活指针指向不存在的版本 → DATASET_NOT_FOUND（不静默换口径）', async () => {
    const { storage, ds } = setup();
    storage.set(STORAGE_KEYS.activeDatasetVersion, '2099.CS.1');
    await expectDataSourceError(ds.getActiveDataset(), 'DATASET_NOT_FOUND');
  });

  it('listDatasets 默认含内置数据集', async () => {
    const { ds } = setup();
    expect(await ds.listDatasets()).toEqual([
      { dataVersion: '2026.CS.1', effectiveFrom: bundled.effectiveFrom },
    ]);
  });

  it('只在 STORAGE_KEYS 声明的键上落盘', async () => {
    const { storage, ds } = setup();
    await ds.saveRecord(makeRecord({ id: 'r1', examName: 'X', examDate: '2026-10-08', scope: 'group', input: { groupName: '长郡', groupRank: 210 } }));
    await ds.importDataset({ ...bundled });
    const keys = storage.rawKeys().sort();
    expect(keys).toEqual([STORAGE_KEYS.activeDatasetVersion, STORAGE_KEYS.records].sort());
    expect(STORAGE_KEYS).toEqual({
      records: 'records',
      datasets: 'datasets',
      activeDatasetVersion: 'activeDatasetVersion',
      plans: 'plans',
      settings: 'settings',
    });
  });
});

describe('LocalDataSource —— 记录读写（§6.1 records）', () => {
  it('保存 / 覆盖同 id / 读取 / 删除', async () => {
    const { ds } = setup();
    const record = makeRecord({ id: 'r1', examName: '10月集团联考', examDate: '2026-10-08', scope: 'group', input: { groupName: '长郡', groupRank: 210 } });
    await ds.saveRecord(record);
    expect(await ds.getRecords()).toHaveLength(1);

    const updated: ExamRecord = { ...record, examName: '10月集团联考（修订）' };
    await ds.saveRecord(updated);
    const records = await ds.getRecords();
    expect(records).toHaveLength(1);
    expect(records[0].examName).toBe('10月集团联考（修订）');

    await ds.deleteRecord('r1');
    expect(await ds.getRecords()).toEqual([]);
  });

  it('缺 id 的记录拒绝落盘 → RECORD_SAVE_FAILED', async () => {
    const { ds } = setup();
    const broken = { ...makeRecord({ id: '', examName: 'X', examDate: '2026-10-08', scope: 'school', input: { schoolRank: 1, schoolSize: 10 } }) };
    await expectDataSourceError(ds.saveRecord(broken), 'RECORD_SAVE_FAILED');
  });

  it('存储写入失败 → RECORD_SAVE_FAILED（不吞异常）', async () => {
    const failing = new FailingStorage();
    failing.failOn.add(STORAGE_KEYS.records);
    const ds = createLocalDataSource({ storage: failing });
    const record = makeRecord({ id: 'r1', examName: 'X', examDate: '2026-10-08', scope: 'group', input: { groupName: '长郡', groupRank: 210 } });
    await expectDataSourceError(ds.saveRecord(record), 'RECORD_SAVE_FAILED');
  });

  it('存储里的脏数据（非数组）→ 返回空列表而非崩溃', async () => {
    const { storage, ds } = setup();
    storage.set(STORAGE_KEYS.records, { not: 'an array' });
    expect(await ds.getRecords()).toEqual([]);
  });
});

describe('LocalDataSource —— importDataset 年度热切换（§6.3 / AC-30 / AC-31）', () => {
  it('导入新版本 → 校验通过才落盘，激活指针切换', async () => {
    const { storage, ds } = setup();
    const next: Dataset = { ...bundled, dataVersion: '2027.CS.1', effectiveFrom: '2027-07' };
    await ds.importDataset(next);

    expect(storage.get(STORAGE_KEYS.activeDatasetVersion)).toBe('2027.CS.1');
    expect(storage.get(STORAGE_KEYS.datasets)).toEqual([next]);
    const active = await ds.getActiveDataset();
    expect(active.dataVersion).toBe('2027.CS.1');
    expect((await ds.listDatasets()).map((d) => d.dataVersion)).toEqual(['2026.CS.1', '2027.CS.1']);
  });

  it('导入非法数据集 → IMPORT_INVALID，且现有数据完全不变（AC-31）', async () => {
    const { storage, ds } = setup();
    const broken = { ...bundled, dataVersion: '2027.CS.1', examTotalScore: 0 };
    await expectDataSourceError(ds.importDataset(broken), 'IMPORT_INVALID');
    expect(storage.get(STORAGE_KEYS.datasets)).toBeUndefined();
    expect(storage.get(STORAGE_KEYS.activeDatasetVersion)).toBeUndefined();
    expect((await ds.getActiveDataset()).dataVersion).toBe('2026.CS.1');
  });

  it('dataVersion 已存在但内容不同 → IMPORT_INVALID，旧数据保留', async () => {
    const { storage, ds } = setup();
    const tampered: Dataset = { ...bundled, disclaimer: '被篡改的免责声明' };
    await expectDataSourceError(ds.importDataset(tampered), 'IMPORT_INVALID');
    expect(storage.get(STORAGE_KEYS.activeDatasetVersion)).toBeUndefined();
    expect((await ds.getActiveDataset()).disclaimer).toBe(bundled.disclaimer);
  });

  it('dataVersion 与内容完全一致 → 幂等成功（备份恢复可重复执行）', async () => {
    const { storage, ds } = setup();
    await ds.importDataset({ ...bundled });
    expect(storage.get(STORAGE_KEYS.activeDatasetVersion)).toBe('2026.CS.1');
    // 内置版本无需重复存储
    expect(storage.get(STORAGE_KEYS.datasets)).toBeUndefined();
    expect((await ds.getActiveDataset()).dataVersion).toBe('2026.CS.1');
  });

  it('落盘失败 → IMPORT_INVALID 且整体回滚，保留导入前的数据集与激活指针', async () => {
    const storage = new FailingStorage();
    const ds = createLocalDataSource({ storage });

    // 先成功导入 2027，形成「旧数据」
    await ds.importDataset({ ...bundled, dataVersion: '2027.CS.1' });
    expect(storage.get(STORAGE_KEYS.activeDatasetVersion)).toBe('2027.CS.1');
    const datasetsBefore = storage.get(STORAGE_KEYS.datasets);

    // 再导入 2028，但激活指针写入失败 → 必须回滚（datasets 也不能留下 2028）
    storage.failOn.add(STORAGE_KEYS.activeDatasetVersion);
    await expectDataSourceError(ds.importDataset({ ...bundled, dataVersion: '2028.CS.1' }), 'IMPORT_INVALID');
    storage.failOn.clear();

    expect(storage.get(STORAGE_KEYS.activeDatasetVersion)).toBe('2027.CS.1');
    expect(storage.get(STORAGE_KEYS.datasets)).toEqual(datasetsBefore);
    expect((await ds.getActiveDataset()).dataVersion).toBe('2027.CS.1');
  });
});

describe('createWxStorage —— wx 适配层（node 下注入桩，不依赖真机）', () => {
  it('getStorageSync 返回空串 → 视为无数据；写入走 JSON 序列化', async () => {
    const fake = new FakeWxStorage();
    const ds = createLocalDataSource({ wx: fake });
    const active = await ds.getActiveDataset();
    expect(active.dataVersion).toBe('2026.CS.1');

    await ds.importDataset({ ...bundled });
    expect(fake.getStorageSync(STORAGE_KEYS.activeDatasetVersion)).toBe(JSON.stringify('2026.CS.1'));
    expect(await ds.listDatasets()).toHaveLength(1);
  });
});

/* ------------------------------------------------------------------ 测试替身 */

/** 可指定键写入失败的存储（验证原子回滚） */
class FailingStorage implements StorageLike {
  private readonly inner = new MemoryStorage();
  readonly failOn = new Set<string>();

  get(key: string): unknown {
    return this.inner.get(key);
  }

  set(key: string, value: unknown): void {
    if (this.failOn.has(key)) throw new Error(`写入 ${key} 失败（模拟存储不可用）`);
    this.inner.set(key, value);
  }

  remove(key: string): void {
    this.inner.remove(key);
  }
}

/** wx.storage 桩：与真机语义一致（不存在返回空串；存裸值，序列化由适配层负责） */
class FakeWxStorage implements WxStorageApi {
  private readonly map = new Map<string, unknown>();

  getStorageSync(key: string): unknown {
    return this.map.has(key) ? this.map.get(key) : '';
  }

  setStorageSync(key: string, data: unknown): void {
    this.map.set(key, data);
  }

  removeStorageSync(key: string): void {
    this.map.delete(key);
  }
}
