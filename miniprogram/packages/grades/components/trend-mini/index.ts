/**
 * trend-mini —— 趋势迷你图（Canvas 2D 自绘，ADR-007）
 *
 * 视觉关键约束（UIUX §5 / SPEC AC-19/20/21）：
 *   ① Y 轴倒置：位次小在上、大在下 → 图线往上 = 孩子进步；
 *   ② 空心点（校内考试）落在基线：不落 Y 值、不连线、不参与位次映射；
 *   ③ 跨口径断点：core 已分段，本组件只逐段画线、绝不跨段连接。
 *
 * 坐标映射在 services/plot.service（纯函数）；颜色取自 styles/design-tokens（源：design-tokens.json，零硬编码）。
 */

import tokens from '../../styles/design-tokens';
import { HOLLOW_POINT_LEGEND } from '../../core/trend';
import { buildTrendModel } from '../../services/plot.service';
import type { TargetSpec, TrendModel } from '../../services/plot.service';
import type { ExamRecord } from '../../core/types';

type Ctx = {
  clearRect(x: number, y: number, w: number, h: number): void;
  beginPath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  arc(x: number, y: number, r: number, s: number, e: number): void;
  fill(): void;
  stroke(): void;
  fillText(text: string, x: number, y: number): void;
  setLineDash(dash: number[]): void;
  save(): void;
  restore(): void;
  scale(x: number, y: number): void;
  strokeStyle: string;
  fillStyle: string;
  lineWidth: number;
  lineJoin: string;
  lineCap: string;
  font: string;
  textAlign: string;
  textBaseline: string;
};

type CanvasNode = {
  width: number;
  height: number;
  getContext(type: '2d'): Ctx;
};

const COLOR = {
  border: tokens.color.border.value,
  accent: tokens.color.accent.value,
  muted: tokens.color.muted.value,
  fg: tokens.color.fg.value,
  bg: tokens.color.bg.value,
  /** 校内考试空心点的描边色（口径隔离的可视标记） */
  hollow: tokens.chart.hollowStroke.value,
};

/** 长按命中项（几何来自 model，文案来自 plot.service，组件不拼口径文案） */
interface HitTarget {
  x: number;
  y: number;
  hollow: boolean;
  recordId: string;
  infoTitle: string;
  infoText: string;
}

interface TrendCtx {
  _hits?: HitTarget[];
  _touchStart?: { t: number; x: number; y: number };
  _lpAt?: number;
}

/** Canvas 绘图参数（design-tokens.json chart 段；invertY 的倒置在 plot.service 内落实） */
const CHART = {
  line: tokens.chart.lineColor.value,
  lineWidth: tokens.chart.lineWidth.value,
  pointRadius: tokens.chart.pointRadius.value,
  dash: tokens.chart.targetDash.value,
};

function pixelRatio(): number {
  try {
    const info = typeof wx.getWindowInfo === 'function' ? wx.getWindowInfo() : wx.getSystemInfoSync();
    return info.pixelRatio && info.pixelRatio > 0 ? info.pixelRatio : 2;
  } catch (e) {
    return 2;
  }
}

