const statusText = document.getElementById('status-text');
if (statusText) {
  const minimumIntro = new Promise(resolve => setTimeout(resolve, 1200));
  const pageLoaded = document.readyState === 'complete'
    ? Promise.resolve()
    : new Promise(resolve => window.addEventListener('load', resolve, { once: true }));
  Promise.all([minimumIntro, pageLoaded]).then(() => {
    document.body.classList.add('ready');
    statusText.textContent = 'Your workspace is ready.';
  });
}

const searchInput = document.getElementById('pastry-search');
if (searchInput) {
  const rows = [...document.querySelectorAll('.inventory-panel tbody tr')];
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim().toLocaleLowerCase();
    let visible = 0;
    rows.forEach(row => {
      const matches = row.querySelector('th').textContent.toLocaleLowerCase().includes(query);
      row.hidden = !matches;
      if (matches) visible++;
    });
    document.getElementById('results-count').textContent = `${visible} ${visible === 1 ? 'product' : 'products'}${query ? ' found' : ''}`;
    document.getElementById('empty-state').hidden = visible !== 0;
  });
}
