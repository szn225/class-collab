/**
 * 取整与精度 —— core/ 内部唯一的舍入出口
 *
 * 舍入口径（SPEC §12 断言 a / c 为唯一裁决依据）：
 *
 * 【折算全市位次】向下取整（Math.floor）
 *   1) 位次是「第 N 名」的离散序数：739.2 落在第 739 与第 740 名之间，
 *      取「不超过该值的最大整数」即「约第 739 名」，不虚增位次。
 *      断言 a：210 × 3.52 = 739.2 → 739。
 *   2) 与 AC-16「闭区间归更优档」方向自洽：4212.6 向下取整得 4212，仍留在更优档（四大本部）；
 *      若四舍五入成 4213 会被误降到下一档。取整方向统一偏「更优」，避免临界生误判。
 *   3) 源表⑤「1500 × 5.11 ≈ 7665」经核验为向下取整结果（IEEE754 下 1500 × 5.11 = 7665.000000000001，
 *      floor = 7665，与源表一致）。
 *   4) 浮点安全性：已穷举本数据集 4 个集团系数 × 位次 1~60000，Math.floor(rank × coeff) 与
 *      「精确十进制向下取整」0 例偏差（最大表示误差 5.8e-11），故无需引入 epsilon 修正。
 *
 * 【位次百分比】四舍五入保留 4 位小数
 *   占比是连续量，四舍五入舍入误差最小。断言 c：38 / 620 = 0.0612903… → 0.0613。
 *   （若此处也用 floor，会得到 0.0612，与断言 c 不符 —— 两处口径必须分别实现。）
 */

/** 位次百分比保留的小数位（断言 c 要求 38 / 620 → 0.0613） */
export const RANK_PCT_DECIMALS = 4;

/** 位次的下界（第 1 名为最好）；上界不设，由 Dataset 阈值兜底档覆盖 */
export const MIN_RANK = 1;

function assertFiniteNumber(value: number, label: string): void {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`${label}必须是有限数字，收到：${String(value)}`);
  }
}

/**
 * 折算全市位次取整 —— 向下取整。理由见文件头。
 * @throws TypeError 入参不是有限数字（非数字不得静默兜底为 0）
 */
export function floorRank(value: number): number {
  assertFiniteNumber(value, '位次折算值');
  return Math.floor(value);
}

/**
 * 位次百分比取整 —— 四舍五入保留 `decimals` 位。
 * @throws TypeError 入参不是有限数字
 */
export function roundRankPct(value: number, decimals: number = RANK_PCT_DECIMALS): number {
  assertFiniteNumber(value, '位次百分比');
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/** 是否为正整数位次（>= 1）。用于判定「口径源是否可用」。 */
export function isPositiveRank(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value) && value >= MIN_RANK;
}

/** 是否为正的有限数（用于分母：总人数）。 */
export function isPositiveCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}
