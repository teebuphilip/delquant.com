import { useEffect, useRef, useState } from 'react';

const tabs = ['Projections', 'Risk', 'Archetype', 'Comps'];
const signals = [
  ['Primary creator', '+2.3', 'Usage', 'up'],
  ['Two-way wing', '−1.1', 'Pace', 'down'],
  ['Scoring forward', '+1.8', 'Rebound%', 'up'],
  ['Rim protector', '+2.6', 'Blocks', 'up'],
];
const metrics = [['28.8','PTS','+0.7'],['12.1','REB','+0.4'],['9.4','AST','+0.9'],['1.3','STL','+0.1'],['0.8','BLK','0.0']];
const outcomes = [
  { category: 'NBA TEAMS', title: 'Evaluate. Plan. Win.', copy: 'Deeper player context for scouting, roster construction, and long-term strategy.', href: 'https://delquant.com/hawks-front-office-study/', visual: 'team' },
  { category: 'SPORTSBOOKS', title: 'Price with conviction.', copy: 'Sharper projections and risk models for stronger lines and trading decisions.', href: 'https://delquant.com/b2b/', visual: 'market' },
  { category: 'FANTASY & MEDIA', title: 'Create better experiences.', copy: 'Actionable data for content, tools, and a more informed audience.', href: 'https://delquant.com/player-intelligence/', visual: 'hoop' },
];
const steps = [
  ['01','DATA','Play-by-play, tracking, lineups, and context'],
  ['02','MODELS','Projections, calibration, and risk analysis'],
  ['03','CONTEXT','Role, matchups, team and league dynamics'],
  ['04','DECISIONS','Actionable products for your operation'],
];

const asset = name => `${import.meta.env.BASE_URL}assets/${name}`;
const tabId = (group, tab) => `${group}-tab-${tab.toLowerCase()}`;

function handleTabKeyDown(event, group, index, setActive, tabRefs) {
  const direction = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
  if (!direction) return;
  event.preventDefault();
  const nextIndex = (index + direction + tabs.length) % tabs.length;
  setActive(tabs[nextIndex]);
  tabRefs.current[tabId(group, tabs[nextIndex])]?.focus();
}

function Arrow() { return <span className="arrow" aria-hidden="true">→</span>; }

function DataPanel({ active }) {
  if (active === 'Projections') return <>
    <div className="panel-kicker">ILLUSTRATIVE PROJECTIONS <span>SAMPLE DATA</span></div>
    <div className="stats">{metrics.map(([value,label,change]) => <div className="stat" key={label}><strong>{value}</strong><span>{label}</span><small>{change === '0.0' ? '◆' : '▲'} {change}</small></div>)}</div>
    <div className="chart-legend"><span><i className="projected"/> Projected</span><span><i className="league"/> League avg (C)</span></div>
    <div className="chart" role="img" aria-label="Illustrative projected and league-average trends from October to April"><div className="chart-grid"/><div className="chart-bars">{[38,36,47,40,48,54,52].map((height,i) => <div className="bar-cell" key={i}><i style={{height: `${[22,21,24,20,23,25,23][i]}%`}}/><b style={{height: `${height}%`}}/><span>{['OCT','NOV','DEC','JAN','FEB','MAR','APR'][i]}</span></div>)}</div></div>
  </>;
  if (active === 'Risk') return <div className="detail"><div className="panel-kicker">RANGE, NOT JUST A SINGLE NUMBER</div><h4>Confidence you can use.</h4><p>Understand the shape of possible outcomes before the game begins.</p><div className="range"><span>FLOOR <strong>23.4</strong></span><div><i/></div><span>CEILING <strong>38.7</strong></span></div><div className="detail-grid"><div><small>AVAILABILITY</small><strong>84%</strong><span>expected game share</span></div><div><small>VOLATILITY</small><strong>Low</strong><span>within peer group</span></div></div></div>;
  if (active === 'Archetype') return <div className="detail"><div className="panel-kicker">PLAYER SHAPE</div><h4>Offensive hub.</h4><p>A high-usage creator whose playmaking and rebounding change the team's entire profile.</p><div className="archetype-list">{[['Playmaking','92%'],['Interior scoring','78%'],['Rebounding','85%']].map(([label,width])=><div key={label}><span>{label}</span><b style={{width}}/></div>)}</div><div className="panel-note">ROLE FIT <strong>Primary creator · half-court anchor</strong></div></div>;
  return <div className="detail"><div className="panel-kicker">HISTORICAL SHAPE</div><h4>See the player in context.</h4><p>Comparable profiles help turn a forecast into an understandable decision.</p><div className="comp-list">{[['01','Playmaking big','93%'],['02','High-post creator','87%'],['03','Interior hub','82%']].map(([number,label,match])=><div key={number}><span>{number}</span><strong>{label}</strong><em>{match} shape match</em></div>)}</div></div>;
}

