const { storage: gradeStorage } = require('../../../utils/grades');
/**
 * data-source —— 数据源装配层（唯一实例）
 *
 * 职责：把 datasource/LocalDataSource 绑定到小程序 wx.storage，向上只暴露
 *      core/types 的 `DataSource` 接口（架构 C6：数据源经接口访问，不直接 import 具体实现）。
 * 集成/切换：换云数据源时只改这里一行，services 与页面零改动。
 */

import { createDataSourceError, createLocalDataSource } from '../datasource/local-datasource';
import type { DataSource, DataSourceError } from '../core/types';

let instance: DataSource | null = null;
let instanceScope = '';
const { scopeKey } = require('../../../utils/grades');

/** 本地数据源单例（wx.storage 适配） */
export function getDataSource(): DataSource {
  if (!instance || instanceScope !== scopeKey()) {
    instanceScope = scopeKey();
    const scopedStorage = gradeStorage.bind(instanceScope);
    instance = createLocalDataSource({
      wx: {
        getStorageSync: (key: string) => scopedStorage.getStorageSync(key),
        setStorageSync: (key: string, data: unknown) => scopedStorage.setStorageSync(key, data),
        removeStorageSync: (key: string) => scopedStorage.removeStorageSync(key),
      },
    });
  }
  return instance;
}

/** 构造可判别错误码的错误（UI 据此给「重试 / 保留旧数据」出口） */
export { createDataSourceError };

/** 判定是否为数据源错误（含错误码） */
export function isDataSourceError(e: unknown): e is DataSourceError {
  return !!e && typeof e === 'object' && typeof (e as DataSourceError).code === 'string';
}

/** 数据源错误码 → 面向家长的可读提示 */
export function describeDataSourceError(e: unknown): string {
  if (!isDataSourceError(e)) return '操作失败，请重试';
  switch (e.code) {
    case 'DATASET_NOT_FOUND':
      return '参照数据缺失，请检查数据版本设置';
    case 'IMPORT_INVALID':
      return e.message || '导入的文件不合法';
    case 'RECORD_SAVE_FAILED':
      return '保存失败，请重试';
    default:
      return '操作失败，请重试';
  }
}
