// Each page has its own icon and tone; the tones sit beside the logo's forest, leaf and cream.
const items = [
  { href: 'index.html', label: 'Overview', tone: '#145232', icon: <><rect x="4" y="4" width="7" height="7" rx="1.6" /><rect x="13" y="4" width="7" height="4.5" rx="1.6" /><rect x="13" y="10.5" width="7" height="9.5" rx="1.6" /><rect x="4" y="13" width="7" height="7" rx="1.6" /></> },
  { href: 'frozen-pastries.html', label: 'Frozen Pastries Stock', tone: '#2a8a7f', icon: <path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5M4.6 10.6l3.4-.9-.9-3.4M19.4 13.4l-3.4.9.9 3.4" /> },
  { href: 'creams.html', label: 'Creams', tone: '#c38a2a', icon: <><path d="M6.5 13.5h11l-1.6 6.5H8.1z" /><path d="M7.4 13.5c-.9-2.5 1-4.1 3-3.7.3-2.4 2.8-3.4 4.5-2 2 .4 2.7 2.7 1.5 4.3.8.4 1 .9.8 1.4" /><circle cx="12.5" cy="4.6" r="1.3" /></> },
  { href: 'setting-proover.html', label: 'Setting Proover', tone: '#4e9a3a', icon: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M5 9.5h14M5 15.5h14" /><circle cx="9" cy="7" r=".9" /><circle cx="12" cy="7" r=".9" /><circle cx="15" cy="7" r=".9" /><circle cx="9" cy="13" r=".9" /><circle cx="12" cy="13" r=".9" /><circle cx="15" cy="13" r=".9" /></> },
  { href: 'wastage.html', label: 'Wastage', tone: '#b5512f', icon: <path d="M4.5 7h15M9.5 7V4.8h5V7M6.8 7l1 13h8.4l1-13M10.5 11v5.5M13.5 11v5.5" /> },
  { href: 'orders.html', label: 'Orders & Sales', tone: '#a8506c', icon: <path d="M4 20h16M7 20v-6M11 20V9M15 20v-4M19 20V5" strokeWidth="2.4" /> },
];

export default function Sidebar({ active }) {
  return (
    <aside className="sidebar">
      <a className="brand" href="index.html"><img className="brand-logo" src="Assets/brand/logo.png" alt="Warren Street System, established 2026" width="1080" height="810" /></a>
      <p className="nav-label">WORKSPACE</p>
      <nav aria-label="Main navigation">
        {items.map(item => (
          <a key={item.href} className={active === item.href ? 'nav-item active' : 'nav-item'} aria-current={active === item.href ? 'page' : undefined} href={item.href} style={{ '--tone': item.tone }}>
            <span className="nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{item.icon}</svg>
            </span>
            {item.label}
          </a>
        ))}
      </nav>
      <div className="sidebar-note"><span>THE DAILY RITUAL</span><p>A little care.<br />A better day.</p><small>Prepared with purpose, every morning.</small></div>
      <div className="location-card"><img className="location-icon" src="Assets/brand/favicon.svg" alt="" width="42" height="42" /><div><strong>Warren Street</strong><span>Qima Cafe</span></div></div>
    </aside>
  );
}
