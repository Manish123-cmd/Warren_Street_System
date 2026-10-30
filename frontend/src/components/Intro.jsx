import { useEffect, useState } from 'react';
import { LaserCollection } from '@designcodeio/threeui/components/LaserCollection';
import '@designcodeio/threeui/style.css';

const title = 'Warren Street System';
const duration = 3800;

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
      <div className="shader-frame">
        <LaserCollection variant="vanishing-array" speed={1.00} size={1.00} length={1.00} density={1.00} opacity={1.00} hue={0} saturation={1.00} brightness={1.26} />
      </div>
      <h1 className="intro-title" aria-label={title}>
        {[...title].map((letter, index) => (
          <span key={index} aria-hidden="true" style={{ '--i': index }}>{letter === ' ' ? ' ' : letter}</span>
        ))}
      </h1>
      <p className="intro-sub">Qima Cafe · Warren Street</p>
      <span className="intro-skip">Click or press any key to skip</span>
    </div>
  );
}
