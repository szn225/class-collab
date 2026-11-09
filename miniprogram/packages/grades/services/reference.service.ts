import { scopeKey, guardAwait } from '../utils/scope';
/**
 * reference.service —— 参照库编排（SPEC §7 页5 / §9.5–9.7 / UIUX §9.5–9.7）
 *
 * 三个子区：高中录取线（57 校，冲/稳/保自动判定）/ 指标生对照（150 校）/ 规则要点（8 条）。
 * 口径：冲/稳/保一律依据「我的折算位次」与录取线位次对比得出，家长零手算（AC-23）。
 */

import type { AdmissionLine, IndicatorSchool, IndicatorTier, RulePoint, SurveyGrade } from '../core/types';
import { formatRank } from '../utils/format';
import { datasetService } from './dataset.service';
import { getDataSource } from './data-source';
import { positionService } from './position.service';
import { TIER_META, VERDICT_LABEL } from './reference.types';
import type {
  AdmissionRow,
  AdmissionSort,
  AdmissionView,
  IndicatorDetailView,
  IndicatorGateView,
  IndicatorRow,
  IndicatorTierKey,
  IndicatorTierView,
  Verdict,
} from './reference.types';

export { TIER_META, VERDICT_LABEL };
export type {
  AdmissionRow,
  AdmissionSort,
  AdmissionView,
  IndicatorDetailView,
  IndicatorGateView,
  IndicatorRow,
  IndicatorTierKey,
  IndicatorTierView,
  Verdict,
};

/** 稳档区间：录取线位次 / 我的位次 落在 [1, 1.15] 视为「稳」 */
const STABLE_UPPER_RATIO = 1.15;

/** 冲/稳/保自动判定（AC-23）：未达线=冲，刚过线=稳，有余量=保 */
export function classifyVerdict(myRank: number, lineRank: number): Verdict {
  if (lineRank < myRank) return 'chong';
  return lineRank <= myRank * STABLE_UPPER_RATIO ? 'wen' : 'bao';
}

function numText(v: number | null | undefined, suffix = ''): string {
  return v === null || v === undefined || !Number.isFinite(v) ? '—' : `${formatRank(v)}${suffix}`;
}

class ReferenceService {
  /* -------------------- 录取线（57 校） -------------------- */

  async getAdmissionView(
    filter: {
      batch?: string;
      keyword?: string;
      onlyChong?: boolean;
      sort?: AdmissionSort;
      targetSchool?: string;
    } = {},
  ): Promise<AdmissionView> {
 const gradeOperationScope = scopeKey(); void gradeOperationScope;

    const ds = getDataSource();
    const dataset = await guardAwait(ds.getActiveDataset(), gradeOperationScope);
    const mine = await guardAwait(positionService.getMyCityRank(), gradeOperationScope);
    const myRank = mine.rank;

    // cityRank 为空的录取线无绝对位次参照，定位时必须排除（types.ts 注释）
    let rows: AdmissionLine[] = dataset.admissionLines.filter((l) => l.cityRank !== null);
    const rankedCount = rows.length;

    if (filter.batch && filter.batch !== '全部批次') {
      rows = rows.filter((l) => l.batch === filter.batch);
    }
    if (filter.keyword && filter.keyword.trim() !== '') {
      const kw = filter.keyword.trim();
      rows = rows.filter((l) => l.school.includes(kw));
    }

    const targetName = (filter.targetSchool || '').trim();

    const mapped = rows.map((l) => {
      const line = l.cityRank as number;
      const verdict = myRank !== null ? classifyVerdict(myRank, line) : null;
      const gap = myRank !== null ? line - myRank : null;
      return {
        rank: line,
        cutoff: l.cutoff,
        row: {
          seq: l.seq,
          school: l.school,
          cutoffText: l.cutoff !== null ? `${l.cutoff} 分` : '—',
          rankText: `位次 ${formatRank(line)}`,
          batch: l.batch || '',
          verdict,
          verdictLabel: verdict ? VERDICT_LABEL[verdict] : '',
          gapText: gap !== null ? (gap >= 0 ? `+${formatRank(gap)}` : `−${formatRank(Math.abs(gap))}`) : '',
          gapDir: gap === null ? 'flat' : gap > 0 ? 'p' : gap < 0 ? 'n' : 'flat',
          isTarget: targetName !== '' && l.school === targetName,
        } as AdmissionRow,
      };
    });

    // 排序（UIUX §9.5）：按位次升序（位次小的在前）为默认；按录取线降序（分数线高的在前），同分再看位次
    const sort: AdmissionSort = filter.sort === 'cutoff' ? 'cutoff' : 'rank';
    mapped.sort((a, b) => {
      if (sort === 'cutoff') {
        const ca = a.cutoff === null ? -1 : a.cutoff;
        const cb = b.cutoff === null ? -1 : b.cutoff;
        if (ca !== cb) return cb - ca;
      }
      return a.rank - b.rank;
    });

    const ordered = mapped.map((x) => x.row);
    const finalRows = filter.onlyChong ? ordered.filter((r) => r.verdict === 'chong') : ordered;

    return {
      myRankText: myRank !== null ? formatRank(myRank) : '—',
      hasRank: myRank !== null,
      rows: finalRows,
      rankedCount,
      note:
        myRank !== null
          ? `共 ${rankedCount} 所可位次参照 · 冲/稳/保按你的折算位次（约 ${formatRank(myRank)}）实时判定 · 2026 年实际录取线`
          : '还没有可折算的位次；录入一次集团联考或全市统考后，这里会按你的位次标注冲/稳/保',
    };
  }

