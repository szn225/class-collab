import { scopeKey, guardAwait, scopeTimeout } from '../../utils/scope';
const { gradePage }: { gradePage: typeof Page } = require('../../../../utils/grades');
const { storage: gradeStorage } = require('../../../../utils/grades');
/**
 * 考试详情 —— 分科体检（SPEC §7 页3 / UIUX §9.3）
 *
 * 非 Tab 页：从定位页趋势点或考试列表项 push 进入，保留系统返回。
 * 未录分科时显示空态说明，不报错、不阻断（位次闭环不依赖分科数据）。
 */

import { planService } from '../../services/plan.service';
import { recordService } from '../../services/record.service';
import type { ExamDetailView, SubjectRowView } from '../../services/record.service';
import { today } from '../../utils/format';

/** 已分析标记：按考试存「哪些科目看过」，本地存储（自用单端，不做云同步） */
const MARKS_KEY = 'exam_analysis_marks';

type Marks = Record<string, string[]>;

function readMarks(): Marks {
  try {
    const raw = gradeStorage.getStorageSync(MARKS_KEY) as Marks | '' | undefined;
    return raw && typeof raw === 'object' ? raw : {};
  } catch (e) {
    return {};
  }
}

function writeMarks(marks: Marks): void {
  try {
    gradeStorage.setStorageSync(MARKS_KEY, marks);
  } catch (e) {
    // 存储失败不阻断查看
  }
}

type SubjectRowViewWithMark = SubjectRowView & { analyzed: boolean };

function addDays(base: string, days: number): string {
  const d = new Date(`${base}T00:00:00`);
  d.setDate(d.getDate() + days);
  const p = (n: number) => `${n}`.padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

gradePage({
  data: {
    loading: true,
    error: '',
    detail: null as ExamDetailView | null,
    /** 只看这一科（'' = 全部） */
    onlySubject: '',
    visibleRows: [] as SubjectRowViewWithMark[],
    analyzedMap: {} as Record<string, boolean>,
  },

  onLoad(query: Record<string, string | undefined>) {
    const examId = query.examId || '';
    if (!examId) {
      this.setData({ loading: false, error: '缺少考试标识' });
      return;
    }
    this.load(examId);
  },

  async load(examId: string) {
 const gradeOperationScope = scopeKey(); void gradeOperationScope;

    try {
      const record = await guardAwait(recordService.get(examId), gradeOperationScope);
      if (!record) {
        this.setData({ loading: false, error: '这次考试记录已不存在' });
        return;
      }
      const detail = recordService.buildExamDetail(record);
      const marks = readMarks();
      const analyzedMap: Record<string, boolean> = {};
      (marks[detail.id] || []).forEach((s) => {
        analyzedMap[s] = true;
      });
      this.setData({ loading: false, detail, analyzedMap }, () => this.applyView());
    } catch (e) {
      this.setData({ loading: false, error: '加载失败，请返回重试' });
    }
  },

  /** 加载失败时的退出路径：回到定位页 */
  goBack() {
    wx.redirectTo({ url: '/packages/grades/pages/dashboard/index' });
  },

  /* ------------------------- 分科行：筛选与标记（UIUX §9.3-4） ------------------------- */

  /** 分科行视图 = 详情行 × 「只看这一科」筛选 × 「已分析」标记 */
  applyView() {
    const d = this.data.detail;
    if (!d) return;
    const only = this.data.onlySubject;
    const map = this.data.analyzedMap;
    const rows = d.subjectRows
      .filter((r) => only === '' || r.subject === only)
      .map((r) => ({ ...r, analyzed: !!map[r.subject] }));
    this.setData({ visibleRows: rows });
  },

  onShowAllSubjects() {
    this.setData({ onlySubject: '' }, () => this.applyView());
  },

  /** 长按科目行 → ActionSheet（只看这一科 / 标记已分析），收敛次要操作 */
  onLongPressSubject(e: WechatMiniprogram.BaseEvent) {
    const subject = String(e.currentTarget.dataset.subject || '');
    if (!subject) return;
    const focused = this.data.onlySubject === subject;
    const analyzed = !!this.data.analyzedMap[subject];
    const items = [focused ? '看全部科目' : `只看 ${subject}`, analyzed ? '取消已分析' : '标记已分析'];
    wx.showActionSheet({
      itemList: items,
      success: (res) => {
        if (res.tapIndex === 0) {
          this.setData({ onlySubject: focused ? '' : subject }, () => this.applyView());
        } else {
          this.toggleAnalyzed(subject, !analyzed);
        }
      },
    });
  },

  /** 已分析标记：本地持久化，重进详情仍保留 */
  toggleAnalyzed(subject: string, next: boolean) {
    const d = this.data.detail;
    if (!d) return;
    const marks = readMarks();
    const set = new Set(marks[d.id] || []);
    if (next) set.add(subject);
    else set.delete(subject);
    marks[d.id] = Array.from(set);
    writeMarks(marks);
    const analyzedMap = { ...this.data.analyzedMap, [subject]: next };
    this.setData({ analyzedMap }, () => this.applyView());
    wx.showToast({ title: next ? `已标记 ${subject} 已分析` : `已取消 ${subject} 标记`, icon: 'none' });
  },

  /** 由最低得分率科目一键生成复盘项（UIUX §9.4 约定的空态来源） */
  goPlan() {
    const d = this.data.detail;
    if (!d) return;
    if (!d.hasSubjects) {
      wx.showToast({ title: '本次未录分科，先补录各科分数再生成复盘项', icon: 'none' });
      scopeTimeout(() => wx.redirectTo({ url: '/packages/grades/pages/plan/index' }), 1200);
      return;
    }
    const lowest = d.subjectRows.slice().sort((a, b) => a.rate - b.rate)[0];
    if (!lowest) return;
    wx.showModal({
      title: '生成复盘项',
      content: `这次得分率最低的是「${lowest.subject}」（${lowest.rateText}）。把它作为复盘重点，生成一条待办？`,
      confirmText: '生成',
      success: async (res) => {
 const gradeOperationScope = scopeKey(); void gradeOperationScope;

        if (!res.confirm) return;
        await guardAwait(planService.add({
          title: `复盘 ${lowest.subject} 失分点`,
          subject: lowest.subject,
          knowledge: '',
          owner: '孩子',
          dueDate: addDays(today(), 7),
          status: 'todo',
          result: '',
          examId: d.id,
        }), gradeOperationScope);
        wx.showToast({ title: '已加入复盘', icon: 'none' });
        scopeTimeout(() => wx.redirectTo({ url: '/packages/grades/pages/plan/index' }), 800);
      },
    });
  },
});
