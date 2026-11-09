/**
 * target-alias —— 目标校名称归一化（纯函数，无运行时依赖）
 *
 * 为什么需要：
 *   指标生对照表的「对口高中」用家长口语简称（雅礼 / 麓山 / 15中 / 长斑），
 *   录取线表用规范全称（雅礼中学 / 麓山国际实验学校 / 长沙市十五中 / 长郡斑马湖中学）。
 *   两者字面 0 匹配，若不归一化，「设为目标校」就无法解析出位次、趋势图目标线画不出来。
 *
 * 边界（重要）：
 *   - 本文件**只做命名映射**，不含任何阈值 / 系数 / 折算逻辑；
 *   - 位次仍从数据集 admissionLines.cityRank 读取，不在此处计算。
 */

/** 简称 → 录取线表全称（键一律用半角括号，比较前先 normalize） */
const ALIAS: Record<string, string> = {
  '11中(城南)': '长沙市十一中（城南路）',
  '11中(融城)': '长沙市十一中（融城）',
  '15中': '长沙市十五中',
  '21中': '长沙市二十一中',
  '6中': '长沙市六中',
  六中: '长沙市六中',
  一中: '长沙市一中',
  '一中(科学城)': '长沙一中（科学城）',
  南雅: '南雅中学',
  周南: '周南中学',
  地质: '湖南省地质中学',
  实验: '长沙市实验中学',
  明德: '明德中学',
  望城一中: '望城区一中',
  长外: '长沙外国语学校',
  长斑: '长郡斑马湖中学',
  长郡: '长郡中学',
  '长郡(奥体城)': '长郡中学（奥体城）',
  长铁一中: '长沙铁路第一中学',
  附中: '湖南师大附中',
  '附中(大泽湖)': '师大附中（大泽湖）',
  雅礼: '雅礼中学',
  '雅礼(光达)': '雅礼中学（光达）',
  雅礼书院: '雅礼书院中学',
  雷锋: '雷锋学校',
  麓山: '麓山国际实验学校',
};

/** 全角括号 / 空格 / 中文括号差异导致的「看着一样却匹配不上」 */
export function normalizeSchoolName(name: string): string {
  return (name || '')
    .replace(/（/g, '(')
    .replace(/）/g, ')')
    .replace(/\s+/g, '')
    .trim();
}

/**
 * 把任意写法的校名匹配到录取线表里的规范校名。
 * 顺序：全称精确 → 简称表 → 归一化精确 → 唯一包含（仅当只有 1 个候选）。
 * @returns 匹配到的规范校名；无法唯一确定时返回 ''（调用方据此不画目标线，不做猜测）
 */
export function matchAdmissionSchool(label: string, schools: string[]): string {
  const list = Array.isArray(schools) ? schools : [];
  const raw = (label || '').trim();
  if (!raw || list.length === 0) return '';

  if (list.indexOf(raw) >= 0) return raw;

  const key = normalizeSchoolName(raw);
  const alias = ALIAS[key];
  if (alias && list.indexOf(alias) >= 0) return alias;

  const exact = list.filter((s) => normalizeSchoolName(s) === key);
  if (exact.length === 1) return exact[0];

  const partial = list.filter((s) => {
    const n = normalizeSchoolName(s);
    return n.indexOf(key) >= 0 || key.indexOf(n) >= 0;
  });
  // 只在唯一候选时采用，避免「一中」误配到多所学校
  return partial.length === 1 ? partial[0] : '';
}
