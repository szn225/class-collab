/**
 * metric-hero —— 大数字指标区
 *
 * 表现层组件：只渲染，不做业务判定。
 * delta 由页面/服务层用 utils/format 的 formatRankDelta 生成（含箭头 + 文字，色盲可读）。
 */

Component({
  options: { styleIsolation: 'apply-shared' },

  properties: {
    /** 指标名，如「折算全市位次（约）」 */
    label: { type: String, value: '' },
    /** 指标值，已格式化（如 "7,665" / "6.1%"） */
    value: { type: String, value: '—' },
    /** 单位后缀，如 "%" */
    unit: { type: String, value: '' },
    /** { dir, icon, text, chipClass }；无方向（持平/无参照）时不显示，见 wxml 的 delta.dir 守卫 */
    delta: { type: Object, value: {} },
    /** 中性 chip 文案（如「校内考试 · 仅出校内位次%」） */
    chipText: { type: String, value: '' },
    /** 副行文案（如「校内前 6.1% · 集团前 10.2%」） */
    sub: { type: String, value: '' },
  },
});
