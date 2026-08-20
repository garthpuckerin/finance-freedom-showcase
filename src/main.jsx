import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './app.jsx';
import { MobileApp, MobileStandalone } from './Mobile.jsx';
import { Landing } from './Landing.jsx';
import { applyStoredAppearance } from './theme.js';

// Apply persisted appearance (theme + accent) before render to avoid a flash.
applyStoredAppearance();

// View switch, read once at boot (entering the demo never touches the URL):
//   ?view=mobile  → the iOS-framed mobile SHOWCASE (a desktop page)
//   ?view=desktop → the desktop app, even on a phone (escape hatch)
//   default       → desktop app; EXCEPT on actual small screens, where the
//                   desktop shell (no responsive styles) would clip — those
//                   get the standalone mobile app, full-bleed and unframed.
const viewParam = new URLSearchParams(window.location.search).get('view');
const isMobile = viewParam === 'mobile';
const isSmallScreen = viewParam !== 'desktop' && !isMobile &&
  window.matchMedia('(max-width: 767px)').matches;

// Marketing-landing gate — a single flag shared by BOTH the desktop and mobile
// entry points. On first visit (either route) we show the Landing pitch; once
// the visitor clicks "Launch demo" we persist the flag so reloads land back in
// the app. Sign-out (in the app) clears the flag and returns here.
//
// SESSION-scoped (sessionStorage), not indefinite: a fresh visit always gets the
// pitch, while in-session reloads/navigation stay in the app. This is a public
// marketing demo — every new visitor (and every new tab) should see the landing,
// not silently skip it because they entered once weeks ago.
const ENTERED_KEY = 'ff:entered:v1';

const readEntered = () => {
  try { return sessionStorage.getItem(ENTERED_KEY) === 'true'; }
  catch { return false; }
};

// Opt the page out of the desktop app's clipped flex shell so the tall mobile
// showcase (and the scrollable landing) can scroll. Applied for the mobile
// route OR while the landing is showing (the hero is taller than the viewport
// on small screens). Removed once the desktop app is entered.
function syncViewAttr(showingLanding) {
  const r = document.documentElement;
  if (isMobile || isSmallScreen || showingLanding) r.setAttribute('data-view', 'mobile');
  else r.removeAttribute('data-view');
}

function Root() {
  const [entered, setEntered] = React.useState(readEntered);

  React.useEffect(() => { syncViewAttr(!entered); }, [entered]);

  // Enter the demo — persist so reloads stay in. Sign-out lives in the apps.
  const enterDemo = React.useCallback(() => {
    try { sessionStorage.setItem(ENTERED_KEY, 'true'); } catch (e) {}
    setEntered(true);
  }, []);

  // Sign out — clear the gate and return to the landing. Exposed globally so
  // the desktop sidebar and the mobile chrome can both trigger it without
  // threading a prop through every screen.
  React.useEffect(() => {
    window.__ffSignOut = () => {
      try { sessionStorage.removeItem(ENTERED_KEY); localStorage.removeItem('ff_onboarded_v1'); } catch (e) {}
      setEntered(false);
    };
    return () => { delete window.__ffSignOut; };
  }, []);

  if (!entered) return <Landing onEnter={enterDemo} />;
  if (isMobile) return <MobileApp />;
  if (isSmallScreen) return <MobileStandalone />;
  return <App />;
}

// Sync the view attribute for the very first paint (before React mounts) so the
// landing/mobile page can scroll without a flash of the clipped desktop shell.
syncViewAttr(!readEntered());

createRoot(document.getElementById('root')).render(<Root />);
