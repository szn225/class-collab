import { scopeKey, guardAwait } from '../utils/scope';
const { storage: gradeStorage } = require('../../../utils/grades');
/**
 * record.service —— 录入与记录编排（SPEC §7 页2/页3 / UIUX §9.2 §9.3）
 *
 * 依赖：core/positioning 纯函数 + services/record-form 纯校验 + 数据源。
 * 职责：实时结论条、保存（500ms 内出结论）、草稿续填、历史画像沿用、考试详情装配。
 */

import { deriveSnapshot, position, SCHOOL_SCOPE_NOTE } from '../core/positioning';
import type { Dataset, ExamRecord, SubjectAnalysis } from '../core/types';
import { formatDateCn, formatDiff, formatPct, formatRank, formatRankDelta, formatScoreRate, scopeLabel } from '../utils/format';
import type { DeltaView } from '../utils/format';
import { createDataSourceError, getDataSource } from './data-source';
import { buildTierVerdict } from './position.service';
import { profileOf, toExamInput, validateForm } from './record-form';
import type { ExamProfile, RecordForm } from './record-form';

const DRAFT_KEY = 'exam_draft';
const PROFILE_KEY = 'last_exam_profile';

/** 失分归因五选一（UIUX §9.3；用于空态提示，不臆造数值） */
export const ATTRIBUTION_CATEGORIES = ['审题粗心', '知识漏洞', '方法不会', '时间不够', '书写规范'] as const;

/* -------------------------------------------------- 实时结论条 */

export interface PreviewView {
  state: 'guide' | 'ok';
  label: string;
  value: string;
  tierText: string;
  tierKey: string;
  delta: DeltaView | null;
  guideText: string;
  note: string;
}

function guideTextOf(form: RecordForm): string {
  if (form.scope === 'city') return '填完全市位次，这里显示全市位次';
  if (form.scope === 'group') return '填完集团排名，这里显示（约）全市位次';
  return '填完校排名与校总人数，这里显示校内位次%';
}

class RecordService {
  /** 纯函数：录入中的实时结论（防抖后调用，§9.2.5） */
  buildPreview(form: RecordForm, dataset: Dataset, prevCityRank: number | null): PreviewView {
    const input = toExamInput(form);
    const snap = deriveSnapshot(form.scope, input, dataset, prevCityRank);
    const res = position(form.scope, input, dataset);

    if (form.scope === 'school') {
      // 口径隔离：只回显校内位次%，不显示折算位次与档次
      const pct = snap.schoolPositionPct;
      if (pct === null) {
        return { state: 'guide', label: '校内位次', value: '—', tierText: '', tierKey: '', delta: null, guideText: guideTextOf(form), note: '' };
      }
      return {
        state: 'ok',
        label: '校内位次',
        value: formatPct(pct),
        tierText: '',
        tierKey: '',
        delta: null,
        guideText: '',
        note: SCHOOL_SCOPE_NOTE,
      };
    }

    const rank = snap.estimatedCityRank;
    if (rank === null) {
      return {
        state: 'guide',
        label: form.scope === 'city' ? '全市位次' : '折算全市位次（约）',
        value: '—',
        tierText: '',
        tierKey: '',
        delta: null,
        guideText: guideTextOf(form),
        note: res.note || '',
      };
    }
    const cards = buildTierVerdict(rank, dataset);
    const hit = cards.find((c) => c.tierName === snap.tier);
    return {
      state: 'ok',
      label: form.scope === 'city' ? '全市位次' : '折算全市位次（约）',
      value: formatRank(rank),
      tierText: snap.tier ? `${snap.tier} · ${hit ? hit.label : ''}`.trim() : '',
      tierKey: hit ? hit.key : 'wen',
      delta: formatRankDelta(snap.deltaVsPrevRank),
      guideText: '',
      note: '',
    };
  }

  /* -------------------------------------------------- 保存 */

