/**
 * plot.service —— 趋势图几何model（SPEC §9.4 跨口径隔离 / AC-19/20/21）
 *
 * 职责：把 core/trend 的语义序列映射为**可绘制坐标**，像素级交给组件。
 * 铁律：
 *   - 空点（校内考试）estimatedCityRank 为 null → **不落 Y 值**（落在基线仅作时间位置标记），
 *     绝不置 0、绝不连线（AC-19/20/21）。
 *   - Y 轴倒置：位次小在上、大在下 → 图线往上 = 孩子进步（UIUX §7.1）。
 *
 * 注：ADR-007 建议坐标映射下沉 core/ 作纯函数单测；core/chart.ts 尚未产出，
 *     本文件先承载映射，接口保持纯函数，集成阶段可整体下移。
 */

import { buildTrend } from '../core/trend';
import type { Dataset, ExamRecord } from '../core/types';
import { formatDateCn, formatMonthCn, formatPct, formatRank } from '../utils/format';

export interface Pt {
  x: number;
  y: number;
}

export interface TrendMarker extends Pt {
  hollow: boolean;
  recordId: string;
  examName: string;
  /** 长按弹窗标题（文案在服务层收口，组件不拼业务口径） */
  infoTitle: string;
  /** 长按弹窗正文：空心点给校内位次%，实心点给折算位次（约） */
  infoText: string;
}

/** 目标线：默认取档次阈值；家长标记目标校后由页面传入带名字的线 */
export interface TargetSpec {
  rank: number;
  label?: string;
}

export interface TrendTargetLine {
  y: number;
  label: string;
}

export interface TrendModel {
  width: number;
  height: number;
  pad: { left: number; right: number; top: number; bottom: number };
  /** 实线分段（每段 ≥2 点） */
  segments: Pt[][];
  /** 全部点（含空心点，不隐藏任何一次考试） */
  markers: TrendMarker[];
  /** 目标校位次虚线（来自数据集档次阈值，零硬编码） */
  targets: TrendTargetLine[];
  xLabels: { x: number; text: string }[];
  yLabels: { y: number; text: string }[];
  /** 最近一次可连线点的强调标注 */
  latest: (Pt & { text: string }) | null;
  legend: string;
  axisText: { top: string; bottom: string };
  /** 全部为校内考试 → 空态文案（不画折线） */
  emptyText: string | null;
  /** 仅 1 个可连线点 → 提示再录一次 */
  singlePointTip: string | null;
  /** 无障碍文字摘要 */
  summary: string;
  headline: string;
}

const EMPTY_TEXT = '尚无集团/全市统考记录，录入一次集团联考即可看到全市位次趋势';
const SINGLE_TIP = '再录入 1 次即可看到趋势';

export interface TrendSize {
  width: number;
  height: number;
}

/** 默认目标线：取档次阈值中最优档与「明德周南」档（数据驱动，非硬编码） */
export function pickTargetRanks(dataset: Dataset): number[] {
  const nums = dataset.tierThresholds
    .map((t) => t.upTo)
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  const picks: number[] = [];
  if (nums.length > 0) picks.push(nums[0]);
  if (nums.length > 2) picks.push(nums[2]);
  return picks;
}

/**
 * 构建可绘制模型。
 * @param targetRanks 目标校位次线（由 pickTargetRanks 从数据集取出后传入，
 *                    避免把整份数据集塞进组件 setData）
 */
