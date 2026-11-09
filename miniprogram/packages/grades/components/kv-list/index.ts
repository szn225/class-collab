/**
 * kv-list —— 键值对分组列表
 *
 * items: { k, v, sub?, strong? }[]
 * 高密度证据层用：组标题 + 键值行，纵向可读（UIUX §9.6 的 L3 下钻）。
 */

Component({
  options: { styleIsolation: 'apply-shared' },

  properties: {
    title: { type: String, value: '' },
    items: { type: Array, value: [] },
  },
});
