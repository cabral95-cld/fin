import asyncio, json, sys, base64, pathlib
from playwright.async_api import async_playwright

PAGES = ["visao","vgv","por-verba","centro-custo","classificacao","fornecedores","custo-fixo","vendas-emp","orcamento","imobiliarias","sintta","lancamentos","qualidade"]
DRILL = {"vgv":"g-tb","por-verba":"vb-tb","centro-custo":"cc-tb","classificacao":"cl-tb","fornecedores":"fo-tb","custo-fixo":"cf-tb","vendas-emp":"ve-tb","orcamento":"or-tb","imobiliarias":"im-tb","sintta":"si-tb"}
URL = "file:///home/claude/due/fin/index.html"
LIB = pathlib.Path("/home/claude/due/fin/libs/node_modules")
OUT = pathlib.Path("/home/claude/due/fin/qa_out"); OUT.mkdir(exist_ok=True)
FAKE_DL = """
window.__saved=[];
window.claude={use:async(n)=>({save:async({filename,data})=>{let b=data instanceof Blob?data:new Blob([data]);const buf=await b.arrayBuffer();let s='';const u=new Uint8Array(buf);for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));window.__saved.push({filename,size:u.length,b64:btoa(s)});return {ok:true};}})};
"""
STYLE_FULL = "html,body,.app{height:auto!important;overflow:visible!important}.content{overflow:visible!important}.sb{position:sticky;top:0;height:100vh}"

