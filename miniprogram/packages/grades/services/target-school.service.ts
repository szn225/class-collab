import { scopeKey, guardAwait } from '../utils/scope';
const { storage: gradeStorage } = require('../../../utils/grades');
/**
 * target-school.service —— 目标校（UIUX §9.6-5：标记为目标校 → 回流首页趋势目标线）
 *
 * 设计：
 *   - 只存「标记时的校名 + 目标高中名」两个字符串（本地存储，自用单端，不做云同步）；
 *   - 位次/实录线**不落盘**，每次读取时按当前数据集重算 —— 录取线更新后目标线自动跟随；
 *   - 目标校若无位次参照（cityRank 为空），视图 rank 为 null，趋势图不画该线，页面如实提示；
 *   - 存储在 `settings.targetSchool`（走 datasetService），以便随备份整包导出 / 导入（AC-29）。
 */

import { matchAdmissionSchool } from '../core/target-alias';
import type { AdmissionLine } from '../core/types';
import { formatRank } from '../utils/format';
import { getDataSource } from './data-source';
import { datasetService } from './dataset.service';

/** settings 里的键名（不新增顶层存储键，遵守 core/types.ts 的冻结契约） */
const SETTINGS_KEY = 'targetSchool';

/** 早期版本的裸存键（一次性迁移用，迁完即删） */
const LEGACY_KEY = 'target_school';

export interface TargetSchoolView {
  /** 标记来源校名（录取线页=高中校名；指标生对照页=初中校名） */
  school: string;
  /** 目标高中显示名（可能是指标生表里的简称，如「雅礼」） */
  counterpart: string;
  /** 匹配到的录取线规范校名；未匹配为空串（此时不画目标线） */
  admissionSchool: string;
  /** 折算/实录位次参照；无位次参照时为 null */
  rank: number | null;
  rankText: string;
  cutoffText: string;
  batch: string;
}

interface StoredTarget {
  school?: string;
  counterpart?: string;
}

class TargetSchoolService {
  /** 读取当前目标校（位次按当前数据集重新解析） */
  async get(): Promise<TargetSchoolView | null> {
 const gradeOperationScope = scopeKey(); void gradeOperationScope;

    const saved = this.read();
    if (!saved || !saved.counterpart) return null;
    const dataset = await guardAwait(getDataSource().getActiveDataset(), gradeOperationScope);
    const names = dataset.admissionLines.map((l) => l.school);
    const matched = matchAdmissionSchool(saved.counterpart, names);
    const line = matched ? dataset.admissionLines.find((l) => l.school === matched) || null : null;
    return this.toView(saved.school || saved.counterpart, saved.counterpart, matched, line);
  }

  /**
   * 设为目标校。counterpart 必须是高中校名（录取线表里的 school），
   * 指标生对照页传「对口高中」，录取线页传「该校自身」。
   */
  async set(school: string, counterpart: string): Promise<TargetSchoolView | null> {
 const gradeOperationScope = scopeKey(); void gradeOperationScope;

    const name = (counterpart || school || '').trim();
    if (!name) return null;
    const stored: StoredTarget = { school, counterpart: name };
    datasetService.patchSettings({ [SETTINGS_KEY]: stored });
    return this.get();
  }

  /** 取消目标校：置 null 而不是删键，保持 settings 结构稳定 */
  clear(): void {
    datasetService.patchSettings({ [SETTINGS_KEY]: null });
    try {
      // 用户已明确取消，旧键留着只会在下一次 read() 时把目标校「复活」
      gradeStorage.removeStorageSync(LEGACY_KEY);
    } catch (e) {
      /* 清理失败不影响 clear 语义 */
    }
  }

  private read(): StoredTarget | null {
    try {
      const raw = datasetService.getSettings()[SETTINGS_KEY];
      if (raw && typeof raw === 'object') return raw as StoredTarget;
    } catch (e) {
      /* 落到下面的迁移兜底 */
    }
    return this.migrateLegacy();
  }

  /**
   * 一次性迁移：早期版本把目标校裸存在 target_school（未进备份，升级后会「莫名消失」）。
   * 只在 settings 里没有目标校时才读；读到即写回 settings 并删除旧键，因此只会发生一次。
   *
   * 识别顺序（先救人、再清垃圾）：
   *   1) 纯字符串 = 只存了校名；
   *   2) 对象 = 取 counterpart，没有就退到 school —— 早期 set() 的 `(counterpart || school)`
   *      兜底会产生「只有 school、没有 counterpart」的历史形态，直接判脏会把用户目标校删掉；
   *   3) 两者都拿不到才算垃圾，此时才删旧键，避免每次 read() 反复读一个永远救不回来的值。
   */
  private migrateLegacy(): StoredTarget | null {
    try {
      const legacy = gradeStorage.getStorageSync(LEGACY_KEY);
      if (!legacy) return null; // 键不存在 / 空值：无事可做，也不必删

      let candidate: StoredTarget | null = null;
      if (typeof legacy === 'string') {
        const name = legacy.trim();
        candidate = name ? { counterpart: name } : null;
      } else if (typeof legacy === 'object') {
        const obj = legacy as StoredTarget;
        const counterpart = typeof obj.counterpart === 'string' ? obj.counterpart.trim() : '';
        const school = typeof obj.school === 'string' ? obj.school.trim() : '';
        // 只有 school 没有 counterpart 也要救：早期 set() 的 (counterpart || school) 兜底会产生这种形态
        const name = counterpart || school;
        candidate = name ? { school: school || name, counterpart: name } : null;
      }

      if (candidate) {
        // 先写新位置成功、再删旧键：顺序反了在写失败时会丢数据
        datasetService.patchSettings({ [SETTINGS_KEY]: candidate });
        gradeStorage.removeStorageSync(LEGACY_KEY);
        return candidate;
      }

      // 确认是垃圾（既无可用 counterpart 也无 school）→ 删掉，别让它每次 read() 都被反复读
      gradeStorage.removeStorageSync(LEGACY_KEY);
      return null;
    } catch (e) {
      // 迁移是尽力而为：任何异常都不打扰用户，按「没有目标校」处理
      return null;
    }
  }

  private toView(
    school: string,
    counterpart: string,
    admissionSchool: string,
    line: AdmissionLine | null,
  ): TargetSchoolView {
    const rank = line && line.cityRank !== null ? line.cityRank : null;
    return {
      school,
      counterpart,
      admissionSchool,
      rank,
      rankText: rank !== null ? `位次 ${formatRank(rank)}` : '无位次参照',
      cutoffText: line && line.cutoff !== null ? `${line.cutoff} 分` : '—',
      batch: line && line.batch ? line.batch : '',
    };
  }
}

export const targetSchoolService = new TargetSchoolService();
