/**
 * custom-tab-bar —— 自定义 TabBar
 *
 * 为什么自定义：TabBar 的 iconPath 只接受位图（PNG/JPG），无法直接使用
 * TDesign SVG 图标；自定义 TabBar 才能满足「图标唯一一套 = TDesign Icons，禁 emoji」的 P0 要求。
 *
 * 页面通过 utils/tabbar.setTabBarValue(this, index) 同步选中态。
 */

interface TabItem {
  pagePath: string;
  text: string;
  icon: string;
  selectedIcon: string;
}

const LIST: TabItem[] = [
  { pagePath: '/packages/grades/pages/dashboard/index', text: '成绩', icon: 'location', selectedIcon: 'location-filled' },
  { pagePath: '/packages/grades/pages/record/index', text: '录入', icon: 'edit', selectedIcon: 'edit-1' },
  { pagePath: '/packages/grades/pages/plan/index', text: '复盘', icon: 'task', selectedIcon: 'task-checked' },
  { pagePath: '/packages/grades/pages/reference/index', text: '参照', icon: 'book', selectedIcon: 'book-filled' },
];

Component({
  options: { styleIsolation: 'apply-shared' },

  properties: { value: { type: Number, value: 0 } },
  data: {
    list: LIST,
  },

  methods: {
    onTap(e: WechatMiniprogram.BaseEvent) {
      const index = Number(e.currentTarget.dataset.index);
      const item = LIST[index];
      if (!item) return;
      if (index === this.data.value) return;
      wx.redirectTo({ url: item.pagePath });
    },
  },
});
