import { useEffect, useState } from 'react';

const duration = 4000;
// Each layer shows one part of the same logo image, so together they rebuild it exactly.
const layers = ['mixer', 'leaves-left', 'leaves-right', 'banner', 'estd'];

export default function Intro({ onDone }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const leave = () => setLeaving(true);
    const timer = setTimeout(leave, duration);
    window.addEventListener('keydown', leave);
    return () => { clearTimeout(timer); window.removeEventListener('keydown', leave); };
  }, []);

  return (
    <div className={leaving ? 'intro leaving' : 'intro'} role="presentation" onClick={() => setLeaving(true)}
      onAnimationEnd={event => { if (event.animationName === 'intro-out') onDone(); }}>
      <div className="intro-logo" role="img" aria-label="Warren Street System, established 2026">
        {layers.map(layer => (
          <div key={layer} className={`intro-layer ${layer}`} aria-hidden="true"><img src="Assets/brand/logo.png" alt="" /></div>
        ))}
        <span className="intro-shine" aria-hidden="true" />
      </div>
      <p className="intro-sub">Qima Cafe · Warren Street</p>
      <span className="intro-skip">Click or press any key to skip</span>
    </div>
  );
}
