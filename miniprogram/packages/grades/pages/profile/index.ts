import { scopeKey, guardAwait, scopeTimeout } from '../../utils/scope';
const { gradePage }: { gradePage: typeof Page } = require('../../../../utils/grades');
/**
 * 设置 —— 备份导出/导入 · 数据版本 · 免责声明（SPEC §7 页6 / §9.7 F11 / AC-29~AC-32）
 *
 * 文件读写细节留在页面（用户交互），校验与落盘语义在 dataset.service（整包原子）。
 */

import { describeDataSourceError } from '../../services/data-source';
import { datasetService } from '../../services/dataset.service';
import type { DatasetMeta } from '../../services/dataset.service';
import { referenceService } from '../../services/reference.service';
import { trackEvent } from '../../utils/track';

interface KvItem {
  k: string;
  v: string;
  strong?: boolean;
}

gradePage({
  toggle(e: WechatMiniprogram.BaseEvent) {const section=String(e.currentTarget.dataset.section);this.setData({openSection:this.data.openSection===section?'':section});},
  data: {
    openSection:'',
    exporting: false,
    importing: false,
    meta: null as DatasetMeta | null,
    metaKv: [] as KvItem[],
    disclaimer: '',
    mySchool: '',
    schoolNames: [] as string[],
    schoolIndex: 0,
  },

  onShow() {
    this.load();
  },

  async load() {
 const gradeOperationScope = scopeKey(); void gradeOperationScope;

    try {
      const [meta, disclaimer, mySchool, names] = await guardAwait(Promise.all([
        datasetService.getMeta(),
        datasetService.getDisclaimer(),
        referenceService.getMySchool(),
        referenceService.listSchoolNames(),
      ]), gradeOperationScope);
      const metaKv: KvItem[] = [
        { k: '当前口径', v: meta.dataVersion, strong: true },
        { k: '地区', v: meta.region },
        { k: '生效时间', v: `${meta.effectiveFrom} 起` },
        { k: '中考总分', v: `${meta.examTotalScore} 分（含体育 ${meta.sportsScore} 分）` },
        { k: '录取线条目', v: `${meta.admissionLineRankedCount} 所可位次参照 / 共 ${meta.admissionLineCount} 条` },
        { k: '指标生对照', v: `${meta.indicatorSchoolCount} 所初中` },
        { k: '规则要点', v: `${meta.ruleCount} 条` },
      ];
      this.setData({
        meta,
        metaKv,
        disclaimer,
        mySchool,
        schoolNames: names,
        schoolIndex: Math.max(0, names.indexOf(mySchool)),
      });
    } catch (e) {
      wx.showToast({ title: describeDataSourceError(e), icon: 'none' });
    }
  },

  /* ------------------------- 导出（AC-29 / AC-32） ------------------------- */

  async onExport() {
 const gradeOperationScope = scopeKey(); void gradeOperationScope;

    if (this.data.exporting) return;
    this.setData({ exporting: true });
    try {
      const { empty, fileName, content } = await guardAwait(datasetService.buildBackup(), gradeOperationScope);
      if (empty) {
        wx.showToast({ title: '暂无可导出的数据', icon: 'none' });
        return;
      }
      // 只有「确实交付到用户手里」（分享成功 / 剪贴板兜底）才算导出成功；
      // buildBackup 抛错、写文件失败且兜底也失败时不记。
      const markExported = (): void => {
        trackEvent('backup_exported', { ok: true });
      };
      const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`;
      try {
        wx.getFileSystemManager().writeFileSync(filePath, content, 'utf8');
        wx.shareFileMessage({
          filePath,
          fileName,
          success: () => {
            markExported();
            wx.showToast({ title: '已生成备份文件', icon: 'none' });
          },
          fail: () => {
            markExported();
            this.fallbackCopy(content);
          },
        });
      } catch (e) {
        markExported();
        this.fallbackCopy(content);
      }
    } catch (e) {
      wx.showToast({ title: describeDataSourceError(e), icon: 'none' });
    } finally {
      this.setData({ exporting: false });
    }
  },

  /** 分享不可用时的兜底：把备份 JSON 复制到剪贴板 */
  fallbackCopy(content: string) {
    wx.setClipboardData({
      data: content,
      success: () => wx.showToast({ title: '备份内容已复制，可粘贴到备忘录保存', icon: 'none' }),
    });
  },

  /* ------------------------- 导入（AC-30 / AC-31） ------------------------- */

  onImport() {
    if (this.data.importing) return;
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['json'],
      success: (res) => {
        const file = res.tempFiles && res.tempFiles[0];
        if (!file) return;
        this.setData({ importing: true });
        try {
          const text = wx.getFileSystemManager().readFileSync(file.path, 'utf8') as string;
          datasetService
            .restoreFromText(text)
            .then(() => {
              wx.showToast({ title: '已恢复备份', icon: 'none' });
              trackEvent('backup_imported', { ok: true });
              scopeTimeout(() => wx.redirectTo({ url: '/packages/grades/pages/dashboard/index' }), 800);
            })
            .catch((e) => {
              wx.showModal({
                title: '导入失败',
                content: describeDataSourceError(e),
                showCancel: false,
                confirmText: '知道了',
              });
            })
            .then(() => this.setData({ importing: false }));
        } catch (e) {
          this.setData({ importing: false });
          wx.showToast({ title: '读不到这个文件', icon: 'none' });
        }
      },
    });
  },

  /* ------------------------- 年度口径热切换 ------------------------- */

  onImportDataset() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['json'],
      success: (res) => {
        const file = res.tempFiles && res.tempFiles[0];
        if (!file) return;
        try {
          const text = wx.getFileSystemManager().readFileSync(file.path, 'utf8') as string;
          datasetService
            .importDatasetFromText(text)
            .then((version) => {
              wx.showToast({ title: `已切换到 ${version}`, icon: 'none' });
              this.load();
            })
            .catch((e) => {
              wx.showModal({
                title: '数据集不可用',
                content: describeDataSourceError(e),
                showCancel: false,
                confirmText: '知道了',
              });
            });
        } catch (e) {
          wx.showToast({ title: '读不到这个文件', icon: 'none' });
        }
      },
    });
  },

  /* ------------------------- 本校 ------------------------- */

  onPickSchool(e: WechatMiniprogram.PickerChange) {
    const index = Number(e.detail.value);
    const name = this.data.schoolNames[index] || '';
    this.setData({ schoolIndex: index, mySchool: name });
    referenceService.setMySchool(name);
  },
});
