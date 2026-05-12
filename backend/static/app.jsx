// Route 66 — AI Assistant

const { useState, useRef, useEffect, Component } = React;

/* ---------- Error Boundary ---------- */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('App crashed:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif', background: '#f7f7f5', color: '#1a1b1e',
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Something went wrong</div>
          <div style={{ fontSize: 13, color: '#6b6d72', marginBottom: 20 }}>The app encountered an error. Try refreshing.</div>
          <button onClick={() => window.location.reload()} style={{
            padding: '10px 24px', borderRadius: 12, border: 'none',
            background: '#FA7315', color: '#1a1b1e', fontWeight: 600, cursor: 'pointer', fontSize: 14,
          }}>Refresh</button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ---------- Tokens ---------- */
const T = {
  // dark sidebar
  sideBg: '#1a1b1e',
  sideBg2: '#222428',
  sideText: '#e7e8ea',
  sideDim: '#8b8d93',
  sideHover: '#2a2c30',
  sideActive: '#34373c',
  sideBorder: 'rgba(255,255,255,0.06)',

  // light main
  bg: '#ffffff',
  bgSoft: '#f7f7f5',
  ink: '#1a1b1e',
  inkDim: '#6b6d72',
  inkFaint: '#a0a2a8',
  border: '#ececea',
  card: '#ffffff',

  // accents
  mint: '#FA7315',          // Route 66 orange
  mintDeep: '#D45F00',
  lilac: '#fff3eb',         // user message bubble
  lilacDeep: '#FFD5B0',
  peach: '#ffe7d9',         // folder accent
  rose: '#f4cdd9',
  ocean: '#cce4f7',

  // typography accent in headline
  accentText: '#FA7315',
};

/* ---------- Logo ---------- */
function BrandMark({ size = 22 }) {
  return <img src="logo.jpg" style={{ width: size, height: size, objectFit: 'contain', display: 'block' }} alt="Route 66" />;
}

/* ---------- Responsive width hook ---------- */
function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handle = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);
  return width;
}

