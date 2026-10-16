/** The new-report form for a group and meeting date. */
export function fileReportHref(groupId: number, date: string) {
  return `/groups/reports/new?groupId=${groupId}&date=${date}`;
}
