import { scopeKey, guardAwait, scopeTimeout } from '../../utils/scope';
const { gradePage }: { gradePage: typeof Page } = require('../../../../utils/grades');
/**
 * 参照库 —— 三个子区（录取线 / 指标生对照 / 规则要点）
 * （SPEC §7 页5 · UIUX §9.5–9.7 · AC-23/24/25/26/27/28/35）
 *
 * 页内顶部分段控件切换子区，不做三级 Tab；157 校用「筛选 → 卡片 → 键值对下钻」三层降维。
 */

import type { RulePoint } from '../../core/types';
import { describeDataSourceError } from '../../services/data-source';
import { datasetService } from '../../services/dataset.service';
import { referenceService } from '../../services/reference.service';
import type {
  AdmissionSort,
  AdmissionView,
  IndicatorDetailView,
  IndicatorRow,
  IndicatorTierView,
} from '../../services/reference.service';
import { targetSchoolService } from '../../services/target-school.service';
import type { TargetSchoolView } from '../../services/target-school.service';
import { setTabBarValue } from '../../utils/tabbar';
import { trackEvent } from '../../utils/track';

const SEGMENTS = [
  { value: 'admission', label: '录取线' },
  { value: 'indicator', label: '指标生对照' },
  { value: 'rules', label: '规则要点' },
];

const BATCHES = ['全部批次', '第一批次', '第二批次'];

/** 排序控件（UIUX §9.5：按录取线 / 位次） */
const SORTS: { key: AdmissionSort; label: string }[] = [
  { key: 'rank', label: '按位次' },
  { key: 'cutoff', label: '按录取线' },
];

const TIER_OPTIONS = [
  { key: 'fourBig', label: '四大对口' },
  { key: 'fourNew', label: '四新对口' },
  { key: 'fiveSmall', label: '五小对口' },
  { key: 'other', label: '其它对口' },
] as const;

interface KvItem {
  k: string;
  v: string;
  sub?: string;
}

interface RuleRow extends RulePoint {
  no: string;
  expanded: boolean;
}

interface RefCtx {
  _loaded: { admission: boolean; indicator: boolean };
  _timer?: number;
  /** 本页面实例是否已上报过 reference_viewed（与 dashboard 一致：一次会话只记一次） */
  _tracked?: boolean;
}

