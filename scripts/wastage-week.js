(function(root) {
  function offset(date, days) {
    const value = new Date(date + 'T12:00:00Z');
    value.setUTCDate(value.getUTCDate() + days);
    return value.toISOString().slice(0, 10);
  }
  function summarize(date, reports) {
    const day = new Date(date + 'T12:00:00Z').getUTCDay();
    const start = offset(date, -((day + 6) % 7));
    const days = Array.from({length: 7}, (_, i) => {
      const date = offset(start, i), report = reports[date];
      const known = report ? report.counts.filter(n => n !== null) : [];
      return {date, total: known.length ? known.reduce((a,b) => a+b,0) : null,
        state: !report ? 'Not recorded' : report.counts.every(n => n !== null) ? 'Complete' : 'Draft'};
    });
    const totals = days.filter(day => day.total !== null);
    return {start, end: offset(start,6), days,
      complete: days.filter(day => day.state === 'Complete').length,
      total: totals.length ? totals.reduce((sum,day) => sum+day.total,0) : null};
  }
  root.WastageWeek = {offset, summarize};
  if(typeof module !== 'undefined') module.exports = root.WastageWeek;
})(typeof window === 'undefined' ? globalThis : window);
