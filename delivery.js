(() => {
  const panel = document.getElementById('delivery-upload');
  const button = document.getElementById('open-delivery-scan');
  button.addEventListener('click', () => {
    panel.hidden = false;
    panel.open = true;
    button.setAttribute('aria-expanded', 'true');
    panel.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start'});
    document.getElementById('scan-file').focus({preventScroll:true});
  });
  panel.addEventListener('toggle', () => {
    button.setAttribute('aria-expanded', String(panel.open));
    if (!panel.open) {
      const focusInside = panel.contains(document.activeElement);
      panel.hidden = true;
      if (focusInside) button.focus({preventScroll:true});
    }
  });
  function refreshDelivery() {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-GB', {timeZone:'Europe/London',weekday:'short',hour:'2-digit',hourCycle:'h23'}).formatToParts(now);
    const day = parts.find(p => p.type === 'weekday').value;
    const hour = Number(parts.find(p => p.type === 'hour').value);
    const deliveryDay = ['Tue','Thu','Sat'].includes(day);
    const next = {Sun:'Tuesday',Mon:'Tuesday',Tue:'Thursday',Wed:'Thursday',Thu:'Saturday',Fri:'Saturday',Sat:'Tuesday'}[day];
    document.getElementById('delivery-timing').textContent = deliveryDay ? (hour < 12 ? 'DELIVERY EXPECTED THIS MORNING' : 'TODAY IS A DELIVERY DAY') : `NEXT USUAL DELIVERY: ${next.toUpperCase()} MORNING`;
    document.querySelector('.delivery-banner').classList.toggle('delivery-due', deliveryDay);
    document.querySelectorAll('[data-day]').forEach(chip => {
      chip.classList.toggle('today', chip.dataset.day === day);
      if(chip.dataset.day === day) chip.setAttribute('aria-label', chip.textContent.trim() + ' — today');
      else chip.removeAttribute('aria-label');
    });
  }
  refreshDelivery();
  setInterval(refreshDelivery, 60000);
  document.addEventListener('visibilitychange', () => { if(!document.hidden) refreshDelivery(); });
})();