export function buildTrendModel(
  records: ExamRecord[],
  targetRanks: (number | TargetSpec)[],
  size: TrendSize,
): TrendModel {
  const series = buildTrend(records || []);
  const pad = { left: 46, right: 12, top: 18, bottom: 26 };
  const plotW = Math.max(1, size.width - pad.left - pad.right);
  const plotH = Math.max(1, size.height - pad.top - pad.bottom);
  const baselineY = pad.top + plotH;

  // 兼容纯数字（默认档位线）与带标签的目标校线
  const specs: TargetSpec[] = (Array.isArray(targetRanks) ? targetRanks : [])
    .map((t) => (typeof t === 'number' ? { rank: t } : t))
    .filter((t) => t && typeof t.rank === 'number' && Number.isFinite(t.rank));

  const rankValues = series.points
    .filter((p) => p.connectable && p.estimatedCityRank !== null)
    .map((p) => p.estimatedCityRank as number);
  const anchor = rankValues.concat(specs.map((s) => s.rank));
  const yMin = anchor.length ? Math.min(...anchor) : 0;
  const yMax = anchor.length ? Math.max(...anchor) : 1;
  const span = yMax - yMin || 1;

  /** 反向 Y 轴：位次越小 → y 越小（越靠上） */
  const yOf = (rank: number): number => pad.top + ((rank - yMin) / span) * plotH;

  // X 轴按考试日期比例分布（AC-19：X 轴 = 考试日期）
  const times = series.points.map((p) => Date.parse(`${p.examDate}T00:00:00Z`));
  const tMin = times.length ? Math.min(...times) : 0;
  const tMax = times.length ? Math.max(...times) : 0;
  const tSpan = tMax - tMin;
  const xOf = (i: number): number => {
    if (series.points.length <= 1 || tSpan === 0) return pad.left + plotW / 2;
    const t = times[i];
    return pad.left + ((t - tMin) / tSpan) * plotW;
  };

  // 实线分段：core 已保证「空点处断开、不跨口径连线」
  const segments: Pt[][] = [];
  series.segments.forEach((seg) => {
    if (seg.length < 2) return;
    segments.push(
      seg.map((idx) => {
        const rank = series.points[idx].estimatedCityRank as number;
        return { x: xOf(idx), y: yOf(rank) };
      }),
    );
  });

  // 标记点：空心点落在基线（不落 Y 值、不参与位次映射）
  const markers: TrendMarker[] = series.points.map((p, i) => {
    const pctText = p.schoolPositionPct !== null ? `校内位次 ${formatPct(p.schoolPositionPct)}` : '校内位次未记录';
    return {
      x: xOf(i),
      y: p.connectable ? yOf(p.estimatedCityRank as number) : baselineY,
      hollow: p.hollow,
      recordId: p.recordId,
      examName: p.examName,
      infoTitle: p.examName,
      infoText: p.connectable
        ? `${formatDateCn(p.examDate)} · 折算全市位次 ${formatRank(p.estimatedCityRank)}（约）${p.tier ? ` · ${p.tier}` : ''}`
        : `${formatDateCn(p.examDate)} · 本次为校内考试，无折算全市位次。${pctText}${p.schoolPositionPct !== null ? '（仅与校内考试互比）' : ''}`,
    };
  });

  const targets: TrendTargetLine[] = specs.map((s, i) => ({
    y: yOf(s.rank),
    label: s.label && s.label !== '' ? s.label : `${i === 0 ? '最优档' : '稳妥档'}线 ${formatRank(s.rank)}`,
  }));

  // Retain readable dates rather than a label at every point.
  const xLabels: {x:number;text:string}[] = [];
  series.points.forEach((p,i) => {
    const x=xOf(i),text=p.examDate.slice(5).replace('-', '/');
    const last=xLabels[xLabels.length-1];
    if (!last || x-last.x>=48) xLabels.push({x,text});
    else if (i===series.points.length-1 && x-last.x>=20) {xLabels.pop();xLabels.push({x,text});}
  });

  const yLabels = [
    { y: pad.top + 4, text: '位次优' },
    { y: baselineY - 4, text: '位次弱' },
  ];

  const lastIdx = series.points.length - 1;
  const lastPoint = lastIdx >= 0 ? series.points[lastIdx] : null;
  const latest =
    lastPoint && lastPoint.connectable
      ? {
          x: xOf(lastIdx),
          y: yOf(lastPoint.estimatedCityRank as number),
          text: formatRank(lastPoint.estimatedCityRank),
        }
      : null;

  const headline =
    lastPoint && lastPoint.connectable
      ? `折算位次 ${formatRank(lastPoint.estimatedCityRank)}（约）`
      : '暂无折算位次';

  // 无障碍文字摘要（UIUX §12）
  const summaryParts = series.points.map((p) =>
    p.connectable
      ? `${formatMonthCn(p.examDate)}${formatRank(p.estimatedCityRank)}位`
      : `${formatMonthCn(p.examDate)}校内考试无折算位次`,
  );
  const summary = summaryParts.length
    ? `折算全市位次趋势：${summaryParts.join('、')}。空心点代表校内考试，不参与位次映射。`
    : '暂无趋势数据。';

  return {
    width: size.width,
    height: size.height,
    pad,
    segments,
    markers,
    targets,
    xLabels,
    yLabels,
    latest,
    legend: series.legend,
    axisText: { top: '位次优', bottom: '位次弱' },
    emptyText: series.connectableCount === 0 ? EMPTY_TEXT : null,
    singlePointTip: series.connectableCount === 1 && !series.canRenderLine ? SINGLE_TIP : null,
    summary,
    headline,
  };
}
