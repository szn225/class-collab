import { scopeKey, guardAwait } from '../../utils/scope';
const { gradePage }: { gradePage: typeof Page } = require('../../../../utils/grades');
/**
 * 定位（首页）—— 位次定位仪表盘（SPEC §7 页1 / UIUX §9.1）
 *
 * 数据来源：position.service + datasource.getRecords()
 * 口径隔离：最近一次为校内考试时，不显折算位次与档次，改显引导占位（AC-03）。
 */

import type { ExamRecord } from '../../core/types';
import { datasetService } from '../../services/dataset.service';
import { describeDataSourceError } from '../../services/data-source';
import { pickTargetRanks } from '../../services/plot.service';
import type { TargetSpec } from '../../services/plot.service';
import { positionService } from '../../services/position.service';
import type { ExamListItem, HeroView, TierVerdictCard } from '../../services/position.service';
import { targetSchoolService } from '../../services/target-school.service';
import { formatRank } from '../../utils/format';
import { setTabBarValue } from '../../utils/tabbar';
import { trackEvent } from '../../utils/track';

interface DashboardData {
  saved: boolean;
  loading: boolean;
  error: string;
  empty: boolean;
  latestLabel: string;
  hero: HeroView | null;
  guide: string;
  verdicts: TierVerdictCard[];
  examList: ExamListItem[];
  trendRecords: ExamRecord[];
  targetRanks: (number | TargetSpec)[];
  /** 目标校回显：让家长知道趋势图那条虚线来自哪里 */
  targetTip: string;
  /** 有记录但没设目标校 → 在原位给一条可点击的引导（SPEC §10 空状态，D-14） */
  targetGuide: boolean;
  /** 免责声明：文案取自 dataset.disclaimer，本页不写死（AC-35，D-13） */
  disclaimer: string;
}

interface DashboardCtx {
  /** 本次页面实例是否已上报过 dashboard_viewed（避免 onShow 反复刷屏） */
  _tracked: boolean;
}

gradePage({
  data: {
    saved: false,
    loading: true,
    error: '',
    empty: true,
    latestLabel: '',
    hero: null,
    guide: '',
    verdicts: [],
    examList: [],
    trendRecords: [],
    targetRanks: [],
    targetTip: '',
    targetGuide: false,
    disclaimer: '',
  } as DashboardData,

  onLoad(options: Record<string, string>) { this.setData({saved:options.saved==='1'}); },
  onShow() {
    setTabBarValue(this, 0);
    this.load();
  },

  onPullDownRefresh() {
    this.load().then(() => wx.stopPullDownRefresh());
  },

  async load() {
 const gradeOperationScope = scopeKey(); void gradeOperationScope;

    this.setData({ loading: true, error: '' });
    try {
      // 三条读取互不依赖，并行取；免责声明与参照页同源（datasetService.getDisclaimer），避免文案副本
      const [dataset, view, target, disclaimer] = await guardAwait(Promise.all([
        datasetService.getActiveDataset(),
        positionService.getDashboard(),
        targetSchoolService.get(),
        datasetService.getDisclaimer(),
      ]), gradeOperationScope);

      // 目标线：目标校（如有位次参照）优先，其余补默认档位线，去重后最多 3 条
      const targetRanks: (number | TargetSpec)[] = [];
      if (target && target.rank !== null) {
        targetRanks.push({ rank: target.rank, label: `目标校线 ${formatRank(target.rank)}` });
      }
      pickTargetRanks(dataset).forEach((rank, i) => {
        if (targetRanks.length >= 3) return;
        const exists = targetRanks.some((t) => (typeof t === 'number' ? t : t.rank) === rank);
        if (!exists) {
          targetRanks.push({ rank, label: `${i === 0 ? '最优档线' : '稳妥档线'} ${formatRank(rank)}` });
        }
      });

      this.setData({
        loading: false,
        empty: view.empty,
        latestLabel: view.latestLabel,
        hero: view.hero,
        guide: view.guide || '',
        verdicts: view.verdicts,
        examList: view.examList,
        trendRecords: view.records,
        targetRanks,
        targetTip: target ? `目标校：${target.counterpart} · ${target.rankText}（在「参照」页可更换）` : '',
        // 无目标校时才引导；无记录时首屏空状态已经给过引导，这里不重复（D-14）
        targetGuide: !view.empty && !target,
        disclaimer,
      });

      // 首次成功加载后上报一次（onLoad / 首个 onShow 走同一条链，不重复记）
      const ctx = this as unknown as DashboardCtx;
      if (!ctx._tracked) {
        ctx._tracked = true;
        trackEvent('dashboard_viewed', { page: 'dashboard' });
      }
    } catch (e) {
      this.setData({ loading: false, error: describeDataSourceError(e) });
    }
  },

  goRecord() {
    wx.redirectTo({ url: '/packages/grades/pages/record/index' });
  },

  /** 无目标校引导条 → 参照页（Tab 页只能用 switchTab，navigateTo 会失败） */
  goReference() {
    wx.redirectTo({ url: '/packages/grades/pages/reference/index' });
  },

  goProfile() {
    wx.navigateTo({ url: '/packages/grades/pages/profile/index' });
  },

  /** 页级刷新：与下拉刷新共用同一条加载链 */
  onRefresh() {
    if (this.data.loading) return;
    this.load();
  },

  /** 次要操作收敛到 ActionSheet（UIUX §7.4：小程序无 hover） */
  onMore() {
    wx.showActionSheet({
      itemList: ['数据备份与设置', '去录入新考试', '刷新数据', '学生与账号'],
      success: (res) => {
        if (res.tapIndex === 0) this.goProfile();
        if (res.tapIndex === 1) this.goRecord();
        if (res.tapIndex === 2) this.load();
        if (res.tapIndex === 3) wx.navigateTo({url:'/pages/account/index'});
      },
    });
  },

  onTapRecord(e: WechatMiniprogram.BaseEvent) {
    const id = String(e.currentTarget.dataset.id || '');
    if (!id) return;
    wx.navigateTo({ url: `/packages/grades/pages/exam-detail/index?examId=${id}` });
  },

  /** 次要操作收敛到 ActionSheet（UIUX §7.4，小程序无 hover） */
  onLongPressRecord(e: WechatMiniprogram.BaseEvent) {
    const id = String(e.currentTarget.dataset.id || '');
    const item = this.data.examList.find((x) => x.id === id);
    if (!item) return;
    wx.showActionSheet({
      itemList: ['查看考试详情', '去复盘'],
      success: (res) => {
        if (res.tapIndex === 0) wx.navigateTo({ url: `/packages/grades/pages/exam-detail/index?examId=${id}` });
        if (res.tapIndex === 1) wx.redirectTo({ url: '/packages/grades/pages/plan/index' });
      },
    });
  },

  /** 三档卡片展开「为什么」：给出该档位次线与我的差距 */
  onTapCard(e: WechatMiniprogram.CustomEvent<{ card: TierVerdictCard | null }>) {
    const card = e.detail.card;
    if (!card || !this.data.hero) return;
    wx.showModal({
      title: `${card.label} · ${card.tierName}`,
      content: `${card.tierName}的录取参照位次：${card.lineText}。\n你最近一次折算全市位次：${this.data.hero.value}。\n差额越小，越接近这一档。`,
      showCancel: false,
      confirmText: '知道了',
    });
  },
});
