import React, { useEffect, useRef, useState } from 'react';
import portrait from './assets/al-mahamud.png';
import aboutPortrait from './assets/about-portrait.png';
import timeSyncScreenshot from './assets/extension-timesync.png';
import tvbScreenshot from './assets/extension-tvb.png';
import arrivalScreenshot from './assets/extension-arrival.png';
import demonstrationVideo from '../Demonstrate.mp4';
import './landing-page.css';
import './portrait.css';
import './about-portrait.css';
import './scroll-motion.css';
import './responsive-polish.css';
import './design-polish.css';
import './extensions-section.css';
import './extension-details.css';
import './extension-previews.css';
import './workflow-flow.css';
import './apps-section.css';

function Arrow({ diagonal = false }) { return <svg aria-hidden="true" viewBox="0 0 20 20" className={diagonal ? 'arrow-diagonal' : ''}><path d="M3.5 10h12M10 4.5l5.5 5.5-5.5 5.5" /></svg>; }

export default function LandingPage() {
  const [videoUrl, setVideoUrl] = useState(demonstrationVideo);
  const [videoName, setVideoName] = useState('Demonstrate.mp4');
  const [activeWorkflow, setActiveWorkflow] = useState(0);
  const videoInput = useRef(null);
  const workflowSteps = [
    { label: 'Upload', detail: 'Add an invoice or business document.' },
    { label: 'Extract', detail: 'OCR reads the page and organizes key fields.' },
    { label: 'Review', detail: 'Check values, fix uncertain fields, and compare invoices.' },
  ];
  useEffect(() => () => { if (videoUrl.startsWith('blob:')) URL.revokeObjectURL(videoUrl); }, [videoUrl]);
  useEffect(() => {
    const targets = [...document.querySelectorAll('[data-reveal]')];
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      targets.forEach(target => target.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }), { threshold: 0.14, rootMargin: '0px 0px -42px 0px' });
    targets.forEach(target => observer.observe(target));
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const timer = window.setInterval(() => setActiveWorkflow(step => (step + 1) % workflowSteps.length), 2800);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    let frame = 0;
    const updateProgress = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const range = document.documentElement.scrollHeight - window.innerHeight;
        const value = range > 0 ? Math.min(100, Math.max(0, window.scrollY / range * 100)) : 0;
        document.documentElement.style.setProperty('--scroll-progress', `${value}%`);
      });
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
    return () => { window.removeEventListener('scroll', updateProgress); cancelAnimationFrame(frame); };
  }, []);
  function chooseVideo(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (videoUrl.startsWith('blob:')) URL.revokeObjectURL(videoUrl);
    setVideoUrl(URL.createObjectURL(file));
    setVideoName(file.name);
  }
  return <div className="portfolio-page">
    <div className="scroll-progress" aria-hidden="true"/>
    <header className="portfolio-header">
      <a href="#top" className="portfolio-brand" aria-label="Al Mahamud home"><span className="brand-monogram">AM<span>.</span></span><span>AL MAHAMUD<small>AI · AUTOMATION · SYSTEMS</small></span></a>
      <nav className="portfolio-nav" aria-label="Main navigation"><a href="#about">About</a><a href="#work">Featured work</a><a href="#extensions">Extensions</a><a href="#apps">Apps</a><a href="#overview">Project preview</a></nav>
      <a className="header-contact" href="mailto:joymahmud7400@gmail.com">Let’s connect <Arrow diagonal /></a>
    </header>

    <main id="top">
      <section className="portfolio-hero">
        <div className="hero-copy">
          <div className="hero-kicker"><span className="status-light"/> DHAKA, BANGLADESH <span className="kicker-rule"/> AVAILABLE FOR A CONVERSATION</div>
          <p className="hero-designation">Senior AI Engineer <span>·</span> IT &amp; Automation</p>
          <h1><span className="hero-title-line">Turning everyday</span><span className="hero-title-line">work into</span><span className="hero-title-line"><em>smart systems.</em></span></h1>
          <p className="hero-intro">I’m Al Mahamud. I build practical automation and AI-assisted tools, grounded in five years of IT support, e-commerce operations, and process improvement.</p>
          <div className="hero-actions"><a className="button-primary" href="/app">Explore LedgerLens <Arrow diagonal /></a><a className="button-text" href="#overview"><span className="play-small">▶</span> Watch the project preview</a></div>
          <div className="hero-workflow" aria-label="LedgerLens invoice workflow">
            <div className="workflow-heading"><span>THE MAIN TASK FLOW</span><span className="workflow-live"><i/> LIVE PREVIEW</span></div>
            <div className="workflow-track" role="group" aria-label="Select a workflow step">
              {workflowSteps.map((step, index) => <React.Fragment key={step.label}>
                <button type="button" className={`workflow-step ${activeWorkflow === index ? 'is-active' : ''} ${activeWorkflow > index ? 'is-complete' : ''}`} onClick={() => setActiveWorkflow(index)} aria-pressed={activeWorkflow === index}>
                  <span className="workflow-number">{activeWorkflow > index ? '✓' : `0${index + 1}`}</span><span className="workflow-label">{step.label}</span>
                </button>
                {index < workflowSteps.length - 1 && <span className={`workflow-connector ${activeWorkflow > index ? 'is-filled' : ''}`} aria-hidden="true"><i/></span>}
              </React.Fragment>)}
            </div>
            <div className="workflow-detail" aria-live="polite"><span>{workflowSteps[activeWorkflow].detail}</span><a href="/app">Open the live workspace <Arrow diagonal /></a></div>
          </div>
          <div className="hero-proof"><div className="proof-avatars"><span>AI</span><span>IT</span><span>⚙</span></div><p><b>People-first technology.</b><br/>Built for clarity, accuracy, and real workflows.</p><span className="hero-proof-line"/></div>
        </div>
        <div className="hero-portrait-wrap">
          <div className="portrait-orbit orbit-one"/><div className="portrait-orbit orbit-two"/>
          <div className="portrait-frame"><img src={portrait} alt="Portrait of Al Mahamud"/><span className="portrait-caption"><i/> HUMAN-CENTERED AUTOMATION</span></div>
          <div className="floating-note note-top"><span className="note-icon">✳</span><span><b>AI + automation</b><small>Less repetition. More focus.</small></span></div>
          <div className="floating-note note-bottom"><span className="note-number">05</span><span><b>Years in IT &amp; operations</b><small>Support · systems · workflows</small></span></div>
          <div className="portrait-index">01 <span>/</span> 03</div>
        </div>
        <div className="hero-bottom-label"><span>SCROLL TO EXPLORE</span><i/></div>
      </section>

      <section className="about-band" id="about">
        <div className="about-portrait" data-reveal="portrait"><div className="about-photo-orbit"/><img src={aboutPortrait} alt="Al Mahamud in a blue suit"/><span className="about-photo-label"><i/> SYSTEMS THINKER · PEOPLE-FIRST BUILDER</span><span className="about-photo-index">AM <b>/</b> 02</span></div>
        <div className="about-copy" data-reveal="left" style={{'--reveal-delay':'100ms'}}><div className="section-label"><span>01</span> A LITTLE ABOUT ME</div><h2>Technology should make<br/>good work <em>easier.</em></h2><p>My experience spans day-to-day IT support, e-commerce operations, quality assurance, and HR administration. I enjoy finding the repetitive parts of a process and shaping them into tools people can actually use.</p><p>From browser-extension workflows to employee attendance and payroll support, my focus is practical: understand the work, reduce friction, and make the result dependable.</p></div>
        <div className="about-facts" data-reveal="right" style={{'--reveal-delay':'180ms'}}><div><span>01</span><b>Workflow automation</b><small>Browser tools · AI-assisted workflows</small></div><div><span>02</span><b>Operations &amp; support</b><small>IT support · e-commerce · QA</small></div><div><span>03</span><b>Engineering foundation</b><small>BSc + MSc, AIUB</small></div></div>
      </section>

      <section className="work-section" id="work">
        <div className="work-heading" data-reveal="left"><div><div className="section-label"><span>02</span> FEATURED PROJECT</div><h2>Meet <em>LedgerLens.</em></h2></div><span className="work-count">A LOCAL INVOICE INTELLIGENCE WORKSPACE</span></div>
        <div className="project-card" data-reveal="wipe" style={{'--reveal-delay':'100ms'}}>
          <div className="project-copy"><span className="project-tag"><i/> FLAGSHIP PROJECT · 2026</span><h3>From invoice pile<br/>to clear decisions.</h3><p>LedgerLens turns invoices and business documents into structured information you can review. Upload a file, let OCR extract the details, then check totals, correct fields, search, and compare invoices in one local workspace.</p><div className="feature-list"><span><i>✓</i> OCR extraction</span><span><i>✓</i> Review &amp; validation</span><span><i>✓</i> Invoice cross-check</span></div><a className="project-link" href="/app">Open the LedgerLens workspace <Arrow diagonal /></a></div>
          <div className="project-visual" aria-label="LedgerLens dashboard preview"><div className="mock-window"><div className="mock-top"><span className="mock-brand"><b>L</b> ledger<span>lens</span></span><span className="mock-dots"><i/><i/><i/></span></div><div className="mock-body"><div className="mock-side"><i className="side-active"/><i/><i/><i/><span/></div><div className="mock-main"><div className="mock-title-row"><div><small>OVERVIEW</small><b>Your documents, in focus.</b></div><span className="mock-upload">＋ Upload</span></div><div className="mock-stats"><div><small>TOTAL DOCUMENTS</small><b>24</b><i>↑ 8 this month</i></div><div><small>NEEDS REVIEW</small><b>03</b><i className="mock-warm">Check these invoices</i></div><div><small>PROCESSED</small><b>21</b><i>All caught up</i></div></div><div className="mock-table"><div className="mock-table-head"><span>DOCUMENT</span><span>SUPPLIER</span><span>AMOUNT</span><span>STATUS</span></div><div className="mock-row"><i className="mock-file">PDF</i><b>Invoice_1048.pdf</b><span>Northstar Supply</span><strong>$2,480.00</strong><em>Complete</em></div><div className="mock-row"><i className="mock-file">PDF</i><b>April_Invoice.pdf</b><span>Studio Forma</span><strong>$860.50</strong><em className="needs-review">Review</em></div><div className="mock-row"><i className="mock-file">XLS</i><b>Supplier_list.xlsx</b><span>Operations team</span><strong>—</strong><em>Processed</em></div></div></div></div><div className="mock-footer"><span><i/> PRIVATE LOCAL WORKSPACE</span><span>OCR · CHECK · REVIEW</span></div></div><div className="visual-sticker">WORK<br/>SMARTER<span>↗</span></div></div>
        </div>
        <div className="project-footnote"><span>DESIGNED TO SUPPORT HUMAN REVIEW</span><span>Details should be checked before accounting use.</span></div>
      </section>

      <section className="extensions-section" id="extensions">
        <div className="extensions-heading" data-reveal="left"><div><div className="section-label"><span>03</span> BROWSER WORKFLOW EXTENSIONS</div><h2>Automation, right<br/>where the work <em>happens.</em></h2></div><p>Purpose-built Chrome extensions that turn specialized, repetitive tasks into clearer browser workflows.</p></div>
        <div className="extension-grid">
          <article className="extension-card" data-reveal="right"><div className="extension-card-top"><span className="extension-symbol arrival-symbol">A</span><span className="extension-badge">PUBLIC LISTING</span></div><div className="extension-preview wide-preview arrival-preview"><img src={arrivalScreenshot} alt="ASL ARRIVAL product quality monitor and review table" loading="lazy"/></div><div className="extension-overline">E-COMMERCE OPERATIONS <span>·</span> v4.1.1</div><h3>ASL ARRIVAL</h3><p>Automates product handling in Miinto’s Arrival workflow: captures product details, cleans titles, validates required fields, checks for duplicates, and logs activity for review.</p><div className="extension-tags"><span>Product data capture</span><span>QA &amp; deduplication</span><span>Activity logs</span></div><a className="extension-link" href="https://chromewebstore.google.com/detail/asl-arrival/jnhedoigfboeiajgmcgfkbpokcbpflnn?hl=en" target="_blank" rel="noreferrer">View Chrome Web Store listing <Arrow diagonal /></a></article>
          <article className="extension-card" data-reveal="right" style={{'--reveal-delay':'120ms'}}><div className="extension-card-top"><span className="extension-symbol timesync-symbol">TS</span><span className="extension-badge">PUBLIC LISTING</span></div><div className="extension-preview portrait-preview"><img src={timeSyncScreenshot} alt="ASL TimeSync workforce attendance popup" loading="lazy"/></div><div className="extension-overline">WORKFORCE SUPPORT <span>·</span> v6.9</div><h3>ASL TimeSync</h3><p>A browser-based workforce tool for attendance, clock-in and clock-out, breaks, daily reminders, pay estimates, and admin logs.</p><div className="extension-tags"><span>Attendance</span><span>Break tracking</span><span>Payroll insights</span></div><div className="extension-note">The listing also describes optional organization monitoring features with notice and user consent.</div><a className="extension-link" href="https://chromewebstore.google.com/detail/asl-timesync/jmjomjpcaiccadgdmhcjecpllhibagan?hl=en" target="_blank" rel="noreferrer">View Chrome Web Store listing <Arrow diagonal /></a></article>
          <article className="extension-card private-extension" data-reveal="right" style={{'--reveal-delay':'240ms'}}><div className="extension-card-top"><span className="extension-symbol tvb-symbol">TVB</span><span className="extension-badge private-badge">CHROME WEB STORE</span></div><div className="extension-preview wide-preview tvb-preview"><img src={tvbScreenshot} alt="TVB Automations product-processing service controls" loading="lazy"/></div><div className="extension-overline">THE VINTAGE BAR <span>·</span> v7.6</div><h3>TVB Automations</h3><p>A product-processing toolkit for The Vintage Bar that fills measurements, applies selected product attributes, checks image duplicates, and keeps listings current.</p><div className="extension-tags"><span>Form automation</span><span>Product attributes</span><span>Image checks</span></div><details className="extension-details"><summary>Explore capabilities</summary><ul><li><b>Product fields:</b> measurements, date codes, gender, child categories, colors, materials, and pricing.</li><li><b>Service controls:</b> Auto Motherpage, Hand Drop, Measurement, Auto Closer, and Highlighter can be toggled.</li><li><b>Quality and updates:</b> duplicate image detection and automatic product-attribute updates.</li><li><b>Personalization:</b> Google authentication fetches user profiles and settings.</li><li><b>Dynamic display:</b> refreshes product details and images in the website interface.</li></ul></details><a className="extension-link" href="https://chromewebstore.google.com/detail/tvb-automations/njmklbkianepncpnbaolamlagpkmdepg?authuser=0&hl=" target="_blank" rel="noreferrer">View Chrome Web Store listing <Arrow diagonal /></a></article>
        </div>
        <div className="extensions-footnote"><span>BUILT FOR REAL OPERATIONAL WORK</span><span>Store descriptions summarized from the published listings.</span></div>
      </section>

      <section className="apps-section" id="apps">
        <div className="apps-heading" data-reveal="left"><div><div className="section-label"><span>04</span> MORE BUILT PROJECTS</div><h2>Small ideas, useful<br/><em>everyday apps.</em></h2></div><p>A selection of apps I’ve built to make common work and personal tasks easier to manage.</p></div>
        <div className="apps-grid">
          <article className="app-project-card" data-reveal="right"><span className="app-project-index">APP / 01</span><div className="app-project-icon timesync-app-icon">TS</div><h3>Timesync Companion</h3><p>A companion app for the TimeSync experience, bringing key time and attendance tasks into a simple, easy-to-use interface.</p><div className="app-project-tags"><span>Time &amp; attendance</span><span>Companion app</span></div></article>
          <article className="app-project-card" data-reveal="right" style={{'--reveal-delay':'80ms'}}><span className="app-project-index">APP / 02</span><div className="app-project-icon inventory-app-icon">ASL</div><h3>ASL Inventory</h3><p>An inventory management app concept for keeping products, stock levels, and item information organized in one place.</p><div className="app-project-tags"><span>Inventory</span><span>Product records</span></div></article>
          <article className="app-project-card" data-reveal="right" style={{'--reveal-delay':'160ms'}}><span className="app-project-index">APP / 03</span><div className="app-project-icon questionnaire-app-icon">Q</div><h3>My Quesnariees</h3><p>A questionnaire app for creating or completing forms and keeping responses together for easier review.</p><div className="app-project-tags"><span>Questionnaires</span><span>Response collection</span></div></article>
          <article className="app-project-card" data-reveal="right" style={{'--reveal-delay':'240ms'}}><span className="app-project-index">APP / 04</span><div className="app-project-icon taka-app-icon">৳</div><h3>Taka Kamai</h3><p>A personal finance app idea for recording earnings and tracking money over time with a clear, practical view.</p><div className="app-project-tags"><span>Income tracking</span><span>Personal finance</span></div></article>
        </div>
      </section>

      <section className="overview-section" id="overview">
        <div className="section-label" data-reveal><span>05</span> SEE IT IN ACTION</div>
        <div className="overview-layout" data-reveal="right" style={{'--reveal-delay':'100ms'}}><div className="overview-copy"><h2>A quick look<br/>inside <em>LedgerLens.</em></h2><p>Watch my recorded LedgerLens walkthrough here, or choose another video from your device.</p><button className="choose-video" onClick={() => videoInput.current?.click()}>Choose a different video <Arrow diagonal /></button><input ref={videoInput} type="file" accept="video/mp4,video/webm,video/ogg" onChange={chooseVideo} hidden/>{videoName && <small className="video-filename">Walkthrough: {videoName}</small>}<span className="video-format-note">Project demo · MP4</span></div>
          <div className="video-frame has-video"><video src={videoUrl} controls loop playsInline preload="metadata" aria-label="LedgerLens project overview video"/></div>
        </div>
      </section>

      <section className="closing-section" data-reveal="closing"><div className="closing-mark">AM<span>.</span></div><div><div className="section-label"><span>06</span> THANKS FOR STOPPING BY</div><h2>Let’s make work<br/><em>work better.</em></h2></div><a className="button-light" href="mailto:joymahmud7400@gmail.com">Get in touch <Arrow diagonal /></a></section>
    </main>
    <footer className="portfolio-footer"><span>© {new Date().getFullYear()} Al Mahamud</span><span>BUILT WITH CURIOSITY &amp; PURPOSE</span><a href="/app">ENTER LEDGERLENS <Arrow diagonal /></a></footer>
  </div>;
}