async def main():
    shots = set(sys.argv[1:])
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={"width": 1440, "height": 1000}, permissions=["clipboard-read","clipboard-write"])
        async def route(r):
            u = r.request.url
            if "html-to-image" in u: await r.fulfill(path=str(LIB/"html-to-image/dist/html-to-image.js"), content_type="application/javascript")
            elif "jspdf" in u: await r.fulfill(path=str(LIB/"jspdf/dist/jspdf.umd.min.js"), content_type="application/javascript")
            else: await r.continue_()
        await ctx.route("**/*", route)
        await ctx.add_init_script(FAKE_DL)
        pg = await ctx.new_page()
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.on("console", lambda m: errs.append("console: " + m.text) if m.type == "error" else None)
        await pg.goto(URL + "#visao"); await pg.wait_for_timeout(500)
        await pg.evaluate("localStorage.clear()")
        await pg.goto(URL + "#visao"); await pg.wait_for_timeout(1200)
        res = {"libs": await pg.evaluate("[!!window.htmlToImage, !!window.jspdf, !document.getElementById('rp-pdf').hidden, !document.getElementById('csvBtn').hidden]")}
        # copiar imagem + drill em todas as telas
        for name in PAGES:
            await pg.evaluate(f"location.hash='{name}'"); await pg.wait_for_timeout(400)
            n = await pg.evaluate(f"[document.querySelectorAll('#pg-{name} .panel .ph-act').length, document.querySelectorAll('#pg-{name} .panel').length]")
            r = {"copiar/paineis": n}
            if name in DRILL:
                tb = DRILL[name]
                cnt = await pg.evaluate(f"document.querySelectorAll('#{tb} tr.clk').length")
                if cnt:
                    await pg.click(f"#{tb} tr.clk >> nth=0"); await pg.wait_for_timeout(450)
                    r["drill"] = await pg.evaluate("(()=>{const d=document.getElementById('drill');if(!d)return null;return [d.querySelector('h2').innerText, d.querySelector('.ph p').innerText.slice(0,110), d.querySelectorAll('#dr-tb tbody tr').length, d.previousElementSibling&&d.previousElementSibling.id||d.previousElementSibling.className]})()")
                    if name in shots or "drill" in shots:
                        el = await pg.query_selector("#drill")
                        await el.screenshot(path=str(OUT/f"drill_{name}.png"))
                else:
                    r["drill"] = "sem linhas clicáveis"
            res[name] = r
        # VGV: linhas de despesa
        await pg.evaluate("location.hash='vgv'"); await pg.wait_for_timeout(400)
        await pg.evaluate("document.getElementById('drill')&&document.querySelector('#drill .dr-x').click()")
        res["vgv_legend"] = await pg.evaluate("document.getElementById('g-leg').innerText")
        res["vgv_paths"] = await pg.evaluate("[document.querySelectorAll('#g-chart path').length, document.querySelectorAll('#g-chart circle').length]")
        if "vgv" in shots:
            el = await pg.query_selector("#p-g-chart"); await el.screenshot(path=str(OUT/"vgv_chart.png"))
        # copiar imagem (clipboard) no gráfico VGV
        await pg.click("#p-g-chart .ph-act"); await pg.wait_for_timeout(3500)
        res["copy_toast"] = await pg.evaluate("document.getElementById('toast').innerText")
        res["clipboard_types"] = await pg.evaluate("navigator.clipboard.read().then(it=>it.map(i=>i.types.join(','))).catch(e=>'ERR '+e.message)")
        try:
            png = await pg.evaluate("navigator.clipboard.read().then(async it=>{const b=await it[0].getType('image/png');const u=new Uint8Array(await b.arrayBuffer());let s='';for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(s);})")
            (OUT/"copy_vgv.png").write_bytes(base64.b64decode(png))
        except Exception as e:
            res["clip_err"] = str(e)[:200]
        # relatório na visão com filtro
        await pg.evaluate("location.hash='visao'"); await pg.wait_for_timeout(300)
        await pg.click('#gf [data-p="1-9"]'); await pg.wait_for_timeout(200)
        await pg.click('#f-vb .chip[data-i="4"]'); await pg.wait_for_timeout(300)
        await pg.click('#gf .js-rep'); await pg.wait_for_timeout(600)
        res["rp_open"] = await pg.evaluate("!document.getElementById('rp').hidden")
        res["rp_meta"] = await pg.evaluate("document.querySelector('.rp-meta').innerText.replace(/\\n/g,' | ')")
        res["rp_secs"] = await pg.evaluate("[...document.querySelectorAll('#rp-doc .rp-sec')].map(s=>(s.querySelector('h2')?.innerText||s.firstElementChild.className)+' obs:'+(s.querySelector('.rp-obs li')?1:0))")
        if "rp" in shots:
            await pg.screenshot(path=str(OUT/"rp_modal.png"))
            h = await pg.evaluate("document.getElementById('rp-doc').scrollHeight")
            el = await pg.query_selector("#rp-doc"); await el.screenshot(path=str(OUT/"rp_doc.png"))
        # PDF
        await pg.click("#rp-pdf");
        for _ in range(60):
            await pg.wait_for_timeout(500)
            if await pg.evaluate("window.__saved.some(s=>s.filename.endsWith('.pdf'))"): break
        sv = await pg.evaluate("window.__saved.map(s=>({f:s.filename,n:s.size}))")
        res["saved"] = sv
        pdf = await pg.evaluate("(window.__saved.find(s=>s.filename.endsWith('.pdf'))||{}).b64")
        if pdf: (OUT/"relatorio.pdf").write_bytes(base64.b64decode(pdf))
        await pg.keyboard.press("Escape"); await pg.wait_for_timeout(200)
        res["rp_closed"] = await pg.evaluate("document.getElementById('rp').hidden")
        await pg.click('#reset'); await pg.wait_for_timeout(200)
        # mobile
        await pg.set_viewport_size({"width": 390, "height": 844}); await pg.wait_for_timeout(400)
        await pg.evaluate("location.hash='vgv'"); await pg.wait_for_timeout(400)
        res["mobile_overflow_vgv"] = await pg.evaluate("[document.documentElement.scrollWidth, document.querySelector('.content').scrollWidth, document.querySelector('.content').clientWidth]")
        if "mobile" in shots:
            await pg.add_style_tag(content=STYLE_FULL); await pg.wait_for_timeout(250)
            await pg.screenshot(path=str(OUT/"m_vgv.png"), full_page=True)
            await pg.evaluate("document.querySelectorAll('style').forEach(s=>{if(s.textContent.startsWith('html,body,.app{height:auto'))s.remove()})")
        await pg.click("#g-tb tr.clk >> nth=3"); await pg.wait_for_timeout(500)
        res["mobile_overflow_drill"] = await pg.evaluate("[document.documentElement.scrollWidth, document.querySelector('.content').scrollWidth, document.querySelector('.content').clientWidth]")
        if "mobile" in shots:
            el = await pg.query_selector("#drill"); await el.screenshot(path=str(OUT/"m_drill.png"))
        await pg.click('#gf .js-rep'); await pg.wait_for_timeout(600)
        res["mobile_rp_overflow"] = await pg.evaluate("[document.getElementById('rp-body').scrollWidth, document.getElementById('rp-body').clientWidth]")
        if "mobile" in shots:
            await pg.screenshot(path=str(OUT/"m_rp.png"))
        await pg.keyboard.press("Escape")
        # dark: relatório continua claro
        await pg.set_viewport_size({"width": 1440, "height": 1000})
        await pg.evaluate("document.documentElement.dataset.theme='dark'"); await pg.wait_for_timeout(200)
        await pg.click('#gf .js-rep'); await pg.wait_for_timeout(500)
        res["dark_rp_bg"] = await pg.evaluate("getComputedStyle(document.querySelector('.rp-sec')).backgroundColor")
        if "dark" in shots: await pg.screenshot(path=str(OUT/"dark_rp.png"))
        await pg.keyboard.press("Escape")
        if "dark" in shots:
            await pg.evaluate("location.hash='fornecedores'"); await pg.wait_for_timeout(300)
            await pg.click("#fo-tb tr.clk >> nth=1"); await pg.wait_for_timeout(500)
            el = await pg.query_selector("#drill"); await el.screenshot(path=str(OUT/"dark_drill.png"))
        print(json.dumps(res, ensure_ascii=False, indent=1))
        print("ERROS:", errs if errs else "nenhum")
        await b.close()

asyncio.run(main())