  /* -------------------- 指标生对照（150 校） -------------------- */

  async getIndicatorRows(filter: { tier?: IndicatorTierKey | 'all'; keyword?: string } = {}): Promise<IndicatorRow[]> {
 const gradeOperationScope = scopeKey(); void gradeOperationScope;

    const dataset = await guardAwait(getDataSource().getActiveDataset(), gradeOperationScope);
    let list: IndicatorSchool[] = dataset.indicatorSchools;
    if (filter.keyword && filter.keyword.trim() !== '') {
      const kw = filter.keyword.trim();
      list = list.filter((s) => s.school.includes(kw) || s.group.includes(kw));
    }
    if (filter.tier && filter.tier !== 'all') {
      const key = filter.tier;
      list = list.filter((s) => s.tiers[key] && s.tiers[key].plan !== null);
    }
    return list.map((s) => {
      const tier = TIER_META.map((m) => ({ label: m.label, t: s.tiers[m.key] })).find(
        (x) => x.t && (x.t.plan !== null || x.t.minScore !== null || x.t.counterpart !== null),
      );
      const tt: IndicatorTier | null = tier ? tier.t : null;
      return {
        seq: s.seq,
        school: s.school,
        group: s.group,
        district: s.district || '',
        graduatesText: numText(s.graduates),
        indicatorTotalText: numText(s.indicatorTotal),
        topTierLabel: tier ? tier.label : '',
        topCounterpart: tt && tt.counterpart ? tt.counterpart : '—',
        topPlanText: tt ? numText(tt.plan, ' 个') : '—',
        topRatioText: tt && tt.fillRatio !== null ? tt.fillRatio.toFixed(2) : '—',
      };
    });
  }