/* ---------- Inline icons ---------- */
const Icon = ({ d, size = 16, stroke = 'currentColor', fill = 'none', sw = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);
const IconPlus = (p) => <Icon {...p} d="M12 5v14M5 12h14" />;
const IconSearch = (p) => <Icon {...p} d={['M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z', 'm21 21-4.3-4.3']} />;
const IconHome = (p) => <Icon {...p} d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-8.5Z" />;
const IconChats = (p) => <Icon {...p} d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z" />;
const IconFolder = (p) => <Icon {...p} d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />;
const IconChev = (p) => <Icon {...p} d="m6 9 6 6 6-6" />;
const IconChevRight = (p) => <Icon {...p} d="m9 6 6 6-6 6" />;
const IconDots = (p) => <Icon {...p} d={['M5 12h.01', 'M12 12h.01', 'M19 12h.01']} sw={2.4} />;
const IconBell = (p) => <Icon {...p} d={['M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8', 'M10 21a2 2 0 0 0 4 0']} />;
const IconGear = (p) => <Icon {...p} d={['M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z', 'M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z']} />;
const IconArrowUR = (p) => <Icon {...p} d={['M7 17 17 7', 'M8 7h9v9']} />;
const IconMic = (p) => <Icon {...p} d={['M12 2a3 3 0 0 0-3 3v6a3 3 0 1 0 6 0V5a3 3 0 0 0-3-3Z', 'M19 10v1a7 7 0 1 1-14 0v-1', 'M12 18v3']} />;
const IconArrowR = (p) => <Icon {...p} d={['M5 12h14', 'm12 5 7 7-7 7']} />;
const IconReload = (p) => <Icon {...p} d={['M3 12a9 9 0 0 1 15.5-6.3L21 8', 'M21 3v5h-5', 'M21 12a9 9 0 0 1-15.5 6.3L3 16', 'M3 21v-5h5']} />;
const IconCopy = (p) => <Icon {...p} d={['M9 9h10v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V11a2 2 0 0 1 2-2Z', 'M5 15V5a2 2 0 0 1 2-2h10']} />;
const IconUp = (p) => <Icon {...p} d={['M7 14l5-5 5 5']} />;
const IconDown = (p) => <Icon {...p} d={['M7 10l5 5 5-5']} />;
const IconPlay = (p) => <Icon {...p} d="M8 5v14l11-7L8 5Z" fill="currentColor" sw={0} />;
const IconPaperclip = (p) => <Icon {...p} d="M21 12.5 12.5 21a5.5 5.5 0 0 1-7.8-7.8L13 5a3.7 3.7 0 0 1 5.2 5.2L10 18.4a1.8 1.8 0 0 1-2.6-2.6L15 8.2" />;
const IconPrompt = (p) => <Icon {...p} d={['M4 7h16', 'M4 12h16', 'M4 17h10']} />;
const IconMenu = (p) => <Icon {...p} d={['M4 6h16', 'M4 12h16', 'M4 18h16']} />;
const IconX = (p) => <Icon {...p} d={['M18 6 6 18', 'M6 6l12 12']} />;

/* ---------- Sidebar ---------- */
function Sidebar({ view, setView, conversations, activeConv, setActiveConv, onDelete, isOpen, onClose, isMobile }) {
  const [foldersOpen, setFoldersOpen] = useState(true);
  const [chatsOpen, setChatsOpen] = useState(true);
  const windowWidth = useWindowWidth();

  const sectionHeader = (label, open, setOpen, withAdd = true) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '6px 10px 4px', color: T.sideDim, fontSize: 12,
      letterSpacing: 0.2,
    }}>
      <button onClick={() => setOpen(!open)} style={{
        display: 'flex', alignItems: 'center', gap: 6, background: 'transparent',
        border: 0, color: T.sideDim, fontSize: 12, cursor: 'pointer', padding: 0,
        minHeight: 32,
      }}>
        <span style={{ transition: 'transform .15s', transform: open ? 'none' : 'rotate(-90deg)', display: 'inline-flex' }}>
          <IconChev size={12} sw={2} />
        </span>
        {label}
      </button>
      <span style={{ flex: 1 }} />
      {withAdd && (
        <button style={iconBtnDark}><IconPlus size={13} /></button>
      )}
    </div>
  );

  const sidebarStyle = isMobile ? {
    width: Math.min(260, Math.round(windowWidth * 0.78)), flexShrink: 0, height: '100%',
    background: T.sideBg, color: T.sideText,
    display: 'flex', flexDirection: 'column',
    borderRight: `1px solid ${T.sideBorder}`,
    position: 'fixed', top: 0, left: 0, zIndex: 300,
    transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
    transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    boxShadow: isOpen ? '4px 0 32px rgba(0,0,0,0.25)' : 'none',
  } : {
    width: 232, flexShrink: 0, height: '100%',
    background: T.sideBg, color: T.sideText,
    display: 'flex', flexDirection: 'column',
    borderRight: `1px solid ${T.sideBorder}`,
  };

  return (
    <aside style={sidebarStyle}>
      {/* Brand row */}
      <div style={{
        display: 'flex', alignItems: 'center', height: 56,
        padding: '0 14px',
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: 'rgba(255,255,255,0.92)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <BrandMark size={22} />
        </div>
        {isMobile && (
          <button onClick={onClose} style={{
            marginLeft: 'auto', background: 'transparent', border: 0,
            color: T.sideDim, cursor: 'pointer',
            width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 8,
          }}>
            <IconX size={18} />
          </button>
        )}
      </div>

      {/* New Chat */}
      <div style={{ padding: '4px 12px 8px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button onClick={() => {
          if (conversations.today.length >= 5) {
            alert('You\'ve reached the 5 conversation limit. Please delete an existing conversation to start a new one.');
            return;
          }
          setActiveConv(null);
          if (isMobile) onClose();
        }} style={{
          ...pillDark, justifyContent: 'flex-start', gap: 8, height: 38,
        }}>
          <IconPlus size={14} /> <span>New Chat</span>
        </button>
      </div>

      {/* scrollable lists */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 12 }}>
        {/* Chats */}
        <div style={{ padding: '6px 12px 0' }}>
          {sectionHeader('Chats', chatsOpen, setChatsOpen, false)}
          {chatsOpen && (
            <div style={{ marginTop: 2 }}>
              <div style={{ color: T.sideDim, fontSize: 12, padding: '6px 10px 2px' }}>Today</div>
              {conversations.today.map(c => (
                <ChatRow key={c.id} c={c} active={activeConv === c.id}
                  onClick={() => { setActiveConv(c.id); setView('chat'); if (isMobile) onClose(); }}
                  onDelete={onDelete} />
              ))}
              <div style={{ color: T.sideDim, fontSize: 12, padding: '8px 10px 2px' }}>Yesterday</div>
              {conversations.yesterday.map(c => (
                <ChatRow key={c.id} c={c} active={activeConv === c.id}
                  onClick={() => { setActiveConv(c.id); setView('chat'); if (isMobile) onClose(); }}
                  onDelete={onDelete} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* User footer — code + logout */}
      <div style={{
        borderTop: `1px solid ${T.sideBorder}`, padding: '10px 14px',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11.5, color: T.sideText, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {getAuthEmail() || 'Traveler'}
          </div>
        </div>
        <button onClick={doLogout} title="Sign out" style={{
          background: 'transparent', border: 0, color: T.sideDim, cursor: 'pointer',
          minWidth: 44, minHeight: 44, padding: 10, borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>
      </div>
    </aside>
  );
}

function ChatRow({ c, active, onClick, onDelete }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 8, width: '100%',
      height: 32, padding: '0 10px',
      background: active ? T.sideActive : 'transparent',
      border: 0, borderRadius: 8, color: T.sideText, cursor: 'pointer',
      fontSize: 12.5, textAlign: 'left',
    }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = T.sideHover; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      <IconChats size={13} stroke={T.sideDim} />
      <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {c.titleHead}<span style={{ color: T.sideDim }}> {c.titleTail}</span>
      </span>
      <button className="row-dots liquid-hover" onClick={(e) => { e.stopPropagation(); onDelete(c.id); }} style={{
        color: '#dc4a3a', background: 'transparent', border: 0, cursor: 'pointer', opacity: active ? 1 : 0
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
      </button>
    </button>
  );
}

const iconBtnDark = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 24, height: 24, borderRadius: 6,
  background: 'transparent', border: 0, color: '#a4a6ac',
  cursor: 'pointer',
};
const pillDark = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: '100%', borderRadius: 10, background: T.sideBg2,
  border: `1px solid ${T.sideBorder}`, color: T.sideText,
  fontSize: 13, cursor: 'pointer',
};

/* ---------- Top bar (right side) ---------- */
function TopBar({ title = 'Route', titleAccent = ' 66', onMenuOpen, isMobile }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', height: 64,
      padding: isMobile ? '0 14px' : '0 28px',
    }}>
      {isMobile && (
        <button onClick={onMenuOpen} style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 44, height: 44, borderRadius: 10, border: `1px solid ${T.border}`,
          background: T.bgSoft, color: T.ink, cursor: 'pointer', marginRight: 10,
          flexShrink: 0,
        }}>
          <IconMenu size={18} />
        </button>
      )}
      <div style={{
        fontFamily: 'Fraunces, Georgia, serif',
        fontSize: isMobile ? 20 : 26, fontWeight: 500, letterSpacing: -0.5,
        color: T.accentText,
      }}>
        {title}<span style={{ color: T.ink }}>{titleAccent}</span>
      </div>
    </div>
  );
}

/* ---------- Composer ---------- */
function Composer({ value, onChange, onSend, isMobile, model, setModel, models }) {
  const [phText, setPhText] = useState('');
  const [phIdx, setPhIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (value) return; // Don't animate if user is typing
    const msgs = ['Suggest a 3-day itinerary...', 'Where is the best diner?', 'Show me a map of Route 66...'];
    const target = msgs[phIdx];
    const delay = isDeleting ? 40 : 80;

    if (!isDeleting && phText === target) {
      const t = setTimeout(() => setIsDeleting(true), 2500);
      return () => clearTimeout(t);
    } else if (isDeleting && phText === '') {
      setIsDeleting(false);
      setPhIdx((i) => (i + 1) % msgs.length);
      return;
    }

    const timer = setTimeout(() => {
      setPhText(target.substring(0, phText.length + (isDeleting ? -1 : 1)));
    }, delay);
    return () => clearTimeout(timer);
  }, [phText, isDeleting, phIdx, value]);

  return (
    /* safe-bottom class adds env(safe-area-inset-bottom) padding for iPhone home bar */
    <div className="safe-bottom" style={{ padding: isMobile ? '10px 12px 0' : '14px 28px 22px', paddingBottom: isMobile ? 'max(8px, env(safe-area-inset-bottom))' : 22, flexShrink: 0 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: T.bgSoft, borderRadius: 30, padding: '8px 8px 8px 8px',
        border: `1px solid ${T.border}`, position: 'relative',
      }}>
        {/* Placeholder overlap */}
        {!value && (
          <div style={{
            position: 'absolute', left: 21, top: '50%', transform: 'translateY(-50%)',
            pointerEvents: 'none', color: T.inkFaint, fontSize: 14, whiteSpace: 'nowrap',
            overflow: 'hidden', maxWidth: 'calc(100% - 60px)',
          }}>
            {phText}<span style={{ opacity: isDeleting ? 0.2 : 0.8 }}>|</span>
          </div>
        )}
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onSend(); }}
          style={{
            flex: 1, border: 0, outline: 'none', background: 'transparent',
            /* 16px prevents iOS Safari from auto-zooming the page when the input is tapped */
            fontSize: isMobile ? 16 : 14, color: T.ink, padding: '0 12px',
            fontFamily: 'inherit',
          }}
        />
        {models && model && (
          <select value={model} onChange={e => setModel(e.target.value)} style={{
            background: 'transparent', border: `1px solid ${T.border}`,
            borderRadius: 20, padding: isMobile ? '8px 10px' : '4px 8px',
            fontSize: isMobile ? 12 : 11, minHeight: isMobile ? 40 : 'auto',
            color: T.inkDim, cursor: 'pointer', outline: 'none',
            flexShrink: 0, maxWidth: isMobile ? 84 : 120,
          }}>
            {models.map(m => (
              <option key={m.id} value={m.id}>{isMobile ? m.short : m.label}</option>
            ))}
          </select>
        )}
        <button className="liquid-hover" onClick={onSend} style={{
          width: 40, height: 40, borderRadius: '50%',
          background: T.mint, border: `1px solid ${T.mintDeep}`,
          color: T.ink, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <IconArrowR size={16} sw={2} />
        </button>
      </div>
    </div>
  );
}

