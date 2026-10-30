// Teste headless do painel financeiro antes de publicar.
// Uso: node check_fin.cjs painel_novo.html  → última linha "CHECK OK" ou "CHECK FAIL: …"
const { chromium } = require('playwright');
const path = require('path');
const PAGES = ['visao','vgv','por-verba','centro-custo','classificacao','fornecedores','custo-fixo','vendas-emp','orcamento','imobiliarias','sintta','lancamentos','qualidade'];
(async () => {
  const file = path.resolve(process.argv[2]);
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e)));
  // bibliotecas de imagem/PDF vêm de CDN; o teste não depende delas
  await pg.route(/cdn\.jsdelivr|cdnjs\.cloudflare/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  try {
    await pg.goto('file://' + file + '#visao'); await pg.waitForTimeout(400);
    await pg.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
    await pg.goto('file://' + file + '#visao'); await pg.waitForTimeout(900);
    const D = await pg.evaluate(() => { const d = JSON.parse(document.getElementById('fin-data').textContent); return { n: d.L.length, t: d.L.reduce((s, r) => s + r[8], 0), qi: (d.qi || []).length }; });
    for (const p of PAGES) {
      await pg.evaluate(h => { location.hash = h; }, p); await pg.waitForTimeout(350);
      const empty = await pg.evaluate(h => { const s = document.getElementById('pg-' + h); return !s || s.hidden || s.innerText.trim().length < 80; }, p);
      if (empty) throw new Error('tela vazia: ' + p);
    }
    await pg.evaluate(() => { location.hash = 'lancamentos'; }); await pg.waitForTimeout(400);
    const rec = await pg.evaluate(() => document.getElementById('recorte').innerText);
    const nTxt = D.n.toLocaleString('pt-BR');
    if (!rec.includes(nTxt)) throw new Error(`recorte não mostra ${nTxt} lançamentos: ${rec.slice(0, 80)}`);
    await pg.evaluate(() => { location.hash = 'qualidade'; }); await pg.waitForTimeout(300);
    const rows = await pg.evaluate(() => document.querySelectorAll('#q-tb tbody tr').length);
    if (rows !== D.qi) throw new Error(`qualidade: ${rows} linhas na tela × ${D.qi} apontamentos`);
    await pg.evaluate(() => document.querySelector('#gf .js-rep, .js-rep').click()); await pg.waitForTimeout(400);
    const secs = await pg.evaluate(() => document.querySelectorAll('#rp-doc .rp-sec').length);
    if (!secs) throw new Error('relatório sem seções');
    if (errs.length) throw new Error('erro de script: ' + errs[0]);
    console.log(`${D.n} lançamentos · R$ ${D.t.toFixed(2)} · ${D.qi} apontamentos · ${PAGES.length} telas abertas`);
    console.log('CHECK OK');
  } catch (e) {
    console.log('CHECK FAIL: ' + e.message);
  } finally { await b.close(); }
})();
