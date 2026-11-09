/** 自绘导航栏：真实状态栏高度 + 44px 行 + 胶囊避让（依据 UIUX §9 原型 appbar） */
interface WinInfoLike {
  statusBarHeight?: number;
  windowWidth?: number;
}

const DEFAULT_STATUS = 20;
const DEFAULT_NAV = 44;

function readWindowInfo(): WinInfoLike {
  const api = wx as unknown as { getWindowInfo?: () => WinInfoLike };
  if (typeof api.getWindowInfo === 'function') return api.getWindowInfo();
  return wx.getSystemInfoSync() as WinInfoLike;
}

Component({
  properties: {
    title: { type: String, value: '' },
    /** 非 Tab 页显示返回箭头 */
    showBack: { type: Boolean, value: false },
  },

  data: {
    statusBarHeight: DEFAULT_STATUS,
    navBarHeight: DEFAULT_NAV,
    totalHeight: DEFAULT_STATUS + DEFAULT_NAV,
    /** 右侧让位胶囊按钮的宽度 */
    rightPad: 96,
  },

  lifetimes: {
    attached() {
      this.measure();
    },
  },

  methods: {
    measure() {
      let statusBarHeight = DEFAULT_STATUS;
      let windowWidth = 375;
      try {
        const info = readWindowInfo();
        statusBarHeight = info.statusBarHeight || DEFAULT_STATUS;
        windowWidth = info.windowWidth || 375;
      } catch (e) {
        // 取不到就退回默认值，不让整个页面白屏
      }

      let navBarHeight = DEFAULT_NAV;
      let rightPad = 96;
      try {
        const capsule = wx.getMenuButtonBoundingClientRect();
        if (capsule && capsule.height > 0 && capsule.top >= statusBarHeight) {
          navBarHeight = (capsule.top - statusBarHeight) * 2 + capsule.height;
        }
        if (capsule && capsule.left > 0) {
          rightPad = Math.max(16, windowWidth - capsule.left + 8);
        }
      } catch (e) {
        // 开发者工具早期阶段可能取不到胶囊信息
      }

      this.setData({
        statusBarHeight,
        navBarHeight,
        totalHeight: statusBarHeight + navBarHeight,
        rightPad,
      });
    },

    onBack() {
      const pages = getCurrentPages();
      if (pages.length > 1) {
        wx.navigateBack({ delta: 1 });
        return;
      }
      wx.redirectTo({ url: '/packages/grades/pages/dashboard/index' });
    },
  },
});
