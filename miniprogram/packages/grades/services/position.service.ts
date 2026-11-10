import { scopeKey, guardAwait } from '../utils/scope';
/**
 * position.service —— 定位仪表盘编排（SPEC §7 页1 / UIUX §9.1）
 *
 * 口径隔离（最关键）：
 *   - 最近一次 = 统考 / 集团联考 → 主指标 = 折算全市位次（约）+ 冲/稳/保 + delta
 *   - 最近一次 = 校内考试 → 主指标 = 校内位次%，**不显示折算位次与档次标签**，
 *     改显引导占位；delta 仅与「上一次校内考试」比位次%（AC-03 / AC-22）
 */

import { SCHOOL_SCOPE_NOTE } from '../core/positioning';
import type { Dataset, ExamRecord } from '../core/types';
import { formatDateCn, formatPct, formatRank, formatRankDelta, scopeLabel } from '../utils/format';
import type { DeltaView } from '../utils/format';
import { getDataSource } from './data-source';

export type VerdictKey = 'chong' | 'wen' | 'bao';

export interface TierVerdictCard {
  key: VerdictKey;
  label: string;
  tierName: string;
  lineText: string;
}

export interface HeroView {
  mode: 'city' | 'school';
  label: string;
  value: string;
  unit: string;
  delta: DeltaView | null;
  /** 中性 chip（如「校内考试 · 仅出校内位次%」） */
  chipText: string;
  subLine: string;
}

export interface ExamListItem {
  id: string;
  examName: string;
  dateText: string;
  scopeText: string;
  rankText: string;
  isApprox: boolean;
  tierText: string;
  scope: string;
}

export interface DashboardView {
  empty: boolean;
  latestLabel: string;
  hero: HeroView;
  /** 非空 = 校内考试口径隔离下的引导占位（替代折算位次/档次） */
  guide: string | null;
  verdicts: TierVerdictCard[];
  examList: ExamListItem[];
  records: ExamRecord[];
}

/* -------------------------------------------------- 冲/稳/保 判定（数据驱动） */

interface ThresholdRow {
  upTo: number | null;
  tier: string;
}

function thresholds(dataset: Dataset): ThresholdRow[] {
  return dataset.tierThresholds || [];
}

/**
 * 由「我的折算位次」推出 冲 / 稳 / 保 三档卡片。
 * 稳 = 我已经落在的档；冲 = 更优一档（还没够到）；保 = 更靠后一档（更稳）。
 * 线值直接取档次阈值（数据注入，零硬编码）。
 */
export function buildTierVerdict(myRank: number, dataset: Dataset): TierVerdictCard[] {
  const rows = thresholds(dataset);
  if (!rows.length) return [];

  let reached = rows.findIndex((r) => r.upTo !== null && myRank <= (r.upTo as number));
  if (reached < 0) reached = rows.length - 1;

  const card = (key: VerdictKey, label: string, idx: number): TierVerdictCard | null => {
    const row = rows[idx];
    if (!row) return null;
    const lineText =
      row.upTo === null ? '普高线附近' : `约 ${formatRank(row.upTo)} 位`;
    return { key, label, tierName: row.tier, lineText };
  };

  const out: TierVerdictCard[] = [];
  // 「冲」缺位（已是最优档）用占位补齐，保持三栏结构与语义顺序 冲 / 稳 / 保
  out.push(
    card('chong', '冲', reached - 1) || {
      key: 'chong',
      label: '冲',
      tierName: '已达最优档',
      lineText: '保持就好',
    },
  );
  const wen = card('wen', '稳', reached);
  if (wen) out.push(wen);
  out.push(
    card('bao', '保', reached + 1) || {
      key: 'bao',
      label: '保',
      tierName: '已是兜底档',
      lineText: '稳住即可',
    },
  );
  return out;
}

/* -------------------------------------------------- 单记录视图 */

function sortByDateAsc(list: ExamRecord[]): ExamRecord[] {
  return list.slice().sort((a, b) => (a.examDate < b.examDate ? -1 : a.examDate > b.examDate ? 1 : 0));
}

function latestOf(list: ExamRecord[]): ExamRecord | null {
  const asc = sortByDateAsc(list);
  return asc.length ? asc[asc.length - 1] : null;
}

function lastSchoolPositionPct(list: ExamRecord[], self: ExamRecord): number | null {
  const prev = sortByDateAsc(list).filter(
    (r) => r.scope === 'school' && r.id !== self.id && r.examDate <= self.examDate,
  );
  const last = prev.length ? prev[prev.length - 1] : null;
  return last && last.derivedSnapshot ? last.derivedSnapshot.schoolPositionPct : null;
}

function rankOf(r: ExamRecord): number | null {
  return r.derivedSnapshot ? r.derivedSnapshot.estimatedCityRank : null;
}

