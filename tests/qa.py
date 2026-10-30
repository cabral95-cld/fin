import asyncio, json, sys
from playwright.async_api import async_playwright

PAGES = ["visao","vgv","por-verba","centro-custo","classificacao","fornecedores","vendas-emp","orcamento","imobiliarias","sintta","lancamentos","qualidade"]
URL = "file:///home/claude/due/fin/index.html"

async def main():
    shots = sys.argv[1:]  # pages to screenshot
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={"width": 1440, "height": 1000})
        pg = await ctx.new_page()
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.on("console", lambda m: errs.append("console: " + m.text) if m.type == "error" and "fonts.g" not in m.text and "ERR_" not in m.text else None)
        await pg.goto(URL + "#visao"); await pg.wait_for_timeout(600)
        await pg.evaluate("localStorage.clear()")
        await pg.goto(URL + "#visao"); await pg.wait_for_timeout(800)
        res = {}
        for name in PAGES:
            await pg.evaluate(f"location.hash='{name}'"); await pg.wait_for_timeout(350)
            rec = await pg.evaluate("document.getElementById('recorte').innerText")
            res[name] = rec[:90]
            if name in shots:
                await pg.add_style_tag(content="html,body,.app{height:auto!important;overflow:visible!important}.content{overflow:visible!important}.sb{position:sticky;top:0;height:100vh}")
                await pg.wait_for_timeout(250)
                await pg.screenshot(path=f"qa_{name}.png", full_page=True)
                await pg.evaluate("document.querySelectorAll('style').forEach(s=>{if(s.textContent.startsWith('html,body,.app{height:auto'))s.remove()})")
        # testes de filtro: Imobiliária isolada na visão
        await pg.evaluate("location.hash='visao'"); await pg.wait_for_timeout(300)
        await pg.click('#f-vb .chip[data-i="0"]'); await pg.click('#f-vb .chip[data-i="1"]'); await pg.click('#f-vb .chip[data-i="3"]'); await pg.click('#f-vb .chip[data-i="4"]')
        await pg.wait_for_timeout(300)
        res["filtro_imob"] = await pg.evaluate("document.getElementById('recorte').innerText")
        await pg.click('#reset'); await pg.wait_for_timeout(200)
        await pg.click('#gf [data-p="1-9"]'); await pg.wait_for_timeout(300)
        res["filtro_jan_set"] = await pg.evaluate("document.getElementById('recorte').innerText")
        res["kpis_jan_set"] = await pg.evaluate("document.getElementById('v-kpis').innerText.replace(/\\n/g,' | ')")
        # dropdown CC: só Solina
        await pg.click('#dd-cc .dd-btn'); await pg.wait_for_timeout(150)
        await pg.fill('#dd-cc-q', 'sol'); await pg.wait_for_timeout(150)
        await pg.click('#dd-cc [data-only]'); await pg.wait_for_timeout(300)
        res["filtro_solina_jan_set"] = await pg.evaluate("document.getElementById('recorte').innerText")
        await pg.click('#reset'); await pg.wait_for_timeout(200)
        # mobile
        await pg.set_viewport_size({"width": 400, "height": 860}); await pg.wait_for_timeout(400)
        res["mobile_overflow"] = await pg.evaluate("[document.documentElement.scrollWidth, document.querySelector('.content').scrollWidth, document.querySelector('.content').clientWidth]")
        if "mobile" in shots:
            await pg.screenshot(path="qa_mobile.png", full_page=False)
        await pg.set_viewport_size({"width": 1440, "height": 1000})
        if "dark" in shots:
            await pg.evaluate("document.documentElement.dataset.theme='dark'"); await pg.evaluate("location.hash='centro-custo'"); await pg.wait_for_timeout(400)
            await pg.add_style_tag(content="html,body,.app{height:auto!important;overflow:visible!important}.content{overflow:visible!important}")
            await pg.wait_for_timeout(250)
            await pg.screenshot(path="qa_dark.png", full_page=True)
        print(json.dumps(res, ensure_ascii=False, indent=1))
        print("ERROS:", errs if errs else "nenhum")
        await b.close()

asyncio.run(main())