gradePage({
  data: {
    segments: SEGMENTS,
    segment: 'admission' as 'admission' | 'indicator' | 'rules',

    loading: true,
    error: '',
    disclaimer: '',

    // 子区一
    keyword: '',
    batch: BATCHES[0],
    batches: BATCHES,
    sorts: SORTS,
    sort: 'rank' as AdmissionSort,
    onlyChong: false,
    target: null as TargetSchoolView | null,
    targetSchool: '',
    admission: {
      myRankText: '—',
      hasRank: false,
      rows: [],
      rankedCount: 0,
      note: '',
    } as AdmissionView,

    // 子区二
    indicatorKeyword: '',
    tierKey: 'fourBig' as IndicatorTierView['key'],
    tierOptions: TIER_OPTIONS,
    mySchool: '',
    indicatorRows: [] as IndicatorRow[],
    indicatorDetail: null as IndicatorDetailView | null,
    indicatorKv: [] as KvItem[],

    // 子区三
    rules: [] as RuleRow[],
  },

  onShow() {
    setTabBarValue(this, 3);
    const ctx = this as unknown as RefCtx;
    if (!ctx._tracked) {
      ctx._tracked = true;
      trackEvent('reference_viewed', { page: 'reference' });
    }
    if (!ctx._loaded) ctx._loaded = { admission: false, indicator: false };
    this.syncTarget();
    if (!ctx._loaded.admission) this.loadActive();
  },

  /** 目标校状态回显：任何入口改过目标校，回到本页都能同步（UIUX §9.6-5） */
  async syncTarget() {
 const gradeOperationScope = scopeKey(); void gradeOperationScope;

    try {
      const target = await guardAwait(targetSchoolService.get(), gradeOperationScope);
      const key = target ? target.admissionSchool || target.counterpart : '';
      const changed = key !== this.data.targetSchool;
      this.setData({ target, targetSchool: key });
      const ctx = this as unknown as RefCtx;
      if (changed && ctx._loaded.admission) this.reloadAdmission();
    } catch {
      // 目标校读取失败不阻断参照库主体
    }
  },

  /* ------------------------- 公共加载 ------------------------- */

  async loadActive() {
 const gradeOperationScope = scopeKey(); void gradeOperationScope;

    this.setData({ loading: true, error: '' });
    try {
      const [disclaimer, rules] = await guardAwait(Promise.all([
        datasetService.getDisclaimer(),
        referenceService.getRulePoints(),
      ]), gradeOperationScope);
      const ruleRows: RuleRow[] = rules.map((r, i) => ({
        ...r,
        no: `${i + 1}/${rules.length}`,
        expanded: false,
      }));
      const admission = await guardAwait(referenceService.getAdmissionView({
        batch: this.data.batch,
        keyword: this.data.keyword,
        onlyChong: this.data.onlyChong,
        sort: this.data.sort,
        targetSchool: this.data.targetSchool,
      }), gradeOperationScope);
      const ctx = this as unknown as RefCtx;
      ctx._loaded.admission = true;
      this.setData({ loading: false, disclaimer, rules: ruleRows, admission });
    } catch (e) {
      this.setData({ loading: false, error: describeDataSourceError(e) });
    }
  },

  /* ------------------------- 子区切换 ------------------------- */

  onPickSegment(e: WechatMiniprogram.BaseEvent) {
    const segment = String(e.currentTarget.dataset.value) as 'admission' | 'indicator' | 'rules';
    this.setData({ segment });
    const ctx = this as unknown as RefCtx;
    if (segment === 'indicator' && !ctx._loaded.indicator) this.loadIndicator();
  },

  schedule(fn: () => void) {
    const ctx = this as unknown as RefCtx;
    if (ctx._timer) clearTimeout(ctx._timer);
    ctx._timer = scopeTimeout(fn, 300) as unknown as number;
  },

  /* ------------------------- 子区一：录取线 ------------------------- */

  onSearchInput(e: WechatMiniprogram.Input) {
    const keyword = e.detail.value;
    this.setData({ keyword });
    this.schedule(() => this.reloadAdmission());
  },

  onPickBatch(e: WechatMiniprogram.BaseEvent) {
    const batch = String(e.currentTarget.dataset.batch);
    this.setData({ batch }, () => this.reloadAdmission());
  },

  onToggleChong() {
    this.setData({ onlyChong: !this.data.onlyChong }, () => this.reloadAdmission());
  },

  /** 排序：按位次 / 按录取线（UIUX §9.5） */
  onPickSort(e: WechatMiniprogram.BaseEvent) {
    const sort = String(e.currentTarget.dataset.key) as AdmissionSort;
    if (sort === this.data.sort) return;
    this.setData({ sort }, () => this.reloadAdmission());
  },

  /**
   * 长按学校行 → 次要操作收敛到 ActionSheet（UIUX §7.4：小程序无 hover）
   * 标记为目标校后，位次回流首页趋势图的目标虚线（§9.6-5）
   */
  onLongPressSchool(e: WechatMiniprogram.BaseEvent) {
    const school = String(e.currentTarget.dataset.school || '');
    if (!school) return;
    const isTarget = this.data.targetSchool === school;
    const items = isTarget ? ['取消目标校', '冲 / 稳 / 保怎么算'] : ['设为目标校', '冲 / 稳 / 保怎么算'];
    wx.showActionSheet({
      itemList: items,
      success: (res) => {
        if (res.tapIndex === 0) {
          if (isTarget) this.onClearTarget();
          else this.setTarget(school, school);
        } else {
          this.explainVerdict();
        }
      },
    });
  },

  async setTarget(school: string, counterpart: string) {
 const gradeOperationScope = scopeKey(); void gradeOperationScope;

    const view = await guardAwait(targetSchoolService.set(school, counterpart), gradeOperationScope);
    if (!view) return;
    this.setData(
      { target: view, targetSchool: view.admissionSchool || view.counterpart },
      () => this.reloadAdmission(),
    );
    wx.showToast({
      title:
        view.rank !== null
          ? `目标校已设 · ${view.rankText}`
          : '目标校已存，但该校暂无录取位次参照',
      icon: 'none',
    });
  },

  onClearTarget() {
    targetSchoolService.clear();
    this.setData({ target: null, targetSchool: '' }, () => this.reloadAdmission());
    wx.showToast({ title: '已取消目标校', icon: 'none' });
  },

  explainVerdict() {
    wx.showModal({
      title: '冲 / 稳 / 保怎么算',
      content:
        '用你的折算全市位次（约）和学校录取位次直接比：\n· 你的位次落后于录取位次 → 冲\n· 刚够线（位次差在 15% 以内）→ 稳\n· 有明显余量 → 保\n\n不用自己算，列表里已经标好。',
      showCancel: false,
      confirmText: '知道了',
    });
  },

  async reloadAdmission() {
 const gradeOperationScope = scopeKey(); void gradeOperationScope;

    try {
      const admission = await guardAwait(referenceService.getAdmissionView({
        batch: this.data.batch,
        keyword: this.data.keyword,
        onlyChong: this.data.onlyChong,
        sort: this.data.sort,
        targetSchool: this.data.targetSchool,
      }), gradeOperationScope);
      this.setData({ admission });
    } catch (e) {
      this.setData({ error: describeDataSourceError(e) });
    }
  },

  /* ------------------------- 子区二：指标生对照 ------------------------- */

  async loadIndicator() {
 const gradeOperationScope = scopeKey(); void gradeOperationScope;

    try {
      const school = await guardAwait(referenceService.getMySchool(), gradeOperationScope);
      const rows = await guardAwait(referenceService.getIndicatorRows({
        tier: this.data.tierKey,
        keyword: this.data.indicatorKeyword,
      }), gradeOperationScope);
      const ctx = this as unknown as RefCtx;
      ctx._loaded.indicator = true;
      this.setData({ mySchool: school, indicatorRows: rows });
    } catch (e) {
      this.setData({ error: describeDataSourceError(e) });
    }
  },

  onIndicatorSearchInput(e: WechatMiniprogram.Input) {
    this.setData({ indicatorKeyword: e.detail.value });
    this.schedule(() => this.loadIndicator());
  },

  onPickIndicatorTier(e: WechatMiniprogram.BaseEvent) {
    const key = String(e.currentTarget.dataset.key) as IndicatorTierView['key'];
    this.setData({ tierKey: key }, () => this.loadIndicator());
  },

  onTapIndicator(e: WechatMiniprogram.BaseEvent) {
    const school = String(e.currentTarget.dataset.school || '');
    this.openDetail(school, 'fourBig');
  },

  onPickDetailTier(e: WechatMiniprogram.BaseEvent) {
    const key = String(e.currentTarget.dataset.key) as IndicatorTierView['key'];
    const detail = this.data.indicatorDetail;
    if (!detail || !detail.school) return;
    this.openDetail(detail.school.school, key);
  },

  async openDetail(school: string, tierKey: IndicatorTierView['key']) {
 const gradeOperationScope = scopeKey(); void gradeOperationScope;

    try {
      const detail = await guardAwait(referenceService.getIndicatorDetail(school, tierKey), gradeOperationScope);
      const kv: KvItem[] = detail.tiers.map((t) => ({
        k: `${t.label} · ${t.counterpart}`,
        v: `名额 ${t.planText}`,
        sub: `填报比 ${t.ratioText} · 实录线 ${t.minScoreText}`,
      }));
      this.setData({ indicatorDetail: detail, indicatorKv: kv });
      wx.pageScrollTo({ selector: '.detail', duration: 200 });
    } catch (e) {
      this.setData({ error: describeDataSourceError(e) });
    }
  },

  onCloseDetail() {
    this.setData({ indicatorDetail: null, indicatorKv: [] });
  },

  /** 指标生下钻面板：把当前对口高中设为目标校（UIUX §9.6-5 一键标记） */
  onSetTargetFromDetail() {
    const detail = this.data.indicatorDetail;
    if (!detail || !detail.school) return;
    const counterpart = detail.competitionTarget;
    if (!counterpart || counterpart === '—') {
      wx.showToast({ title: '这一档没有对口高中，换一档再试', icon: 'none' });
      return;
    }
    this.setTarget(detail.school.school, counterpart);
  },

  /* ------------------------- 子区三：规则要点 ------------------------- */

  onToggleRule(e: WechatMiniprogram.BaseEvent) {
    const index = Number(e.currentTarget.dataset.index);
    const rules = this.data.rules.map((r, i) => (i === index ? { ...r, expanded: !r.expanded } : r));
    this.setData({ rules });
  },
});
