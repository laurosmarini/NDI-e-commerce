const hamburgerMenu = document.querySelector('.hamburger-menu');
const navLinks = document.querySelector('.nav-links');

if (hamburgerMenu && navLinks) {
    hamburgerMenu.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });
}

// Format static prices to localized EUR (en-IE for English EU formatting)
// Currency formatting and switcher (EUR/USD)
const CURRENCY_KEY = 'ndi-currency';

// formatPrices will be defined later once fetch helper exists

function initCurrencySwitcher(){
    const select = document.getElementById('currency');
    if(!select) return;
    // load saved preference
    const saved = localStorage.getItem(CURRENCY_KEY) || 'EUR';
    select.value = saved;
    formatPrices(saved);

    select.addEventListener('change', ()=>{
        const v = select.value;
        localStorage.setItem(CURRENCY_KEY, v);
        formatPrices(v);
    });
}

// Initialize currency switcher and price formatting once
document.addEventListener('DOMContentLoaded', async ()=>{
    try{
        initCurrencySwitcher();
        const saved = localStorage.getItem(CURRENCY_KEY) || 'EUR';
        await formatPrices(saved);
    }catch(err){ console.warn('init failed', err); }
});

// --- Analytics & Exchange rate helpers ---
window.ndiAnalytics = (function(){
    const KEY = 'ndi-analytics';
    function now(){ return new Date().toISOString(); }
    function load(){
        try{
            return JSON.parse(localStorage.getItem(KEY) || '[]');
        }catch(e){
            console.warn('analytics.load parse failed', e);
            return [];
        }
    }
    function save(events){ localStorage.setItem(KEY, JSON.stringify(events)); }
    function logEvent(name, payload){
        const ev = { name, payload: payload||{}, ts: now() };
        const events = load(); events.push(ev); save(events);
    }
    function getEvents(){ return load(); }
    function clear(){ localStorage.removeItem(KEY); }
    function exportJSON(){
        const dataStr = JSON.stringify(load(), null, 2);
        const blob = new Blob([dataStr], {type:'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'ndi-analytics.json'; document.body.appendChild(a); a.click(); a.remove();
        URL.revokeObjectURL(url);
    }
    return { logEvent, getEvents, clear, exportJSON };
})();

/* Theme toggle persistence */
const THEME_KEY = 'ndi-theme';
function applyTheme(theme){
    if(theme === 'dark'){
        document.documentElement.setAttribute('data-theme','dark');
    }else{
        document.documentElement.removeAttribute('data-theme');
    }
}
function initThemeToggle(){
    try{
        const saved = localStorage.getItem(THEME_KEY) || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        applyTheme(saved);
        const btn = document.getElementById('theme-toggle');
        if(!btn) return;
        // initialize aria state and icon
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
        btn.textContent = isDark ? '☀️' : '🌙';
        // click and keyboard support
        const toggle = ()=>{
            const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
            const next = current === 'dark' ? 'light' : 'dark';
            applyTheme(next);
            btn.setAttribute('aria-pressed', next === 'dark' ? 'true' : 'false');
            btn.textContent = next === 'dark' ? '☀️' : '🌙';
            try{ localStorage.setItem(THEME_KEY, next); }catch(e){ console.warn('could not persist theme preference', e); }
        };
        btn.addEventListener('click', toggle);
        btn.addEventListener('keydown', (ev)=>{ if(ev.key === ' ' || ev.key === 'Enter'){ ev.preventDefault(); toggle(); } });
    }catch(e){console.warn('theme init failed', e)}
}

document.addEventListener('DOMContentLoaded', function(){ initThemeToggle(); });

// fade-in on load (for SPA-like feel)
document.addEventListener('readystatechange', function(){
    if(document.readyState === 'interactive' || document.readyState === 'complete'){
        // ensure we start from 'in' state then flip to loaded
        document.body.setAttribute('data-transition','in');
        setTimeout(()=>{ document.body.classList.add('loaded'); }, 30);
    }
});

// Page-transition navigation handler
(function(){
    try{
        const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if(prefersReduced) return; // don't animate if user prefers reduced motion
        const links = Array.from(document.querySelectorAll('a[href]'))
            .filter(a => a.getAttribute('target') !== '_blank' && a.hostname === location.hostname);
        const delay = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--page-transition-duration')) || 260;
        links.forEach(a=>{
            a.addEventListener('click', function(ev){
                const href = a.getAttribute('href');
                if(href?.startsWith('#')) return; // anchor on same page
                ev.preventDefault();
                document.body.setAttribute('data-transition','out');
                setTimeout(()=>{ location.href = href; }, delay + 30);
            });
        });
        // helper: programmatic navigate with transition
        window.navigateWithTransition = function(href){ document.body.setAttribute('data-transition','out'); setTimeout(()=> location.href = href, delay + 30); };
    }catch(e){ console.warn('page transition init failed', e); }
})();

    // Utility: confirm + clear analytics (useful for UI wiring)
    function confirmClearAnalytics(){
        try{
            if(window.ndiAnalytics){
                if(confirm('Clear analytics from local storage? This cannot be undone.')){
                    window.ndiAnalytics.clear();
                    alert('Analytics cleared.');
                }
            }
        }catch(e){ console.warn('confirmClearAnalytics failed', e); }
    }
    window.confirmClearAnalytics = confirmClearAnalytics;

// --- Exchange rate fetch (EUR->USD) cached in localStorage ---
async function fetchEURtoUSDRate(force){
    const KEY = 'ndi-rate-eur-usd';
    try{
        if(!force){
            const raw = localStorage.getItem(KEY);
            if(raw){
                const cached = JSON.parse(raw);
                const age = Date.now() - (cached.ts||0);
                // use cached if less than 12 hours
                if(age < 1000*60*60*12) return cached.rate;
            }
        }
        // fetch from exchangerate.host (free)
        const res = await fetch('https://api.exchangerate.host/latest?base=EUR&symbols=USD');
        if(!res.ok) throw new Error('Network error');
    const json = await res.json();
    const rate = Number(json.rates?.USD) || null;
        if(rate){ localStorage.setItem(KEY, JSON.stringify({rate, ts:Date.now()})); }
        return rate;
    }catch(err){
        console.warn('fetchEURtoUSDRate failed', err);
        // fallback to cached or a safe default
        try{
            const raw = localStorage.getItem(KEY);
            if(raw){ return JSON.parse(raw).rate; }
        }catch(e){ console.warn('fetchEURtoUSDRate cached parse failed', e); }
        // reasonable fallback (not financial advice)
        return 1.08;
    }
}

// final formatPrices implementation that uses fetch helper
async function formatPrices(currency = 'EUR'){
    const els = document.querySelectorAll('[data-price]');
    if (!els.length) return;
    try{
        if(currency === 'USD'){
            const rate = await fetchEURtoUSDRate();
            const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
            els.forEach(el => {
                const valEUR = Number(el.getAttribute('data-price'));
                if (!isNaN(valEUR)) {
                    const converted = valEUR * rate;
                    const period = el.getAttribute('data-period');
                    el.textContent = formatter.format(converted) + (period ? `/${period}` : ' USD');
                }
            });
        } else {
            const locale = 'en-IE';
            const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' });
            els.forEach(el => {
                const val = Number(el.getAttribute('data-price'));
                if (!isNaN(val)) {
                    const period = el.getAttribute('data-period');
                    el.textContent = formatter.format(val) + (period ? `/${period}` : ` EUR`);
                }
            });
        }
    }catch(err){ console.warn('formatPrices final implementation failed', err); }
}

// Override init to call updated formatPrices
// (removed duplicate init)