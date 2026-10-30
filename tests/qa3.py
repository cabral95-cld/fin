import asyncio, json, base64, pathlib, sys
from playwright.async_api import async_playwright
exec(open('qa2.py').read().split('async def main')[0].split('STYLE_FULL')[0])
async def clip(pg, path):
    png = await pg.evaluate("navigator.clipboard.read().then(async it=>{const b=await it[0].getType('image/png');const u=new Uint8Array(await b.arrayBuffer());let s='';for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(s);})")
    (OUT/path).write_bytes(base64.b64decode(png))
async def main():
    W = int(sys.argv[1]) if len(sys.argv)>1 else 390
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={"width": W, "height": 844}, permissions=["clipboard-read","clipboard-write"], device_scale_factor=1)
        async def route(r):
            u = r.request.url
            if "html-to-image" in u: await r.fulfill(path=str(LIB/"html-to-image/dist/html-to-image.js"), content_type="application/javascript")
            elif "jspdf" in u: await r.fulfill(path=str(LIB/"jspdf/dist/jspdf.umd.min.js"), content_type="application/javascript")
            else: await r.continue_()
        await ctx.route("**/*", route); await ctx.add_init_script(FAKE_DL)
        pg = await ctx.new_page(); errs=[]
        pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto(URL+"#vgv"); await pg.wait_for_timeout(300); await pg.evaluate("localStorage.clear()"); await pg.goto(URL+"#vgv"); await pg.wait_for_timeout(1200)
        res={}
        await pg.click("#p-g-chart .ph-act"); await pg.wait_for_timeout(3000); await clip(pg, f"w{W}_copy_vgvchart.png")
        await pg.click("#p-g-tb .ph-act"); await pg.wait_for_timeout(3000); await clip(pg, f"w{W}_copy_vgvtb.png")
        res["after_copy_chart_w"]=await pg.evaluate("document.querySelector('#g-chart svg').getAttribute('viewBox')")
        await pg.click("#g-tb tr.clk >> nth=4"); await pg.wait_for_timeout(500)
        await pg.click("#drill [data-a='copy']"); await pg.wait_for_timeout(3000); await clip(pg, f"w{W}_copy_drill.png")
        await pg.evaluate("location.hash='lancamentos'"); await pg.wait_for_timeout(500)
        await pg.click("#p-lc .ph-act"); await pg.wait_for_timeout(4000); await clip(pg, f"w{W}_copy_lc.png")
        await pg.evaluate("location.hash='centro-custo'"); await pg.wait_for_timeout(500)
        await pg.click("#cc-tb tr.clk >> nth=1"); await pg.wait_for_timeout(500)
        await pg.click('#gf .js-rep'); await pg.wait_for_timeout(600)
        await pg.click("#rp-copy"); await pg.wait_for_timeout(5000); await clip(pg, f"w{W}_copy_report.png")
        await pg.evaluate("window.__saved=[]")
        await pg.click("#rp-pdf")
        for _ in range(80):
            await pg.wait_for_timeout(500)
            if await pg.evaluate("window.__saved.some(s=>s.filename.endsWith('.pdf'))"): break
        pdf = await pg.evaluate("(window.__saved.find(s=>s.filename.endsWith('.pdf'))||{}).b64")
        if pdf: (OUT/f"w{W}_relatorio.pdf").write_bytes(base64.b64decode(pdf))
        res["toast"]=await pg.evaluate("document.getElementById('toast').innerText")
        res["hosts_left"]=await pg.evaluate("document.querySelectorAll('.shot-host').length")
        res["rp_overflow"]=await pg.evaluate("[document.getElementById('rp-body').scrollWidth, document.getElementById('rp-body').clientWidth]")
        res["page_overflow"]=await pg.evaluate("[document.documentElement.scrollWidth, document.querySelector('.content').scrollWidth]")
        print(json.dumps(res,ensure_ascii=False)); print("ERROS:",errs or "nenhum")
        await b.close()
asyncio.run(main())
