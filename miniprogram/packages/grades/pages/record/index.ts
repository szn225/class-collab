const grades = require('../../../../utils/grades');
const auth = require('../../../../utils/auth');
import { scopeKey, guardAwait, scopeTimeout } from '../../utils/scope';
const { gradePage }: { gradePage: typeof Page } = require('../../../../utils/grades');
/**
 * 录入 —— 极简手动录入（SPEC §7 页2 / UIUX §9.2 / AC-01~AC-13）
 *
 * 设计立场：不用分步向导；单页表单 + 类型驱动字段显隐 + 智能默认 + 底部实时结论条。
 * 手输最少 1–2 个数字：统考=全市位次 / 集团联考=集团排名 / 校内考试=校排+校总人数。
 */

import type { Dataset, ExamScope, SurveyGrade } from '../../core/types';
import { describeDataSourceError } from '../../services/data-source';
import { datasetService } from '../../services/dataset.service';
import { recordService } from '../../services/record.service';
import type { PreviewView } from '../../services/record.service';
import {
  applyProfile,
  emptyForm,
  SUBJECT_PRESETS,
  validateForm,
} from '../../services/record-form';
import type { SubjectRow, RecordForm } from '../../services/record-form';
import { today } from '../../utils/format';
import { setTabBarValue } from '../../utils/tabbar';
import { trackEvent } from '../../utils/track';

interface ScopeOption {
  value: ExamScope;
  label: string;
}

const SCOPE_OPTIONS: ScopeOption[] = [
  { value: 'city', label: '全市统考' },
  { value: 'group', label: '集团联考' },
  { value: 'school', label: '校内考试' },
];

const QUICK_NAMES = ['月考', '期中', '期末', '一模', '二模'];
const GRADE_OPTIONS: SurveyGrade[] = ['A', 'B', 'C', 'D'];

/**
 * 结论条引导态（不含数值）。
 * label / guideText 必须与 services/record.service.ts 的 guideTextOf 逐字一致 ——
 * 否则保存后重置成上次画像里的 city / school 口径时，引导语还在说「集团排名」。
 */
function guidePreviewFor(scope: ExamScope): PreviewView {
  if (scope === 'school') {
    return {
      state: 'guide',
      label: '校内位次',
      value: '—',
      tierText: '',
      tierKey: '',
      delta: null,
      guideText: '填完校排名与校总人数，这里显示校内位次%',
      note: '',
    };
  }
  if (scope === 'city') {
    return {
      state: 'guide',
      label: '全市位次',
      value: '—',
      tierText: '',
      tierKey: '',
      delta: null,
      guideText: '填完全市位次，这里显示全市位次',
      note: '',
    };
  }
  return {
    state: 'guide',
    label: '折算全市位次（约）',
    value: '—',
    tierText: '',
    tierKey: '',
    delta: null,
    guideText: '填完集团排名，这里显示（约）全市位次',
    note: '',
  };
}

interface RecordCtx {
  _dataset?: Dataset;
  _saveRequest?: { id: string; form: RecordForm; dataset: Dataset };
  _resumeSave?: string;
  _prevRank: number | null;
  _previewTimer?: number;
  _draftTimer?: number;
}

let seq = 0;
function newSubjectRow(subject: string): SubjectRow {
  seq += 1;
  return { id: `s${seq}`, subject, full: '', score: '' };
}

