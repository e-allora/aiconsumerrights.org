# Project: aiconsumerrights.org Mission: Demystify AI consumer rights through constructive, depolarized, multi-stakeholder dialogue (bridging US & EU perspectives). 
## Core Philosophy: Blameless & Non-Generalizing Engagement (NON-NEGOTIABLE) 
1. Zero Vilification / No Singling Out: ABSOLUTELY NO messaging, prompt text, or UI copy may single out, shame, or generalize specific companies, platforms, or individuals. 
2. Humanize All Stakeholders: Operate from the core premise that people in all sectors—consumers, educators, regulators, and corporate teams—are acting in good faith and doing the best they can with their current understanding. 
3. Critique Ideas & Systems, Never People: Frame all challenges around systemic clarity, plain-language transparency, and mutual benefit. 
## The 5 "Around-the-Corner" Civic Safeguards 
1. Anti-Open-Washing (Traceability): Every interaction links to a visible outcome ("We Asked, You Said, We Did"). 
2. Bot & Spam Resistance: Forum architecture relies on isolated statement voting (Agree/Disagree/Pass) with no direct reply loops. 
3. Zero-Barrier Accessibility: Grade 6–8 reading level, no mandatory account registration for voting, and WCAG 2.2 Level AA compliance. 
4. Non-Adversarial Consensus: ML-driven clustering highlights broad agreement across diverse groups rather than amplifying outrage. 
5. Technical Resilience: Serverless edge architecture that decouples static content from interactive API endpoints. 
## Design Architecture (Figma 2026 Trends & Accessibility) - 3D & Immersive Elements: Lightweight CSS/SVG 3D depth cards. 
- Experimental Navigation: Non-linear drawer navigation with persistent mobile thumb-zone bar. 
- Color Palette: Warm neutral base (#FBF7EE cream), charcoal text (#12232E), teal/coral accents (#00A896 / #FF6B6B). 
- Typography: Bold expressive headers for Layer-Cake scanning patterns. 
- Touch & Focus Targets: Minimum 24x24px web / 44x44px mobile touch targets (SC 2.5.8), 3:1 visible focus rings (SC 2.4.13), auto-populating inputs (SC 3.3.7). 
## Recommended Lightweight Directory Layout 
/app ──► Next.js App Router (pages: /, /guide, /forum, /about) 
/components 
/ui ──► Base design system primitives 
/guide ──► Algorithm Explorer & Decision Tree components 
/forum ──► Pol.is Voting Engine & Consensus Cards 
/lib ──► Helper functions & Vercel AI SDK streams 
/public ──► Static assets, icons, sitemap/robots 
## Build Protocol - Incremental, Phase-by-Phase Development. 
- Every section MUST have unit tests that pass before moving to the next section.
