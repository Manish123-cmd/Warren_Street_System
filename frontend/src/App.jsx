import { useEffect } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Footer from './components/Footer.jsx';
import Overview from './pages/Overview.jsx';
import FrozenPastries from './pages/FrozenPastries.jsx';
import Creams from './pages/Creams.jsx';
import ProoferGuide from './pages/ProoferGuide.jsx';
import Wastage from './pages/Wastage.jsx';
import Orders from './pages/Orders.jsx';
import pages from './pages/config.json';

const components = { Overview, FrozenPastries, Creams, ProoferGuide, Wastage, Orders };
const filename = window.location.pathname.split('/').pop() || 'index.html';
const page = pages.find(page => page.file === filename) || pages[0];
const Screen = components[page.component];
let initialization;

// Existing controllers initialize only after React has mounted their elements.
// Full document navigation preserves their event lifetimes and unsaved-change guards.
function initializeControllers() {
  return initialization ||= (async () => {
    for (const source of page.scripts) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = source;
        script.onload = resolve;
        script.onerror = () => reject(new Error(`Could not load ${source}`));
        document.body.append(script);
      });
    }
    if (window.location.hash) {
      document.getElementById(decodeURIComponent(window.location.hash.slice(1)))?.scrollIntoView();
    }
  })();
}

export default function App() {
  useEffect(() => {
    document.body.className = page.bodyClass;
    document.title = page.title;
    initializeControllers().catch(error => {
      console.error(error);
      const message = document.createElement('p');
      message.setAttribute('role', 'alert');
      message.textContent = 'Some workspace features could not load. Refresh the page to try again.';
      document.querySelector('main')?.prepend(message);
    });
  }, []);

  const label = page.title.split(' | ')[0];
  return <>
    <Sidebar active={page.file} />
    <div className="app-shell">
      <header className="topbar">
        <span>Workspace <span className="slash">/</span> <strong>{label}</strong></span>
        <span className="location-pill"><span className="green-dot" /> Warren Street</span>
      </header>
      <Screen />
      <Footer />
    </div>
  </>;
}