gradePage({
  data: {
    form: { ...emptyForm(today()), scope: 'city' } as RecordForm,
    errors: {} as Record<string, string>,
    subjectError: '',
    preview: guidePreviewFor(emptyForm(today()).scope),
    canSave: false,
    saving: false,
    saveError: '',
    showMore: false,
    draftNotice: '',
    groups: [] as string[],
    groupIndex: 0,
    scopeOptions: SCOPE_OPTIONS,
    quickNames: QUICK_NAMES,
    gradeOptions: GRADE_OPTIONS,
    subjectPresets: SUBJECT_PRESETS,
    surveySubjects: [] as string[],
    reuse: { groupName: '', schoolSize: '', groupSize: '' },
  },

  onShow() {
    setTabBarValue(this, 1);
  },

  onLoad(options: Record<string, string>) {
    (this as unknown as RecordCtx)._resumeSave = options.save || '';
    this.bootstrap();
  },

  viewRecords() { wx.redirectTo({url:'/packages/grades/pages/dashboard/index'}); },

  async bootstrap() {
 const gradeOperationScope = scopeKey(); void gradeOperationScope;

    try {
      const ctx = this as unknown as RecordCtx;
      const pending = ctx._resumeSave ? auth.pendingGradeSave(ctx._resumeSave) as {id:string;form:RecordForm;dataset:Dataset} : null;
      const dataset = pending ? pending.dataset : await guardAwait(datasetService.getActiveDataset(), gradeOperationScope);
      ctx._dataset = dataset;
      ctx._prevRank = await guardAwait(recordService.lastConnectableRank(), gradeOperationScope);

      const groups = Object.keys(dataset.groupCoeffs || {});
      const profile = await guardAwait(recordService.getProfile(), gradeOperationScope);
      const base = applyProfile({...emptyForm(today()), scope:'city'}, profile);

      // 草稿优先恢复（UIUX §9.2.7）
      const draft = recordService.getDraft();
      const form = pending ? pending.form : draft ? draft.form : base;
      let draftNotice = '';
      if (draft) {
        const age = Date.now() - (draft.savedAt || 0);
        const days = Math.floor(age / 86400000);
        draftNotice = days >= 1 ? `上次填了一半，已恢复（${days} 天前的草稿）` : '上次填了一半，已恢复';
      }

      this.setData({
        form,
        groups,
        groupIndex: Math.max(0, groups.indexOf(form.groupName)),
        surveySubjects: dataset.surveySubjects || [],
        reuse: {
          groupName: profile ? profile.groupName : '',
          schoolSize: profile ? profile.schoolSize : '',
          groupSize: profile ? profile.groupSize : '',
        },
        draftNotice,
      });
      this.refresh();
      if(pending){ctx._saveRequest=pending;ctx._resumeSave='';await guardAwait(this.onSave(),gradeOperationScope);}
    } catch (e) {
      this.setData({ saveError: describeDataSourceError(e) });
    }
  },

  /* ------------------------- 字段输入 ------------------------- */

  onInput(e: WechatMiniprogram.Input) {
    const field = String(e.currentTarget.dataset.field || '');
    if (!field) return;
    this.setData({ [`form.${field}`]: e.detail.value, saveError: '' }, () => {
      this.scheduleDraft();
      this.schedulePreview();
    });
  },

  onPickName(e: WechatMiniprogram.BaseEvent) {
    const name = String(e.currentTarget.dataset.name || '');
    const cur = this.data.form.examName;
    const next = cur.indexOf(name) >= 0 ? cur : name;
    this.setData({ 'form.examName': next }, () => {
      this.scheduleDraft();
      this.schedulePreview();
    });
  },

  onDateChange(e: WechatMiniprogram.PickerChange) {
    this.setData({ 'form.examDate': String(e.detail.value) }, () => this.scheduleDraft());
  },

  onPickScope(e: WechatMiniprogram.BaseEvent) {
    const scope = String(e.currentTarget.dataset.scope) as ExamScope;
    this.setData({ 'form.scope': scope, saveError: '' }, () => {
      this.scheduleDraft();
      this.schedulePreview();
    });
  },

  onGroupChange(e: WechatMiniprogram.PickerChange) {
    const index = Number(e.detail.value);
    const name = this.data.groups[index] || '';
    this.setData({ groupIndex: index, 'form.groupName': name, saveError: '' }, () => {
      this.scheduleDraft();
      this.schedulePreview();
    });
  },

  onReuseGroup() {
    this.setData({ 'form.groupName': this.data.reuse.groupName }, () => {
      this.setData({ groupIndex: Math.max(0, this.data.groups.indexOf(this.data.reuse.groupName)) });
      this.schedulePreview();
    });
  },

  onReuseSchoolSize() {
    this.setData({ 'form.schoolSize': this.data.reuse.schoolSize }, () => {
      this.scheduleDraft();
      this.schedulePreview();
    });
  },

  onReuseGroupSize() {
    this.setData({ 'form.groupSize': this.data.reuse.groupSize }, () => {
      this.scheduleDraft();
      this.schedulePreview();
    });
  },

  storageInfo() { wx.showModal({title:'本机保存',content:'成绩保存在当前设备。清理小程序数据可能导致丢失，可在“我的”中登录并主动开启云端同步。',showCancel:false}); },
  onToggleMore() {
    this.setData({ showMore: !this.data.showMore });
  },

  /* ------------------------- 选填明细 ------------------------- */

  onSubjectInput(e: WechatMiniprogram.Input) {
    const index = Number(e.currentTarget.dataset.index);
    const key = String(e.currentTarget.dataset.key || '');
    this.setData({ [`form.subjects[${index}].${key}`]: e.detail.value }, () => {
      this.scheduleDraft();
      this.schedulePreview();
    });
  },

  onAddSubject(e: WechatMiniprogram.BaseEvent) {
    const name = String(e.currentTarget.dataset.name || '');
    const subjects = this.data.form.subjects.concat([newSubjectRow(name)]);
    this.setData({ 'form.subjects': subjects });
  },

  onRemoveSubject(e: WechatMiniprogram.BaseEvent) {
    const index = Number(e.currentTarget.dataset.index);
    const subjects = this.data.form.subjects.filter((_, i) => i !== index);
    this.setData({ 'form.subjects': subjects }, () => this.schedulePreview());
  },

  onPickGrade(e: WechatMiniprogram.BaseEvent) {
    const subject = String(e.currentTarget.dataset.subject || '');
    const grade = String(e.currentTarget.dataset.grade || '') as SurveyGrade;
    const cur = this.data.form.surveyGrades[subject];
    this.setData({ [`form.surveyGrades.${subject}`]: cur === grade ? '' : grade }, () =>
      this.scheduleDraft(),
    );
  },

  onPickQuality(e: WechatMiniprogram.BaseEvent) {
    const val = String(e.currentTarget.dataset.val) === '1';
    const cur = this.data.form.qualityEval;
    this.setData({ 'form.qualityEval': cur === val ? null : val }, () => this.scheduleDraft());
  },

  /* ------------------------- 预览 / 校验 ------------------------- */

  schedulePreview() {
    const ctx = this as unknown as RecordCtx;
    if (ctx._previewTimer) clearTimeout(ctx._previewTimer);
    ctx._previewTimer = scopeTimeout(() => this.refresh(), 300) as unknown as number;
  },

  /** 实时结论条 + 保存可用性（防抖后调用，AC-06 / AC-11） */
  refresh() {
    const ctx = this as unknown as RecordCtx;
    const dataset = ctx._dataset;
    if (!dataset) return;
    const form = this.data.form;
    const v = validateForm(form, dataset);
    const preview = recordService.buildPreview(form, dataset, ctx._prevRank);
    this.setData({
      preview,
      errors: v.errorMap,
      subjectError: v.subjectError,
      canSave: v.ok,
    });
  },

  scheduleDraft() {
    const ctx = this as unknown as RecordCtx;
    if (ctx._draftTimer) clearTimeout(ctx._draftTimer);
    ctx._draftTimer = scopeTimeout(() => recordService.saveDraft(this.data.form), 500) as unknown as number;
  },

  onClearDraft() {
    recordService.clearDraft();
    this.setData({ draftNotice: '' });
    this.bootstrap();
  },

  /* ------------------------- 保存 ------------------------- */

  async onSave() {
    const gradeOperationScope = scopeKey();
    if (this.data.saving) return;
    const ctx = this as unknown as RecordCtx, dataset = ctx._dataset;
    if (!dataset) { this.setData({saveError:'页面还在加载，请稍后再试'}); return; }
    const validation = validateForm(this.data.form, dataset);
    this.setData({errors:validation.errorMap,subjectError:validation.subjectError});
    if (!validation.ok) {
      const hint = validation.missingLabels.length ? '请填写'+validation.missingLabels[0] : '请检查标红的内容';
      this.setData({saveError:hint});
      wx.showToast({title:hint,icon:'none'});
      wx.pageScrollTo({scrollTop:0,duration:200});
      return;
    }
    if (!ctx._saveRequest || JSON.stringify(ctx._saveRequest.form)!==JSON.stringify(this.data.form)) {
      ctx._saveRequest=auth.beginGradeSave(this.data.form,dataset);
    }
    const pending=ctx._saveRequest!;
    this.setData({saving:true,saveError:''});
    try {
      if (auth.isLoggedIn()) auth.claimGradeSave(pending.id);
      const existing = await guardAwait(recordService.get(pending.id),gradeOperationScope);
      if (!existing) await guardAwait(recordService.save(this.data.form,dataset,pending.id),gradeOperationScope);
      if (auth.isLoggedIn() && grades.status().enabled) {
        try { await guardAwait(grades.sync(),gradeOperationScope); } catch { /* Local save is durable; sync can be retried from the account page. */ }
      }
      if(ctx._draftTimer)clearTimeout(ctx._draftTimer);
      if(ctx._previewTimer)clearTimeout(ctx._previewTimer);
      auth.finishGradeSave(pending.id);
      ctx._saveRequest=undefined;
      recordService.clearDraft();
      trackEvent('record_saved',{scope:this.data.form.scope});
      wx.redirectTo({url:'/packages/grades/pages/dashboard/index?saved=1'});
    } catch (error) {
      const e=error as Error & {status?:number};
      this.setData({saving:false,saveError:(e.message||'保存未完成')+'。填写内容已保留，可再次点击保存。'});
    } finally {
      this.setData({saving:false});
    }
  },
});
