/**
 * tier-verdict —— 冲/稳/保 三档结论区
 *
 * cards 由 position.service.buildTierVerdict 产出（位次→档次，零硬编码阈值）。
 * 点击卡片向外抛 `cardtap`，由页面决定是否展开「为什么」（缺口位次）。
 */

interface VerdictCard {
  key: 'chong' | 'wen' | 'bao';
  label: string;
  tierName: string;
  lineText: string;
}

Component({
  options: { styleIsolation: 'apply-shared' },

  properties: {
    cards: { type: Array, value: [] as VerdictCard[] },
  },

  methods: {
    onTapCard(e: WechatMiniprogram.BaseEvent) {
      const index = Number(e.currentTarget.dataset.index);
      const cards = this.data.cards as VerdictCard[];
      this.triggerEvent('cardtap', { index, card: cards[index] || null });
    },
  },
});
