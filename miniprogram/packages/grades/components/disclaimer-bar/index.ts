/**
 * disclaimer-bar —— 免责声明条（AC-35）
 *
 * 文案由 dataset.disclaimer 注入，不在组件内写死（数据化）。
 */

Component({
  options: { styleIsolation: 'apply-shared' },

  properties: {
    text: { type: String, value: '' },
  },
});
