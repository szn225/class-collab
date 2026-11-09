/**
 * empty-state —— 空态（AC-33）
 *
 * 文案规则：具体、可行动。禁用「Welcome / 暂无数据」式空洞占位。
 */

Component({
  options: { styleIsolation: 'apply-shared' },

  properties: {
    /** TDesign Icons 名称（禁 emoji） */
    icon: { type: String, value: 'file-paste' },
    title: { type: String, value: '' },
    desc: { type: String, value: '' },
    actionText: { type: String, value: '' },
    actionIcon: { type: String, value: '' },
  },

  methods: {
    onAction() {
      this.triggerEvent('action');
    },
  },
});
