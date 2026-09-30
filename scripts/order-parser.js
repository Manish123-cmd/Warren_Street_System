/* Supplier order quantities are packs of 25, regardless of numbers in the product label. */
(function (root) {
  const normalize = text => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/&/g, ' and ').replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
  const aliases = {
    'Gianduja Bowtie': ['Gianduja Bow'],
    'Pecan Cookie': ['Carmelized Pecan Cookie', 'Caramelized Pecan Cookie', 'Caramelised Pecan Cookie'],
    'Pistachio Cookie': ['Pistachio White Chocolate Cookie'],
    'Yemeny Honey Brioche': ['Yemeni Honey Brioche']
  };
  function parseOrder(text, names) {
    const matches = new Map(), duplicates = new Set(), skipped = [];
    for (const source of text.split(/\r?\n/).filter(line => line.trim())) {
      const normalized = normalize(source);
      const candidates = names.map((name, i) => ({name, i, labels: [name, ...(aliases[name] || [])]}))
        .filter(item => item.labels.some(label => (' ' + normalized + ' ').includes(' ' + normalize(label) + ' ')));
      if (candidates.length !== 1) { skipped.push({source, reason: candidates.length ? 'More than one pastry matched' : 'No matching pastry in your stock list'}); continue; }
      const item = candidates[0];
      // Remove pack-size descriptions before looking for Qty. Prices are never quantities.
      const withoutPacks = source.replace(/\([^)]*\)/g, ' ');
      const firstPrice = withoutPacks.search(/[£$€]|\d+[.,]\d{2}\b/);
      const beforePrice = firstPrice < 0 ? withoutPacks : withoutPacks.slice(0, firstPrice);
      // Require one trailing Qty after the name. Codes before the product name are ignored.
      const qty = beforePrice.match(/(?:\s|\|)(\d+)\s*[|!]*\s*$/);
      const hasOtherNumber = qty && /\d/.test(beforePrice.slice(0, qty.index).replace(/^\s*[\d-]+\s+/, ''));
      const packs = qty ? Number(qty[1]) : NaN;
      if (!qty || hasOtherNumber || !Number.isSafeInteger(packs) || packs * 25 > 999999 || /-\s*\d+\s*[|!]*\s*$/.test(beforePrice)) {
        skipped.push({source, reason: 'Qty is missing or unclear — correct this line to Product name Qty'}); continue;
      }
      if (matches.has(item.i) || duplicates.has(item.i)) {
        if (matches.has(item.i)) skipped.push({source: matches.get(item.i).source, reason: 'Duplicate pastry — review manually'});
        matches.delete(item.i); duplicates.add(item.i); skipped.push({source, reason: 'Duplicate pastry — review manually'}); continue;
      }
      matches.set(item.i, {i:item.i, packs, value:packs * 25, source});
    }
    return {matches:[...matches.values()], skipped};
  }
  root.StockOrderParser = {parseOrder};
  if (typeof module !== 'undefined') module.exports = {parseOrder};
})(typeof window === 'undefined' ? globalThis : window);