/* ---------- Home view ---------- */
function HomeView({ onPick, draft, setDraft, onSend, onMenuOpen, isMobile, model, setModel, models }) {
  const windowWidth = useWindowWidth();
  const cards = [
    { title: 'Accommodations', body: 'Find the best verified hotels and motels along Route 66.' },
    { title: 'Dining & Food',  body: 'Discover the best historic diners and eateries.' },
    { title: 'Maps & Detours', body: 'Interactive maps and advice for exploring hidden gems.' },
    { title: 'Motorcycle\nGuide', body: 'The Riders Bible: specific guidance for riding Route 66.' },
  ];

  const gridCols = windowWidth <= 480 ? '1fr'
    : windowWidth <= 768 ? 'repeat(2, 1fr)'
    : 'repeat(4, minmax(0, 1fr))';

  return (
    <div className="slide-up" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <TopBar title="Route" titleAccent=" 66" onMenuOpen={onMenuOpen} isMobile={isMobile} />
      {/*
        On mobile: justifyContent flex-start + paddingTop so content starts at top of scroll area.
        justify-content:center in an overflow container hides content ABOVE centre — you can't scroll up to it.
        On desktop: centre is fine because content fits comfortably.
      */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: isMobile ? 'flex-start' : 'center',
        padding: isMobile ? '24px 16px 0' : '0 32px',
        overflowY: 'auto', overflowX: 'hidden',
      }}>
        <div style={{
          width: 60, height: 60, borderRadius: 14,
          background: 'rgba(255,255,255,0.92)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 18,
        }}>
          <BrandMark size={52} />
        </div>
        <h1 style={{
          margin: 0, fontFamily: 'Fraunces, Georgia, serif',
          fontWeight: 400, fontSize: isMobile ? 26 : 36, letterSpacing: -0.8, color: T.ink,
          textAlign: 'center',
        }}>
          How can we <span style={{ fontStyle: 'italic', color: T.accentText }}>assist</span> you today?
        </h1>
        <p style={{
          maxWidth: 520, textAlign: 'center', color: T.inkDim, fontSize: 13.5,
          lineHeight: 1.55, margin: '14px 0 30px',
        }}>
          Get expert guidance powered by AI specializing in Route 66 travel.
          Choose a topic below or start typing to plan your perfect road trip.
        </p>
        <div style={{
          display: 'grid', gridTemplateColumns: gridCols,
          gap: 14, width: '100%', maxWidth: 880,
        }}>
          {cards.map((c, i) => (
            <button key={i} className="liquid-hover" onClick={() => onPick(c.title.replace('\n', ' '))} style={{
              textAlign: 'left', background: T.card, border: `1px solid ${T.border}`,
              borderRadius: 14, padding: isMobile ? '14px 12px 16px' : '16px 16px 18px',
              cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 10, position: 'relative',
            }}
            >
              <div style={{
                position: 'absolute', top: 12, right: 12,
                width: 26, height: 26, borderRadius: '50%',
                background: T.bgSoft, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                color: T.ink,
              }}>
                <IconArrowUR size={12} sw={2} />
              </div>
              <div style={{
                fontFamily: 'Fraunces, Georgia, serif', fontSize: 17,
                fontWeight: 500, lineHeight: 1.15, color: T.ink, whiteSpace: 'normal',
                paddingRight: 28,
              }}>{c.title}</div>
              <div style={{ fontSize: 11.5, lineHeight: 1.5, color: T.inkDim }}>{c.body}</div>
            </button>
          ))}
        </div>
      </div>
      <Composer value={draft} onChange={setDraft} onSend={onSend} isMobile={isMobile} model={model} setModel={setModel} models={models} />
    </div>
  );
}

