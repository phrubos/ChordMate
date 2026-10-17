/* ChordMate mockup — keret: irány / képernyő / eszköz váltó */
(() => {
  const DIRS = [['studio', 'Late-Night Studio'], ['liner', 'Liner Notes'], ['precision', 'Precision Utility'], ['hybrid', 'Midnight Liner']];
  const SCR = [['dashboard', 'Kezdőlap'], ['songs', 'Dalok'], ['hub', 'Song Hub'], ['practice', 'Próba mód']];
  const params = new URLSearchParams(location.search);
  const dir = document.documentElement.dataset.dir;
  let device = params.get('device') || sessionStorage.getItem('cm-device') || 'desktop';
  const chrome = params.get('chrome') !== '0';

  const css = `
  .fx-bar{position:fixed;inset:0 0 auto 0;height:44px;z-index:1000;display:flex;align-items:center;gap:14px;padding:0 14px;background:#0b0b0c;color:#d4d4d8;font:500 12.5px/1 system-ui,-apple-system,Segoe UI,sans-serif;border-bottom:1px solid #222}
  .fx-bar b{color:#fff;font-weight:650;letter-spacing:.01em}
  .fx-g{display:flex;gap:2px;background:#18181b;padding:3px;border-radius:8px}
  .fx-g a,.fx-g button{all:unset;cursor:pointer;padding:6px 10px;border-radius:6px;color:#a1a1aa;white-space:nowrap}
  .fx-g a:hover,.fx-g button:hover{color:#fff}
  .fx-g .on{background:#3f3f46;color:#fff}
  .fx-sp{flex:1}
  body.fx{padding-top:44px}
  body.fx-mobile{background:#1c1c1f!important;background-image:radial-gradient(#2a2a2e 1px,transparent 1px)!important;background-size:22px 22px!important}
  #device{--frame-top:0px;--frame-h:100vh}
  body.fx #device{--frame-top:44px;--frame-h:calc(100vh - 44px)}
  body.fx-mobile #device{--frame-top:0px;--frame-h:844px;width:390px;height:844px;margin:28px auto;border-radius:46px;overflow:auto;box-shadow:0 0 0 10px #0a0a0a,0 0 0 11px #333,0 40px 80px rgb(0 0 0/.6);scrollbar-width:none;position:relative}
  body.fx-mobile #device::-webkit-scrollbar{display:none}
  body.fx-shot #device{height:auto;margin:0;border-radius:0;box-shadow:none;overflow:visible}
  body.fx-shot.fx-practice #device{height:844px;overflow:hidden}
  @media (max-width:900px){.fx-bar .fx-dirs a span{display:none}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const screen = () => (location.hash.slice(1) || 'dashboard');
  const bar = document.createElement('div');
  bar.className = 'fx-bar';
  function drawBar() {
    bar.innerHTML = `<b>ChordMate · mockup</b>
      <div class="fx-g fx-dirs">${DIRS.map(([id, l], k) => `<a class="${id === dir ? 'on' : ''}" href="${id}.html${location.search}#${screen()}">${k + 1}. <span>${l}</span></a>`).join('')}</div>
      <span class="fx-sp"></span>
      <div class="fx-g">${SCR.map(([id, l]) => `<a class="${id === screen() ? 'on' : ''}" href="#${id}">${l}</a>`).join('')}</div>
      <div class="fx-g">${['desktop', 'mobile'].map((d) => `<button data-device="${d}" class="${d === device ? 'on' : ''}">${d === 'desktop' ? 'Desktop' : 'Mobil'}</button>`).join('')}</div>
      <a href="index.html" style="color:#a1a1aa">Áttekintés</a>`;
  }
  bar.onclick = (e) => {
    const b = e.target.closest('[data-device]');
    if (!b) return;
    device = b.dataset.device; sessionStorage.setItem('cm-device', device); apply();
  };

  const devEl = document.createElement('div'); devEl.id = 'device';
  const stage = document.createElement('div'); stage.id = 'stage';
  devEl.appendChild(stage);

  function render() {
    stage.innerHTML = SCREENS.render(screen());
    SCREENS.bind(stage, render);
  }
  function apply() {
    document.body.classList.toggle('fx', chrome);
    document.body.classList.toggle('fx-mobile', device === 'mobile');
    document.body.classList.toggle('fx-shot', params.has('shot'));
    document.body.classList.toggle('fx-practice', screen() === 'practice');
    if (chrome) drawBar();
    render();
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (chrome) document.body.appendChild(bar);
    document.body.appendChild(devEl);
    apply();
  });
  addEventListener('hashchange', () => { document.body.classList.toggle('fx-practice', screen() === 'practice'); if (chrome) drawBar(); render(); (device === 'mobile' ? devEl : window).scrollTo(0, 0); });
})();