  /** 单校指标生明细 + 校内竞争位 + 硬门槛（AC-26/27/28） */
  async getIndicatorDetail(
    schoolName: string | null,
    tierKey: IndicatorTierKey = 'fourBig',
  ): Promise<IndicatorDetailView> {
 const gradeOperationScope = scopeKey(); void gradeOperationScope;

    const ds = getDataSource();
    const dataset = await guardAwait(ds.getActiveDataset(), gradeOperationScope);
    const school = schoolName ? dataset.indicatorSchools.find((s) => s.school === schoolName) || null : null;

    // 校内竞争位：取最近一条记录了校排名的记录（AC-26）
    const records = await guardAwait(ds.getRecords(), gradeOperationScope);
    const asc = records.slice().sort((a, b) => (a.examDate < b.examDate ? -1 : 1));
    let schoolRank: number | null = null;
    let surveyGrades: Record<string, SurveyGrade> = {};
    let qualityEval: boolean | null = null;
    for (let i = asc.length - 1; i >= 0; i -= 1) {
      const inp = asc[i].input;
      if (schoolRank === null && inp.schoolRank !== null) schoolRank = inp.schoolRank;
      if (Object.keys(surveyGrades).length === 0 && inp.surveyGrades) surveyGrades = inp.surveyGrades;
      if (qualityEval === null && inp.qualityEval !== null) qualityEval = inp.qualityEval;
    }

    const tiers: IndicatorTierView[] = school
      ? TIER_META.map((m) => {
          const t = school.tiers[m.key];
          return {
            key: m.key,
            label: m.label,
            counterpart: t && t.counterpart ? t.counterpart : '—',
            planText: t ? numText(t.plan, ' 个') : '—',
            ratioText: t && t.fillRatio !== null ? t.fillRatio.toFixed(2) : '—',
            minScoreText: t ? numText(t.minScore) : '—',
          };
        })
      : [];

    // 门槛校验（AC-27）：生物/地理 ≥ B 且综合素质评价达标
    const subjects = dataset.surveySubjects.length ? dataset.surveySubjects : ['生物', '地理'];
    const gradeOrder: Record<string, number> = { A: 4, B: 3, C: 2, D: 1 };
    const bioGeoText = subjects
      .map((s) => `${s} ${surveyGrades[s] ? surveyGrades[s] : '未填'}`)
      .join(' · ');
    const bioOk = subjects.every((s) => {
      const g = surveyGrades[s];
      return g ? (gradeOrder[g] || 0) >= gradeOrder.B : false;
    });
    const qualityOk = qualityEval === true;
    const checked = Object.keys(surveyGrades).length > 0 || qualityEval !== null;
    const messages: string[] = [];
    if (checked) {
      if (!bioOk) messages.push(`${subjects.join('、')}等级须均达 B 等及以上`);
      if (!qualityOk) messages.push('综合素质评价须达标');
    }

    // AC-26：校内竞争位 —— 按选中对口类别的名额，与本校校排名对照
    const activeTierData = school ? school.tiers[tierKey] : null;
    const plan = activeTierData && activeTierData.plan !== null ? activeTierData.plan : null;
    const competitionTarget =
      activeTierData && activeTierData.counterpart
        ? activeTierData.counterpart
        : TIER_META.filter((m) => m.key === tierKey).map((m) => m.label)[0] || '';
    let competitionRankText = '—';
    if (schoolRank !== null) {
      competitionRankText =
        plan !== null && schoolRank <= plan
          ? `第 ${schoolRank} 名（名额内，按名额估算）`
          : `约第 ${schoolRank} 名`;
    }

    return {
      school,
      tiers,
      activeTier: tierKey,
      competitionRankText,
      competitionNote: '这是校内竞争位，不是全市排名',
      competitionTarget,
      competitionPlanText: plan === null ? '—' : `${formatRank(plan)} 个`,
      gate: {
        checked,
        passed: bioOk && qualityOk,
        messages,
        bioGeoText,
        qualityText: qualityEval === null ? '未填' : qualityEval ? '已达标' : '未达标',
      },
      tieNote: '同分时比语数英三科总分；指标生最低控制线 ≠ 录取线',
      empty: !school,
    };
  }

  async getRulePoints(): Promise<RulePoint[]> {
 const gradeOperationScope = scopeKey(); void gradeOperationScope;

    const dataset = await guardAwait(getDataSource().getActiveDataset(), gradeOperationScope);
    return dataset.rulePoints;
  }

  /** 本校（自用设置项，供指标生对照定位到本校） */
  async getMySchool(): Promise<string> {
 const gradeOperationScope = scopeKey(); void gradeOperationScope;

    const saved = datasetService.getSetting<string>('mySchool', '');
    if (saved) return saved;
    const rows = await guardAwait(this.getIndicatorRows({}), gradeOperationScope);
    return rows.length ? rows[0].school : '';
  }

  async setMySchool(name: string): Promise<void> {
 const gradeOperationScope = scopeKey(); void gradeOperationScope;

    datasetService.setSetting('mySchool', name);
  }

  /** 下拉选择用的校名列表 */
  async listSchoolNames(): Promise<string[]> {
 const gradeOperationScope = scopeKey(); void gradeOperationScope;

    const dataset = await guardAwait(getDataSource().getActiveDataset(), gradeOperationScope);
    return dataset.indicatorSchools.map((s) => s.school);
  }

  /** 我的位次摘要（参照库顶部提示用） */
  async myRankSummary(): Promise<{ rankText: string; isApprox: boolean }> {
 const gradeOperationScope = scopeKey(); void gradeOperationScope;

    const mine = await guardAwait(positionService.getMyCityRank(), gradeOperationScope);
    return {
      rankText: mine.rank !== null ? formatRank(mine.rank) : '—',
      isApprox: mine.isApprox,
    };
  }
}

export const referenceService = new ReferenceService();