/* ---------- Chat view ---------- */
function SearchStatus({ phase, steps }) {
  const configs = {
    kb: {
      icon: '📚',
      label: 'Searching knowledge base',
      color: '#FA7315',
      bg: '#fff5ee',
      border: '#ffd5b0',
    },
    web: {
      icon: '🌐',
      label: 'Searching the web',
      color: '#0066cc',
      bg: '#e8f3ff',
      border: '#aaccf0',
    },
  };
  const cfg = configs[phase] || configs.kb;
  return (
    <div style={{ animation: 'slideUpSpring 0.4s cubic-bezier(0.16,1,0.3,1) forwards' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <Avatar side="ai" />
        <div style={{
          background: cfg.bg, border: `1px solid ${cfg.border}`,
          borderRadius: 14, padding: '12px 16px', minWidth: 'min(220px, calc(100vw - 80px))',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: steps.length ? 10 : 0 }}>
            <span style={{ fontSize: 16, animation: phase === 'web' ? 'spin 1.2s linear infinite' : 'none' }}>
              {cfg.icon}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
            <span style={{ display: 'flex', gap: 3, marginLeft: 4 }}>
              {[0,1,2].map(i => (
                <span key={i} style={{
                  width: 4, height: 4, borderRadius: '50%',
                  background: cfg.color,
                  animation: `pulse 1s infinite ${i * 0.2}s`,
                  display: 'inline-block'
                }} />
              ))}
            </span>
          </div>
          {steps.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {steps.map((s, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 11.5, color: cfg.color, opacity: i === steps.length - 1 ? 1 : 0.55,
                  animation: i === steps.length - 1 ? 'slideUpSpring 0.3s ease-out' : 'none',
                }}>
                  <span>{i === steps.length - 1 ? '›' : '✓'}</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChatView({ messages, draft, setDraft, onSend, isLoading, searchPhase, searchSteps, onMenuOpen, isMobile, model, setModel, models }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (!isNearBottom && !isLoading) return;
    if (isLoading) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    } else {
      const lastMsg = el.querySelector('.message-block:last-child');
      if (lastMsg) lastMsg.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [messages.length, isLoading]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <TopBar title="Route" titleAccent=" 66" onMenuOpen={onMenuOpen} isMobile={isMobile} />
      <div ref={scrollRef} style={{
        flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        overflowX: 'hidden', padding: isMobile ? '8px 12px 8px' : '8px 28px 8px',
        minHeight: 0,
      }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22, paddingBottom: 40 }}>
          {messages.map(m => <div key={m.id} className="message-block"><Message m={m} isMobile={isMobile} /></div>)}
          {isLoading && searchPhase && (
            <SearchStatus phase={searchPhase} steps={searchSteps || []} />
          )}
        </div>
      </div>
      <Composer value={draft} onChange={setDraft} onSend={onSend} isMobile={isMobile} model={model} setModel={setModel} models={models} />
    </div>
  );
}

function Avatar({ side }) {
  return (
    <div style={{
      width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
      background: side === 'user'
        ? 'linear-gradient(135deg,#3a3c44,#1d1e22)'
        : 'linear-gradient(135deg,#1d1e22,#3a3c44)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: side === 'user' ? '#FA7315' : '#FA7315',
      fontSize: 11, fontWeight: 600,
    }}>
      {side === 'user' ? 'JD' : <BrandMark size={14} />}
    </div>
  );
}

function Message({ m, isMobile }) {
  const isUser = m.from === 'user';
  return (
    <div className="slide-up" style={{
      display: 'flex', gap: 10, alignItems: 'flex-start',
      flexDirection: isUser ? 'row-reverse' : 'row',
    }}>
      <Avatar side={isUser ? 'user' : 'ai'} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', gap: 6, maxWidth: isMobile ? '90%' : '78%' }}>
        <div style={{
          background: isUser ? T.lilac : T.bgSoft,
          color: T.ink, borderRadius: 14, padding: '10px 14px',
          border: isUser ? `1px solid ${T.lilacDeep}` : `1px solid ${T.border}`,
          fontSize: 13.5, lineHeight: 1.55,
        }}>
          {isUser ? (
            <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.text}</div>
          ) : (
            <div
              className="md-content"
              style={{ wordBreak: 'break-word' }}
              dangerouslySetInnerHTML={{ __html: window.safeMarkdown(m.text || '') }}
            />
          )}
        </div>
        {/* footer (time + tools) */}
        {!isUser && m.time && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: T.inkFaint, fontSize: 12 }}>
            {m.tools && (
              <div style={{ display: 'flex', gap: 10 }}>
                <button style={tinyBtn}><IconReload size={13} /></button>
                <button style={tinyBtn} onClick={() => navigator.clipboard?.writeText(m.text || '')}><IconCopy size={13} /></button>
                <button style={tinyBtn}><IconUp size={13} /></button>
                <button style={tinyBtn}><IconDown size={13} /></button>
              </div>
            )}
            {m.source && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 3,
                background: m.source === 'web' ? 'rgba(250,115,21,0.08)' : 'rgba(0,0,0,0.04)',
                border: `1px solid ${m.source === 'web' ? 'rgba(250,115,21,0.25)' : T.border}`,
                borderRadius: 99, padding: '1px 7px', fontSize: 10, color: m.source === 'web' ? T.mint : T.inkDim,
              }}>
                {m.source === 'web' ? '🌐 Web search' : '📚 Knowledge base'}
              </span>
            )}
            <span>{m.time}</span>
          </div>
        )}
        {/* citations */}
        {!isUser && m.citations && m.citations.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 2 }}>
            {m.citations.slice(0, 4).map((c, i) => {
              const isWebUrl = c.snippet && c.snippet.startsWith('http');
              const label = c.source ? c.source.replace('🌐 ', '').replace('europetrip_US_', '') : '';
              return isWebUrl ? (
                <a key={i} href={c.snippet} target="_blank" rel="noreferrer" style={{
                  fontSize: 12, color: T.mint, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3,
                  minHeight: 28, padding: '2px 0',
                }}>↗ {label}</a>
              ) : label ? (
                <span key={i} style={{ fontSize: 12, color: T.inkDim, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                  📄 {label}
                </span>
              ) : null;
            })}
          </div>
        )}
        {isUser && m.time && (
          <div style={{ color: T.inkFaint, fontSize: 12 }}>{m.time}</div>
        )}
      </div>
    </div>
  );
}

