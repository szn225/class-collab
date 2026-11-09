export function setTabBarValue(page: unknown, value: number): void {
 (page as {setData(data: Record<string, unknown>): void}).setData({gradeTab: value});
}