  /** 最近一次「可折算」位次（用于 delta，AC-22：校内考试不参与） */
  async lastConnectableRank(): Promise<number | null> {
 const gradeOperationScope = scopeKey(); void gradeOperationScope;

    const records = await guardAwait(getDataSource().getRecords(), gradeOperationScope);
    const asc = records.slice().sort((a, b) => (a.examDate < b.examDate ? -1 : 1));
    for (let i = asc.length - 1; i >= 0; i -= 1) {
      const r = asc[i].derivedSnapshot ? asc[i].derivedSnapshot.estimatedCityRank : null;
      if (r !== null && r !== undefined) return r;
    }
    return null;
  }

  /** 保存：校验 → 换算冻结 → 落盘 → 清草稿 → 记画像（AC-06/08/11） */
  async save(form: RecordForm, dataset: Dataset, recordId?: string): Promise<ExamRecord> {
 const gradeOperationScope = scopeKey(); void gradeOperationScope;

    const v = validateForm(form, dataset);
    if (!v.ok || !v.value) {
      throw createDataSourceError(
        'RECORD_SAVE_FAILED',
        v.missingLabels.length ? `还差 ${v.missingLabels.length} 项：${v.missingLabels[0]}` : '请检查标红的输入项',
      );
    }
    const input = v.value;
    const prev = await guardAwait(this.lastConnectableRank(), gradeOperationScope);
    const now = new Date().toISOString();
    const record: ExamRecord = {
      id: recordId || `rec_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      datasetVersion: dataset.dataVersion,
      examName: form.examName.trim() || '未命名考试',
      examDate: form.examDate,
      scope: form.scope,
      input,
      derivedSnapshot: deriveSnapshot(form.scope, input, dataset, prev),
      createdAt: now,
      updatedAt: now,
    };
    await guardAwait(getDataSource().saveRecord(record), gradeOperationScope);
    this.saveProfile(profileOf(form));
    this.clearDraft();
    return record;
  }

  async list(): Promise<ExamRecord[]> {
 const gradeOperationScope = scopeKey(); void gradeOperationScope;

    const records = await guardAwait(getDataSource().getRecords(), gradeOperationScope);
    return records.slice().sort((a, b) => (a.examDate < b.examDate ? 1 : -1));
  }

  async get(id: string): Promise<ExamRecord | null> {
 const gradeOperationScope = scopeKey(); void gradeOperationScope;

    const records = await guardAwait(getDataSource().getRecords(), gradeOperationScope);
    return records.find((r) => r.id === id) || null;
  }

  async remove(id: string): Promise<void> {
 const gradeOperationScope = scopeKey(); void gradeOperationScope;

    await guardAwait(getDataSource().deleteRecord(id), gradeOperationScope);
  }

  /* -------------------------------------------------- 草稿 / 画像（本机缓存，非备份范围） */

  saveDraft(form: RecordForm): void {
    try {
      gradeStorage.setStorageSync(DRAFT_KEY, { form, savedAt: Date.now() });
    } catch (e) {
      /* 草稿失败不阻断录入 */
    }
  }

  getDraft(): { form: RecordForm; savedAt: number } | null {
    try {
      const raw = gradeStorage.getStorageSync(DRAFT_KEY);
      if (raw && typeof raw === 'object' && (raw as { form?: RecordForm }).form) {
        return raw as { form: RecordForm; savedAt: number };
      }
    } catch (e) {
      /* ignore */
    }
    return null;
  }

  clearDraft(): void {
    try {
      gradeStorage.removeStorageSync(DRAFT_KEY);
    } catch (e) {
      /* ignore */
    }
  }

  saveProfile(profile: ExamProfile): void {
    try {
      gradeStorage.setStorageSync(PROFILE_KEY, profile);
    } catch (e) {
      /* ignore */
    }
  }

  /** 画像：优先本地缓存，缺失则由最近一条记录回推（AC-04/05） */
  async getProfile(): Promise<ExamProfile | null> {
 const gradeOperationScope = scopeKey(); void gradeOperationScope;

    try {
      const raw = gradeStorage.getStorageSync(PROFILE_KEY);
      if (raw && typeof raw === 'object' && (raw as ExamProfile).scope) return raw as ExamProfile;
    } catch (e) {
      /* ignore */
    }
    const latest = (await guardAwait(this.list(), gradeOperationScope))[0];
    if (!latest) return null;
    return {
      scope: latest.scope,
      groupName: latest.input.groupName || '',
      groupSize: latest.input.groupSize !== null ? String(latest.input.groupSize) : '',
      schoolSize: latest.input.schoolSize !== null ? String(latest.input.schoolSize) : '',
      examName: latest.examName,
    };
  }

  /* -------------------------------------------------- 考试详情（UIUX §9.3） */

  buildExamDetail(record: ExamRecord): ExamDetailView {
    const snap = record.derivedSnapshot;
    const analyses: SubjectAnalysis[] = snap ? snap.subjectAnalysis : [];
    const subjectRows: SubjectRowView[] = analyses.map((a) => ({
      subject: a.subject,
      scoreText: (() => { const score = (record.input.subjectScores || []).find(s => s.subject === a.subject); return score && Number.isFinite(score.score) ? String(score.score) : ''; })(),
      rate: a.rate,
      rateText: formatScoreRate(a.rate),
      barPct: Math.max(0, Math.min(100, Math.round(a.rate * 100))),
      hasTick: a.vsSchoolAvg !== null,
      tickPct: a.vsSchoolAvg !== null ? Math.max(0, Math.min(100, Math.round((a.rate - a.vsSchoolAvg / 100) * 100))) : 0,
      diffText: a.vsSchoolAvg !== null ? formatDiff(a.vsSchoolAvg) : '',
      diffDir: a.vsSchoolAvg !== null && a.vsSchoolAvg >= 0 ? 'p' : 'n',
    }));
    const attributionRows: AttributionRowView[] = analyses
      .filter((a) => a.attribution)
      .map((a) => ({ name: a.attribution as string, lostText: '' }));

    return {
      id: record.id,
      title: record.examName,
      metaText: `${formatDateCn(record.examDate)} · ${scopeLabel(record.scope)}`,
      totalText: record.input.totalScore !== null ? String(record.input.totalScore) : '—',
      totalFullText: record.input.totalFull !== null ? `/ ${record.input.totalFull} 分` : '',
      rankText:
        snap && snap.estimatedCityRank !== null
          ? `折算位次 ${formatRank(snap.estimatedCityRank)}`
          : snap && snap.schoolPositionPct !== null
            ? `校内位次 ${formatPct(snap.schoolPositionPct)}`
            : '无折算位次',
      isApprox: record.scope === 'group',
      delta: formatRankDelta(snap ? snap.deltaVsPrevRank : null),
      subjectRows,
      hasSubjects: subjectRows.length > 0,
      attributionRows,
      attributionHint: ATTRIBUTION_CATEGORIES.join(' / '),
    };
  }

}

export interface SubjectRowView {
  subject: string;
  scoreText: string;
  /** 得分率（0~1），用于「最低得分率科目」判定 */
  rate: number;
  rateText: string;
  barPct: number;
  hasTick: boolean;
  tickPct: number;
  diffText: string;
  diffDir: 'p' | 'n';
}

export interface AttributionRowView {
  name: string;
  lostText: string;
}

export interface ExamDetailView {
  id: string;
  title: string;
  metaText: string;
  totalText: string;
  totalFullText: string;
  rankText: string;
  isApprox: boolean;
  delta: DeltaView;
  subjectRows: SubjectRowView[];
  hasSubjects: boolean;
  attributionRows: AttributionRowView[];
  attributionHint: string;
}

export const recordService = new RecordService();
