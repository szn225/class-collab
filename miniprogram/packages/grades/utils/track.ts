const { storage: gradeStorage } = require('../../../utils/grades');
/**
 * track.ts —— 极简本地埋点（SPEC §10 合规约束 / D-04）
 *
 * 立场：
 *   - **纯本地**：只写 `gradeStorage.setStorageSync('track_events', ...)`，绝不发起任何网络请求；
 *   - **零敏感**：props 只允许固定白名单键（枚举 / 计数），成绩分数、位次、姓名、IP 一律不写；
 *   - **绝不添乱**：所有 wx 调用包 try/catch，失败静默 —— 埋点永不影响主流程；
 *   - 环形缓冲上限 200 条，超出丢最旧。
 */

/** 一条本地事件 */
export interface TrackEvent {
  /** 事件名，形如 `{对象}_{动作}`（如 dashboard_viewed） */
  name: string;
  /** ISO 时间戳 */
  at: string;
  /** 已白名单过滤的属性；无合法属性时不带该字段 */
  props?: Record<string, string | number | boolean>;
}

/** 允许出现在 props 里的键（固定白名单：只放枚举 / 计数，不放任何业务数值） */
const ALLOWED_KEYS: string[] = ['scope', 'page', 'count', 'ok'];

/** 环形缓冲上限 */
const MAX_EVENTS = 200;

/** 本地存储键（纯诊断数据，不进入备份、不迁移） */
const STORAGE_KEY = 'track_events';

/** 字符串属性的最大长度：超长即视为误传（可能是校名 / 备注等自由文本），直接丢弃 */
const MAX_STRING_LEN = 24;

/** 整数属性的上界：位次、分数这类数值必须远超此值，故不会被误采 */
const MAX_INT = 100000;

type PropValue = string | number | boolean;

/**
 * 按白名单与类型约束过滤 props。
 * @param props 调用方传入的原始属性
 * @returns 过滤后的属性；一条都不剩时返回 undefined
 */
function filterProps(props?: Record<string, PropValue>): Record<string, PropValue> | undefined {
  if (!props || typeof props !== 'object') return undefined;
  const out: Record<string, PropValue> = {};
  let kept = 0;
  ALLOWED_KEYS.forEach((key) => {
    if (!Object.prototype.hasOwnProperty.call(props, key)) return;
    const value = props[key];
    if (typeof value === 'boolean') {
      out[key] = value;
      kept += 1;
      return;
    }
    if (typeof value === 'string') {
      if (value.length > 0 && value.length <= MAX_STRING_LEN) {
        out[key] = value;
        kept += 1;
      }
      return;
    }
    if (typeof value === 'number') {
      // 只收非负小整数：位数很多的位次 / 分数会被拒收
      if (Number.isInteger(value) && value >= 0 && value <= MAX_INT) {
        out[key] = value;
        kept += 1;
      }
    }
  });
  return kept > 0 ? out : undefined;
}

/**
 * 读取现有事件列表（脏数据一律当空数组，保证调用方拿到数组）。
 * @returns 事件列表（数组副本）
 */
function readEvents(): TrackEvent[] {
  try {
    const raw = gradeStorage.getStorageSync(STORAGE_KEY);
    if (!Array.isArray(raw)) return [];
    return raw.filter((x): x is TrackEvent => {
      if (!x || typeof x !== 'object') return false;
      const e = x as Partial<TrackEvent>;
      return typeof e.name === 'string' && typeof e.at === 'string';
    });
  } catch (e) {
    return [];
  }
}

/**
 * 记录一条本地事件。失败静默（埋点绝不能影响主流程）。
 * @param name 事件名，建议 `{对象}_{动作}`，如 `record_saved`
 * @param props 属性（仅白名单键生效，其余丢弃）
 */
export function trackEvent(
  name: string,
  props?: Record<string, string | number | boolean>,
): void {
  try {
    if (!name || typeof name !== 'string') return;
    const filtered = filterProps(props);
    const event: TrackEvent = { name, at: new Date().toISOString() };
    if (filtered) event.props = filtered;
    const list = readEvents();
    list.push(event);
    // 环形：只保留最近 MAX_EVENTS 条
    const trimmed = list.length > MAX_EVENTS ? list.slice(list.length - MAX_EVENTS) : list;
    gradeStorage.setStorageSync(STORAGE_KEY, trimmed);
  } catch (e) {
    // 静默：存储满 / 被禁用 / 隐私模式等情况一律吞掉
  }
}