const tinyBtn = {
  background: 'transparent', border: 0, color: T.inkFaint,
  cursor: 'pointer', padding: 8, display: 'inline-flex',
  alignItems: 'center', justifyContent: 'center',
  minWidth: 36, minHeight: 36, borderRadius: 6,
};

function AudioBubble() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: T.lilac, border: `1px solid ${T.lilacDeep}`,
      borderRadius: 999, padding: '6px 14px 6px 6px', minWidth: 220,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: '#fff', display: 'flex',
        alignItems: 'center', justifyContent: 'center', color: T.ink,
      }}>
        <IconPlay size={12} />
      </div>
      {/* waveform */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, height: 22 }}>
        {Array.from({ length: 36 }).map((_, i) => {
          const h = 4 + Math.abs(Math.sin(i * 1.3)) * 16 + (i % 5) * 1.4;
          const past = i < 10;
          return <span key={i} style={{
            width: 2, height: h, background: past ? T.ink : 'rgba(26,27,30,.35)', borderRadius: 1,
          }} />;
        })}
      </div>
      <span style={{ fontSize: 11, color: T.inkDim, fontVariantNumeric: 'tabular-nums' }}>02:12</span>
    </div>
  );
}

function FileBubble({ title, link, name }) {
  return (
    <div style={{
      background: T.lilac, border: `1px solid ${T.lilacDeep}`,
      borderRadius: 14, padding: '10px 14px', minWidth: 260, maxWidth: 320,
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{title}</div>
          <div style={{ fontSize: 11, color: T.inkDim, wordBreak: 'break-all' }}>{link}</div>
        </div>
        <button style={tinyBtn}><IconArrowUR size={13} /></button>
      </div>
      <div style={{
        background: '#fff', borderRadius: 8, padding: '6px 10px',
        fontSize: 11.5, color: T.ink, display: 'inline-flex',
        alignSelf: 'flex-start', gap: 6, alignItems: 'center',
      }}>
        <span style={{
          width: 14, height: 14, borderRadius: 3, background: '#dc4a3a',
          display: 'inline-block',
        }} />
        {name}
      </div>
    </div>
  );
}
/* ---------- API Config ---------- */
const API_URL = 'https://matia-rag-production.up.railway.app';

/* ---------- Supabase client (singleton) ---------- */
let _sb = null;
function getSB() {
  if (!_sb && window.supabase && window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
    _sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  }
  return _sb;
}

/* ---------- Auth helpers ---------- */
let _session = null;
const getAuthToken  = () => _session?.access_token || '';
const getAuthEmail  = () => _session?.user?.email  || '';
const authHeaders   = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getAuthToken()}`,
});
const doLogout = async () => {
  const sb = getSB();
  if (sb) await sb.auth.signOut();
  _session = null;
  window.location.reload();
};

// Wraps fetch — auto signs out on 401/403 (removed/deactivated user)
const apiFetch = async (url, opts = {}) => {
  const res = await fetch(url, opts);
  if (res.status === 401 || res.status === 403) {
    await doLogout();
    return res;
  }
  return res;
};

/* ---------- Login view (email OTP) ---------- */
function LoginView({ onSession }) {
  const [phase,   setPhase]   = useState('email'); // 'email' | 'otp'
  const [email,   setEmail]   = useState('');
  const [otp,     setOtp]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const sendOtp = async () => {
    const addr = email.trim().toLowerCase();
    if (!addr || !addr.includes('@')) { setError('Enter a valid email address.'); return; }
    setLoading(true); setError('');
    const sb = getSB();
    if (!sb) { setError('Auth not initialised — please refresh.'); setLoading(false); return; }
    const { error: err } = await sb.auth.signInWithOtp({
      email: addr,
      options: { shouldCreateUser: false },
    });
    setLoading(false);
    if (err) {
      if (err.message && err.message.toLowerCase().includes('signups not allowed')) {
        setError('This email is not registered. Please contact support.');
      } else {
        setError(err.message || 'Failed to send code. Try again.');
      }
      return;
    }
    setPhase('otp');
  };

  const verifyOtp = async () => {
    const token = otp.trim();
    if (token.length < 4) { setError('Enter the 6-digit code from your email.'); return; }
    setLoading(true); setError('');
    const sb = getSB();
    const { data, error: err } = await sb.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token,
      type: 'email',
    });
    setLoading(false);
    if (err) { setError('Incorrect or expired code. Try again.'); return; }
    onSession(data.session);
  };

  const inputStyle = (hasErr) => ({
    width: '100%', height: 50, borderRadius: 12,
    border: hasErr ? '1.5px solid #dc4a3a' : `1.5px solid ${T.border}`,
    padding: '0 16px', fontSize: 16,
    color: T.ink, background: '#fff', outline: 'none', boxSizing: 'border-box',
  });
  const btnStyle = (disabled) => ({
    width: '100%', height: 48, borderRadius: 12,
    background: disabled ? '#e8e8e6' : T.mint,
    border: `1px solid ${disabled ? '#ddd' : T.mintDeep}`,
    color: disabled ? T.inkDim : T.ink,
    fontSize: 14, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
  });

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: T.bg, fontFamily: '-apple-system, "SF Pro Text", "Inter", system-ui, sans-serif',
      padding: '24px 16px', boxSizing: 'border-box',
    }}>
      <div style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 18, background: T.sideBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
        }}>
          <BrandMark size={54} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ margin: '0 0 8px', fontFamily: 'Fraunces, Georgia, serif', fontWeight: 400, fontSize: 34, letterSpacing: -0.8, color: T.ink }}>
            Route <span style={{ fontStyle: 'italic', color: T.accentText }}>66</span>
          </h1>
          <p style={{ margin: 0, color: T.inkDim, fontSize: 13.5, lineHeight: 1.55 }}>
            {phase === 'email' ? 'Enter your email to receive a login code' : `We sent a 6-digit code to ${email}`}
          </p>
        </div>
        <div style={{
          width: '100%', background: T.bgSoft, border: `1px solid ${T.border}`,
          borderRadius: 20, padding: 24, boxSizing: 'border-box',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          {phase === 'email' ? (
            <>
              <input
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendOtp()}
                placeholder="your@email.com"
                autoComplete="email" autoFocus
                style={inputStyle(!!error)}
              />
              {error && <div style={{ fontSize: 12, color: '#dc4a3a', textAlign: 'center', marginTop: -4 }}>{error}</div>}
              <button onClick={sendOtp} disabled={loading || !email.trim()} style={btnStyle(loading || !email.trim())}>
                {loading ? 'Sending…' : 'Send Login Code'}
              </button>
            </>
          ) : (
            <>
              <input
                type="text" value={otp} inputMode="numeric"
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={e => e.key === 'Enter' && verifyOtp()}
                placeholder="123456"
                autoFocus maxLength={6}
                style={{ ...inputStyle(!!error), textAlign: 'center', letterSpacing: 4, fontSize: 22, fontFamily: 'monospace' }}
              />
              {error && <div style={{ fontSize: 12, color: '#dc4a3a', textAlign: 'center', marginTop: -4 }}>{error}</div>}
              <button onClick={verifyOtp} disabled={loading || otp.length < 4} style={btnStyle(loading || otp.length < 4)}>
                {loading ? 'Verifying…' : 'Sign In'}
              </button>
              <button onClick={() => { setPhase('email'); setOtp(''); setError(''); }} style={{
                background: 'transparent', border: 0, color: T.inkDim, fontSize: 12, cursor: 'pointer', textAlign: 'center',
              }}>
                ← Use a different email
              </button>
            </>
          )}
        </div>
        <p style={{ margin: 0, fontSize: 11.5, color: T.inkFaint, textAlign: 'center', lineHeight: 1.5 }}>
          Access is by invitation only.
        </p>
      </div>
    </div>
  );
}

/* ---------- App shell ---------- */
function AppShell() {

  const [view, setView] = useState('home');
  const animStyle = `
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `;

  const windowWidth = useWindowWidth();
  const isMobile = windowWidth <= 640;

  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState({ today: [], yesterday: [] });
  const [searchPhase, setSearchPhase] = useState(null); // 'kb' | 'web' | null
  const [searchSteps, setSearchSteps] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const MODELS = [
    { id: 'gemini-3-flash-preview',           label: 'Gemini Flash 3',   short: 'Gemini' },
    { id: 'anthropic/claude-3-5-haiku',        label: 'Claude 3.5 Haiku', short: 'Claude' },
    { id: 'openai/gpt-4o-mini',                label: 'GPT-4o Mini',      short: 'GPT-4o' },
    { id: 'meta-llama/llama-3.1-8b-instruct',  label: 'Llama 3.1 8B',    short: 'Llama'  },
  ];
  const [model, setModel] = useState('gemini-3-flash-preview');

  // Tracks the current conversation ID for API calls without triggering effects
  const currentConvIdRef = useRef(null);

  const pushStep = (msg) => setSearchSteps(prev => [...prev, msg]);

  const loadConversations = async () => {
    try {
      const res = await apiFetch(`${API_URL}/api/conversations`, { headers: authHeaders() });
      const data = await res.json();
      const today = data.slice(0, 5).map(c => ({
         id: c.id,
         titleHead: c.title.slice(0, 20),
         titleTail: c.title.slice(20) || ''
      }));
      setConversations({ today, yesterday: [] });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // Load messages when user switches conversations via sidebar
  useEffect(() => {
    if (activeConv) {
      // Guard: if this conv is already loaded in-memory from a send() call, don't reload
      if (activeConv === currentConvIdRef.current) return;
      currentConvIdRef.current = activeConv;

      const loadMessages = async () => {
        setIsLoading(true);
        try {
          const res = await apiFetch(`${API_URL}/api/conversations/${activeConv}/messages`, { headers: authHeaders() });
          const data = await res.json();
          const mapped = data.map(m => {
            let cleanedText = m.content;
            const sysIdx = cleanedText.indexOf('[SYSTEM OVERRIDE INSTRUCTIONS]');
            if (sysIdx !== -1) {
              cleanedText = cleanedText.substring(0, sysIdx).trim();
            }
            return {
              id: m.id,
              from: m.role === 'model' ? 'ai' : 'user',
              kind: 'text',
              text: cleanedText,
              citations: m.citations,
              time: ''
            };
          });
          setMessages(mapped);
          setView('chat');
        } catch(e) {
          console.error(e);
        } finally {
          setIsLoading(false);
        }
      };
      loadMessages();
    } else {
      currentConvIdRef.current = null;
      setMessages([]);
      setView('home');
    }
  }, [activeConv]);

  const NOT_FOUND_PATTERNS = ['not found', "isn't covered", 'not covered', 'not in our', 'not available in'];
  const isNotFoundResponse = (text) => {
    if (!text || typeof text !== 'string') return false;
    return NOT_FOUND_PATTERNS.some(p => text.toLowerCase().includes(p));
  };

  const send = async (explicitText) => {
    const text = typeof explicitText === 'string' ? explicitText.trim() : draft.trim();
    if (!text || isLoading) return;
    setDraft('');
    setView('chat');
    setSearchSteps([]);

    const userMsg = { id: Date.now(), from: 'user', kind: 'text', text, time: nowTime() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setSearchPhase('kb');

    // Use ref to pass correct conversation_id even before setActiveConv fires
    const convIdToUse = activeConv || currentConvIdRef.current;

    try {
      // Phase 1: Knowledge Base Search
      pushStep('Reading Route 66 guides...');
      await new Promise(r => setTimeout(r, 400));
      pushStep('Matching your question to documents...');

      const res = await apiFetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ message: text, conversation_id: convIdToUse, model })
      });

      if (!res.ok) {
        if (res.status === 429) {
          const errJson = await res.json().catch(() => ({}));
          if (errJson.detail === 'CONV_LIMIT_REACHED') {
            setMessages(prev => prev.filter(m => m.id !== userMsg.id));
            setMessages(prev => [...prev, {
              id: Date.now() + 1, from: 'ai', kind: 'text',
              text: 'You\'ve reached the 5 conversation limit. Please delete an existing conversation from the sidebar to start a new one.',
              time: nowTime()
            }]);
            return;
          }
        }
        console.error(`KB Search failed: ${res.status}`);
        setMessages(prev => [...prev, {
          id: Date.now() + 1, from: 'ai', kind: 'text',
          text: 'Could not reach the knowledge base right now. Please try again.',
          time: nowTime()
        }]);
        return;
      }
      const data = await res.json();

      // Capture conversation ID from first response (fixes stale closure bug)
      if (!currentConvIdRef.current && data.conversation_id) {
        currentConvIdRef.current = data.conversation_id;
      }

      // Phase 2: Fallback to Web Search if KB has no answer OR model signals live data needed
      const needsLiveData = data.response && data.response.includes('[NEEDS_LIVE_DATA]');
      const kbResponseClean = needsLiveData ? data.response.replace('[NEEDS_LIVE_DATA]', '').trim() : data.response;
      if (isNotFoundResponse(kbResponseClean) || needsLiveData) {
        setSearchPhase('web');
        setSearchSteps([]);
        pushStep('Knowledge base has no match...');
        await new Promise(r => setTimeout(r, 300));
        pushStep('Querying Google Search...');
        await new Promise(r => setTimeout(r, 300));
        pushStep('Reading web sources...');

        const webConvId = data.conversation_id || currentConvIdRef.current || convIdToUse;

        try {
          const webRes = await apiFetch(`${API_URL}/api/web-search`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ message: text, conversation_id: webConvId, model: 'gemini-3-flash-preview' })
          });
          const webData = webRes.ok ? await webRes.json() : null;
          pushStep('Synthesising answer...');
          await new Promise(r => setTimeout(r, 200));

          const webResponseText = (webData && webData.response)
            ? webData.response
            : "Web search didn't find a result for this. The knowledge base also doesn't have an answer. Try searching Google directly.";

          setMessages(prev => [...prev, {
            id: Date.now() + 1, from: 'ai', kind: 'text',
            text: webResponseText,
            citations: (webData && webData.citations) || [],
            time: nowTime(), tools: true, source: 'web',
          }]);
        } catch (webErr) {
          console.error('Web search error:', webErr);
          const errText = "Web search is unavailable right now. The knowledge base also didn't have an answer for this. Please try Google directly.";
          setMessages(prev => [...prev, {
            id: Date.now() + 1, from: 'ai', kind: 'text',
            text: errText,
            time: nowTime(), tools: true,
          }]);
        }
      } else {
        pushStep('Found relevant information!');
        await new Promise(r => setTimeout(r, 200));
        setMessages(prev => [...prev, {
          id: Date.now() + 1, from: 'ai', kind: 'text',
          text: data.response || "No response found.",
          citations: data.citations || [],
          time: nowTime(), tools: true, source: 'kb',
        }]);
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, {
        id: Date.now() + 1, from: 'ai', kind: 'text',
        text: "I encountered an error while processing your request. Please try again later.",
        time: nowTime()
      }]);
    } finally {
      setIsLoading(false);
      setSearchPhase(null);
      setSearchSteps([]);

      // Update activeConv to reflect new conversation in sidebar.
      // The useEffect guard (activeConv === currentConvIdRef.current) prevents a reload.
      if (!activeConv && currentConvIdRef.current) {
        setActiveConv(currentConvIdRef.current);
        loadConversations();
      }
    }
  };

  const pickPrompt = (label) => {
    setDraft(`Help me with: ${label}`);
  };

  const handleMenuOpen = () => setSidebarOpen(true);
  const handleMenuClose = () => setSidebarOpen(false);

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', background: '#fff',
      fontFamily: '-apple-system, "SF Pro Text", "Inter", system-ui, sans-serif',
      color: T.ink, overflow: 'hidden',
      /* Ensure the flex root itself never exceeds the viewport on mobile */
      maxHeight: '100%',
    }}>
      <style>{animStyle}</style>

      {/* Mobile backdrop */}
      {isMobile && sidebarOpen && (
        <div onClick={handleMenuClose} style={{
          position: 'fixed', inset: 0, zIndex: 299,
          background: 'rgba(0,0,0,0.35)',
          backdropFilter: 'blur(2px)',
        }} />
      )}

      <Sidebar
        view={view} setView={setView}
        conversations={conversations}
        activeConv={activeConv} setActiveConv={setActiveConv}
        isOpen={sidebarOpen} onClose={handleMenuClose}
        isMobile={isMobile}
        onDelete={async (id) => {
          try {
            await apiFetch(`${API_URL}/api/conversations/${id}`, { method: 'DELETE', headers: authHeaders() });
            if (activeConv === id) {
              currentConvIdRef.current = null;
              setActiveConv(null);
              setMessages([]);
              setView('home');
            }
            loadConversations();
          } catch(e) { console.error(e); }
        }}
      />
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
        {view === 'home' && <HomeView onPick={pickPrompt} draft={draft} setDraft={setDraft} onSend={send} onMenuOpen={handleMenuOpen} isMobile={isMobile} model={model} setModel={setModel} models={MODELS} />}
        {view === 'chat' && <ChatView messages={messages} draft={draft} setDraft={setDraft} onSend={send} isLoading={isLoading} searchPhase={searchPhase} searchSteps={searchSteps} onMenuOpen={handleMenuOpen} isMobile={isMobile} model={model} setModel={setModel} models={MODELS} />}
      </main>
    </div>
  );
}

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/* ---------- Auth wrapper ---------- */
function App() {
  const [ready,   setReady]   = useState(false);
  const [session, setSession] = useState(null);

  useEffect(() => {
    const sb = getSB();
    if (!sb) { setReady(true); return; }
    sb.auth.getSession().then(({ data }) => {
      if (data.session) { _session = data.session; setSession(data.session); }
      setReady(true);
    });
    const { data: { subscription } } = sb.auth.onAuthStateChange((_evt, s) => {
      _session = s;
      setSession(s);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!ready) return null;

  if (!session) {
    return <LoginView onSession={s => { _session = s; setSession(s); }} />;
  }

  return <AppShell />;
}

Object.assign(window, { App });