Component({
  options: { styleIsolation: 'apply-shared' },

  properties: {
    records: { type: Array, value: [] as ExamRecord[] },
    targetRanks: { type: Array, value: [] as (number | { rank: number; label?: string })[] },
    /** 图高：UIUX §9.1 约 120px（原 150px 首屏过高，已按规范收紧） */
    height: { type: Number, value: 120 },
  },

  data: {
    chartHeight: 120,
    /** 初始即取 core 的图例常量，canvas 未就绪时图例语义也不丢（AC-19） */
    legend: HOLLOW_POINT_LEGEND,
    emptyText: '',
    singlePointTip: '',
    summary: '',
  },

  observers: {
    'records, targetRanks'() {
      this.draw();
    },
  },

  lifetimes: {
    ready() {
      this.setData({ chartHeight: this.data.height });
      this.draw();
    },
  },

  methods: {
    draw() {
      const records = this.data.records as ExamRecord[];
      const targetRanks = this.data.targetRanks as (number | TargetSpec)[];
      if (!Array.isArray(records)) return;

      this.createSelectorQuery()
        .select('#trend')
        .fields({ node: true, size: true })
        .exec((res: unknown[]) => {
          const item = res && (res[0] as { node?: CanvasNode; width?: number; height?: number } | null);
          if (!item || !item.node) return;
          const model = buildTrendModel(
            records,
            targetRanks,
            {
              width: item.width && item.width > 0 ? item.width : 320,
              height: item.height && item.height > 0 ? item.height : this.data.chartHeight,
            },
          );
          this.render(item.node, model);
          this.setData({
            legend: model.legend,
            emptyText: model.emptyText || '',
            singlePointTip: model.singlePointTip || '',
            summary: model.summary,
          });
        });
    },

    /** 只做绘制，不做任何业务判断（几何来自 model） */
    render(canvas: CanvasNode, model: TrendModel) {
      const dpr = pixelRatio();
      const w = model.width;
      const h = model.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      const p = model.pad;
      const baseline = p.top + (h - p.top - p.bottom);
      const right = w - p.right;

      // ① 坐标轴：细线、无网格（降噪）
      ctx.strokeStyle = COLOR.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.left, p.top);
      ctx.lineTo(p.left, baseline);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(p.left, baseline);
      ctx.lineTo(right, baseline);
      ctx.stroke();

      // ② 目标校位次虚线（越靠上 = 越难的目标线）
      ctx.save();
      ctx.setLineDash(CHART.dash);
      ctx.strokeStyle = COLOR.muted;
      model.targets.forEach((t) => {
        ctx.beginPath();
        ctx.moveTo(p.left, t.y);
        ctx.lineTo(right, t.y);
        ctx.stroke();
      });
      ctx.restore();
      ctx.fillStyle = COLOR.muted;
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      model.targets.forEach((t) => {if (!model.latest || Math.abs(t.y-model.latest.y)>22) ctx.fillText(t.label, right, t.y - 3);});

      // ③ Y 轴方向提示（反向指标三重保险之①：轴倒置）
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText('位次优', p.left - 4, p.top + 4);
      ctx.fillText('位次弱', p.left - 4, baseline - 4);

      // ④ 实线分段：逐段绘制，段与段之间天然断开（不跨口径连线）
      ctx.strokeStyle = CHART.line;
      ctx.lineWidth = CHART.lineWidth;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      model.segments.forEach((seg) => {
        if (seg.length < 2) return;
        ctx.beginPath();
        seg.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
        ctx.stroke();
      });

      // ⑤ 数据点：实心 = 可折算；空心 = 校内考试（落在基线，无 Y 值）
      model.markers.forEach((m) => {
        ctx.beginPath();
        ctx.arc(m.x, m.y, CHART.pointRadius, 0, Math.PI * 2);
        if (m.hollow) {
          ctx.fillStyle = COLOR.bg;
          ctx.fill();
          ctx.strokeStyle = COLOR.hollow;
          ctx.lineWidth = 2;
          ctx.stroke();
        } else {
          ctx.fillStyle = COLOR.accent;
          ctx.fill();
        }
      });

      // ⑥ X 轴（按考试日期）标签
      ctx.fillStyle = COLOR.muted;
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      model.xLabels.forEach((l) => ctx.fillText(l.text, l.x, baseline + 6));

      // ⑦ 最近一次可折算点：实心大点 + 数值
      if (model.latest) {
        ctx.beginPath();
        ctx.arc(model.latest.x, model.latest.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = COLOR.accent;
        ctx.fill();
        ctx.fillStyle = COLOR.fg;
        ctx.font = '600 11px sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText(model.latest.text, right, model.latest.y - 8);
      }

      // ⑧ 长按命中表：点只画 4px，手指按不准 → 容差放宽到 24px（UIUX §9.1 口径表 #4）
      (this as unknown as TrendCtx)._hits = model.markers.map((m) => ({
        x: m.x,
        y: m.y,
        hollow: m.hollow,
        recordId: m.recordId,
        infoTitle: m.infoTitle,
        infoText: m.infoText,
      }));
    },

    /** 取画布内坐标：canvas 触摸事件的 x/y 官方 typings 未声明，此处就地收窄 */
    pointOf(e: WechatMiniprogram.TouchEvent, useChanged: boolean): { x: number; y: number } | null {
      const detail = (e.detail || {}) as { x?: number; y?: number };
      if (typeof detail.x === 'number' && typeof detail.y === 'number') {
        return { x: detail.x, y: detail.y };
      }
      const list = useChanged ? e.changedTouches : e.touches;
      const t = list && list[0] ? (list[0] as unknown as { x?: number; y?: number }) : null;
      if (t && typeof t.x === 'number' && typeof t.y === 'number') return { x: t.x, y: t.y };
      return null;
    },

    /** 命中检测 + 弹窗：空心点弹校内位次%，实心点弹折算位次（约） */
    openAt(x: number, y: number) {
      const hits = (this as unknown as TrendCtx)._hits;
      if (!hits || !hits.length) return;

      const TOLERANCE = 24;
      let best: HitTarget | null = null;
      let bestDist = TOLERANCE;
      hits.forEach((h) => {
        const d = Math.sqrt((h.x - x) * (h.x - x) + (h.y - y) * (h.y - y));
        if (d <= bestDist) {
          best = h;
          bestDist = d;
        }
      });
      if (!best) {
        wx.showToast({ title: '长按圆点可看这次考试', icon: 'none' });
        return;
      }

      const hit = best as HitTarget;
      wx.showModal({
        title: hit.infoTitle,
        content: hit.infoText,
        cancelText: '关闭',
        confirmText: '看详情',
        success: (res) => {
          if (res.confirm) wx.navigateTo({ url: `/packages/grades/pages/exam-detail/index?examId=${hit.recordId}` });
        },
      });
    },

    onLongPress(e: WechatMiniprogram.TouchEvent) {
      const p = this.pointOf(e, false);
      if (!p) return;
      (this as unknown as TrendCtx)._lpAt = Date.now();
      this.openAt(p.x, p.y);
    },

    /**
     * canvas 的 longpress 在部分基础库不派发 → 自行按 ≥350ms 判定兜底；
     * 用 _lpAt 与原生 longpress 互斥，避免弹两次。
     */
    onTouchStart(e: WechatMiniprogram.TouchEvent) {
      const p = this.pointOf(e, false);
      if (!p) return;
      (this as unknown as TrendCtx)._touchStart = { t: Date.now(), x: p.x, y: p.y };
    },

    onTouchEnd(e: WechatMiniprogram.TouchEvent) {
      const ctx = this as unknown as TrendCtx;
      const start = ctx._touchStart;
      ctx._touchStart = undefined;
      if (!start) return;
      if (ctx._lpAt && Date.now() - ctx._lpAt < 600) return;
      if (Date.now() - start.t < 350) return;
      const p = this.pointOf(e, true) || { x: start.x, y: start.y };
      const moved = Math.sqrt((p.x - start.x) * (p.x - start.x) + (p.y - start.y) * (p.y - start.y));
      if (moved > 14) return;
      ctx._lpAt = Date.now();
      this.openAt(start.x, start.y);
    },
  },
});