export function toExamListItem(r: ExamRecord): ExamListItem {
  const rank = rankOf(r);
  const isApprox = r.scope === 'group';
  return {
    id: r.id,
    examName: r.examName,
    dateText: formatDateCn(r.examDate),
    scopeText: scopeLabel(r.scope),
    rankText:
      rank !== null
        ? `${isApprox ? '折算位次约' : '全市位次'} ${formatRank(rank)}`
        : r.derivedSnapshot && r.derivedSnapshot.schoolPositionPct !== null
          ? `校内位次 ${formatPct(r.derivedSnapshot.schoolPositionPct)}`
          : '无折算位次',
    isApprox,
    tierText: r.derivedSnapshot && r.derivedSnapshot.tier ? r.derivedSnapshot.tier : '',
    scope: r.scope,
  };
}

class PositionService {
  async getDashboard(): Promise<DashboardView> {
 const gradeOperationScope = scopeKey(); void gradeOperationScope;

    const ds = getDataSource();
    const dataset = await guardAwait(ds.getActiveDataset(), gradeOperationScope);
    const records = await guardAwait(ds.getRecords(), gradeOperationScope);
    return this.buildDashboard(records, dataset);
  }

  /** 纯装配：便于单测与组件复用 */
  buildDashboard(records: ExamRecord[], dataset: Dataset): DashboardView {
    const latest = latestOf(records);
    const examList = records.length
      ? sortByDateAsc(records)
          .reverse()
          .map(toExamListItem)
      : [];

    if (!latest) {
      return {
        empty: true,
        latestLabel: '',
        hero: {
          mode: 'city',
          label: '折算全市位次（约）',
          value: '—',
          unit: '',
          delta: null,
          chipText: '',
          subLine: '',
        },
        guide: null,
        verdicts: [],
        examList: [],
        records: [],
      };
    }

    const label = latest.examName;
    const rank = rankOf(latest);
    const schoolPct = latest.derivedSnapshot ? latest.derivedSnapshot.schoolPositionPct : null;
    const groupPct = latest.derivedSnapshot ? latest.derivedSnapshot.groupPositionPct : null;

    if (latest.scope === 'school' || rank === null) {
      // —— 校内考试：口径隔离，只出校内位次% ——
      const prevPct = lastSchoolPositionPct(records, latest);
      let delta: DeltaView | null = null;
      if (schoolPct !== null && prevPct !== null) {
        // 位次% 变小 = 进步（同口径互比，AC-22）
        delta = formatRankDelta(Math.round((schoolPct - prevPct) * 10000));
      }
      const input = latest.input;
      const rankText =
        input.schoolRank !== null && input.schoolSize !== null
          ? `校排名 ${input.schoolRank} / 校总人数 ${input.schoolSize}`
          : '';
      return {
        empty: false,
        latestLabel: label,
        hero: {
          mode: 'school',
          label: '校内位次',
          value: schoolPct !== null ? formatPct(schoolPct) : '—',
          unit: '',
          delta,
          chipText: '校内考试 · 仅出校内位次%',
          subLine: rankText,
        },
        guide: SCHOOL_SCOPE_NOTE,
        verdicts: [],
        examList,
        records,
      };
    }

    // —— 有折算位次 ——
    const subParts: string[] = [];
    if (schoolPct !== null) subParts.push(`校内前 ${formatPct(schoolPct)}`);
    if (groupPct !== null) subParts.push(`集团前 ${formatPct(groupPct)}`);

    return {
      empty: false,
      latestLabel: label,
      hero: {
        mode: 'city',
        label: latest.scope === 'group' ? '折算全市位次（约）' : '全市位次',
        value: formatRank(rank),
        unit: '',
        delta: formatRankDelta(latest.derivedSnapshot ? latest.derivedSnapshot.deltaVsPrevRank : null),
        chipText: '',
        subLine: subParts.join(' · '),
      },
      guide: null,
      verdicts: buildTierVerdict(rank, dataset),
      examList,
      records,
    };
  }

  /** 最近一次「可折算」位次（供参照库标注冲/稳/保） */
  async getMyCityRank(): Promise<{ rank: number | null; isApprox: boolean; recordId: string | null }> {
 const gradeOperationScope = scopeKey(); void gradeOperationScope;

    const ds = getDataSource();
    const records = sortByDateAsc(await guardAwait(ds.getRecords(), gradeOperationScope));
    for (let i = records.length - 1; i >= 0; i -= 1) {
      const r = records[i];
      const rank = rankOf(r);
      if (rank !== null) return { rank, isApprox: r.scope === 'group', recordId: r.id };
    }
    return { rank: null, isApprox: false, recordId: null };
  }
}

export const positionService = new PositionService();