export function App() {
  const [active, setActive] = useState('Projections');
  const [menuOpen, setMenuOpen] = useState(false);
  const [signalIndex, setSignalIndex] = useState(0);
  const tabRefs = useRef({});

  useEffect(() => {
    const timer = window.setInterval(() => setSignalIndex(i => (i+1) % signals.length), 3400);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
      return undefined;
    }
    const observer = new IntersectionObserver(entries => entries.forEach(entry => { if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);} }), {threshold: 0.08});
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return <div className="site-shell">
    <header className="site-header" id="top">
      <a className="brand" href="#top" aria-label="DelQuant home">DELQUANT<span>.</span></a>
      <nav className={menuOpen ? 'nav open' : 'nav'} aria-label="Main navigation">
        <a href="#intelligence" onClick={() => setMenuOpen(false)}>The platform</a><a href="#solutions" onClick={() => setMenuOpen(false)}>Solutions</a><a href="#method" onClick={() => setMenuOpen(false)}>Methodology</a><a href="https://delquant.com/developers/" onClick={() => setMenuOpen(false)}>Developers</a><a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>
      </nav>
      <a className="header-cta" href="mailto:teebu@delquant.com?subject=DelQuant%20demo%20request">Request a demo <Arrow/></a>
      <button className={menuOpen ? 'menu open' : 'menu'} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><span/><span/></button>
    </header>
    <main>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-art" aria-hidden="true"><img src={asset('hero-intelligence.png')} alt=""/></div>
        <div className="hero-copy reveal"><div className="eyebrow">NBA INTELLIGENCE FOR OPERATORS</div><h1 id="hero-title">THE GAME<br/>IS MORE THAN<br/><em>A NUMBER.</em></h1><p>DelQuant turns player data into projections, risk, archetypes, and historical comps—so teams, sportsbooks, fantasy platforms, and basketball media can make smarter decisions, faster.</p><div className="hero-actions"><a className="button primary" href="mailto:teebu@delquant.com?subject=DelQuant%20demo%20request">Request a demo <Arrow/></a><a className="button outline" href="#intelligence">See player intelligence <Arrow/></a></div><div className="audiences"><span>TEAMS<br/><b>EVALUATION</b></span><span>SPORTSBOOKS<br/><b>RISK</b></span><span>FANTASY PLATFORMS<br/><b>EXPERIENCE</b></span><span>MEDIA<br/><b>RESEARCH</b></span></div></div>
        <div className="hero-note" aria-hidden="true">PLAYERS<br/>DATA<br/>DECISIONS<br/><span>A HIGHER EDGE</span></div><div className="hero-metric" aria-hidden="true"><span>SAMPLE PROJECTION</span><strong>26.8</strong><small>▲ +2.4</small></div>
      </section>
      <section className="signals" aria-label="Illustrative basketball signals"><div className="signal-label"><i/> SAMPLE<br/>SIGNALS</div><div className="signal-list">{signals.map(([name,value,context,trend])=><div className="signal" key={name}><strong>{name}</strong><b className={trend}>{value}</b><span>{context} ↗</span></div>)}</div><div className="signal-mobile"><strong>{signals[signalIndex][0]}</strong><b className={signals[signalIndex][3]}>{signals[signalIndex][1]}</b><span>{signals[signalIndex][2]} ↗</span></div><a className="signal-link" href="https://delquant.com/player-intelligence/">View sample <Arrow/></a></section>
      <section className="intelligence section-pad" id="intelligence" aria-labelledby="intelligence-title"><div className="intelligence-intro reveal"><div className="eyebrow">FROM DATA TO DECISIONS</div><h2 id="intelligence-title">PLAYER<br/>INTELLIGENCE<span className="period">.</span></h2><p>Every player profile blends proprietary models, league context, and historical research into a clear, actionable view.</p><div className="intelligence-menu" role="tablist" aria-label="Player intelligence views">{tabs.map((tab, index)=><button type="button" ref={element => { tabRefs.current[tabId('overview', tab)] = element; }} id={tabId('overview', tab)} role="tab" aria-selected={active===tab} aria-controls="intelligence-panel" tabIndex={active===tab ? 0 : -1} className={active===tab ? 'selected':''} key={tab} onClick={()=>setActive(tab)} onKeyDown={event => handleTabKeyDown(event, 'overview', index, setActive, tabRefs)}>{tab}<Arrow/></button>)}</div></div><div className="player-art"><img src={asset('player-portrait.png')} alt="Fictional basketball player in a dark jersey"/><div className="player-identity"><span>PLAYER PROFILE / 001</span><strong>THE<br/>OFFENSIVE<br/>HUB</strong></div></div><div className="dashboard reveal"><div className="dashboard-head"><div><span>DELQUANT / PLAYER INTELLIGENCE</span><strong>A complete player picture.</strong></div><small>● INTERACTIVE DEMO</small></div><div className="dashboard-tabs" role="tablist" aria-label="Player dashboard data">{tabs.map((tab, index)=><button type="button" ref={element => { tabRefs.current[tabId('dashboard', tab)] = element; }} id={tabId('dashboard', tab)} role="tab" aria-selected={active===tab} aria-controls="intelligence-panel" tabIndex={active===tab ? 0 : -1} className={active===tab ? 'selected':''} key={tab} onClick={()=>setActive(tab)} onKeyDown={event => handleTabKeyDown(event, 'dashboard', index, setActive, tabRefs)}>{tab}</button>)}</div><div className="dashboard-body" id="intelligence-panel" role="tabpanel" aria-labelledby={tabId('dashboard', active)} tabIndex="0"><DataPanel active={active}/></div></div><div className="intelligence-quote">“Context turns talent<br/>into edge.”<span>— DELQUANT PRINCIPLE</span></div></section>
      <section className="solutions section-pad" id="solutions" aria-labelledby="solutions-title"><div className="section-heading reveal"><div><div className="eyebrow">ONE ENGINE. MANY DECISIONS.</div><h2 id="solutions-title">BUILT FOR<br/>DECISION MAKERS<span className="period">.</span></h2></div><p>Different goals. A common advantage. DelQuant delivers the player intelligence infrastructure powering better decisions across the basketball ecosystem.</p></div><div className="outcome-grid">{outcomes.map(item=><article className="outcome reveal" key={item.title}><div className={`outcome-visual ${item.visual}`}>{item.visual==='team' && <img loading="lazy" src={asset('team-room.png')} alt="Basketball strategy room with an illuminated tactics board"/>}{item.visual==='market' && <div className="market-visual"><span>SAMPLE / MARKET SIGNALS</span><div><b>A</b><b>+4.5</b><b>225.5</b><b>−210</b></div><div><b>B</b><b>−4.5</b><b>220.5</b><b>+175</b></div><div className="market-bars">{[17,25,31,22,39,43,35,49,57,54,68,62,76,72,83].map((height,i)=><i key={i} style={{height: `${height}%`}}/>)}</div></div>}{item.visual==='hoop' && <img loading="lazy" src={asset('hoop-editorial.png')} alt="Amber lit hoop in an empty basketball arena"/>}</div><div className="eyebrow">{item.category}</div><h3>{item.title}</h3><p>{item.copy}</p><a href={item.href}>Explore solution <Arrow/></a></article>)}</div></section>
      <section className="method section-pad" id="method" aria-labelledby="method-title"><div className="method-intro reveal"><div className="eyebrow">OUR METHODOLOGY</div><h2 id="method-title">A DEEPER<br/>LAYER OF<br/>ANALYSIS<span className="period">.</span></h2><p>Advanced statistical models, contextual intelligence, and historical research come together to create independent, transparent player intelligence.</p><a href="https://delquant.com/methodology/">Explore our methodology <Arrow/></a></div><div className="method-steps reveal">{steps.map(([number,title,copy])=><div className="method-step" key={number}><span>{number}</span><div className="step-icon" aria-hidden="true">{title==='DATA'?'◈':title==='MODELS'?'◎':title==='CONTEXT'?'⊕':'↗'}</div><h3>{title}</h3><p>{copy}</p></div>)}</div></section>
      <section className="proof section-pad" id="work" aria-labelledby="proof-title"><div className="proof-heading reveal"><div><div className="eyebrow">PUBLIC WORK / REAL USE CASES</div><h2 id="proof-title">SEE THE THINKING<br/>BEHIND THE NUMBERS<span className="period">.</span></h2></div><p>Explore how player intelligence becomes valuation, team analysis, and decisions.</p></div><div className="proof-list reveal"><a href="https://delquant.com/delquant-advanced/"><span>01 / BASKETBALL OPS</span><strong>From player value to team decisions</strong><Arrow/></a><a href="https://delquant.com/hawks-front-office-study/"><span>02 / TEAM STUDY</span><strong>A front-office view of player context</strong><Arrow/></a><a href="https://delquant.com/heat-front-office-study/"><span>03 / ROSTER STUDY</span><strong>Building a long-run roster identity</strong><Arrow/></a></div></section>
      <section className="contact section-pad" id="contact"><div className="reveal"><div className="eyebrow">LET'S BUILD A SMARTER BASKETBALL FUTURE</div><h2>Turn player intelligence<br/>into your advantage.</h2></div><div className="contact-actions reveal"><a className="button primary" href="mailto:teebu@delquant.com?subject=DelQuant%20pilot%20inquiry">Request a pilot <Arrow/></a><a className="button outline" href="mailto:teebu@delquant.com?subject=Talk%20to%20DelQuant">Talk to our team <Arrow/></a></div><div className="contact-tag">SAME GAME.<br/>DEEPER INSIGHT.</div></section>
    </main>
    <footer><a className="brand" href="#top">DELQUANT<span>.</span></a><nav aria-label="Footer navigation"><a href="#intelligence">Platform</a><a href="#solutions">Solutions</a><a href="https://delquant.com/methodology/">Methodology</a><a href="https://delquant.com/developers/">Developers</a><a href="#contact">Contact</a></nav><span>NBA INTELLIGENCE FOR A BRIGHTER EDGE.</span></footer>
  </div>;
}
