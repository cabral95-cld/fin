# -*- coding: utf-8 -*-
"""
DUE · Painel Controle Financeiro de Marketing 2026 — sincronização com a planilha do Financeiro.

Uso:
  python3 -I sync_fin.py PLANILHA.xlsx PAINEL_ATUAL.html PAINEL_NOVO.html --data "DD/MM/AAAA HH:MM"

  --data = data/hora (Recife) da última alteração da planilha (modifiedTime do Drive).

Primeira linha impressa:
  UNCHANGED | …   dados idênticos aos do painel atual → não publicar
  CHANGED | …     PAINEL_NOVO.html gerado → testar e publicar
  FALHOU: …       estrutura inesperada → não publicar

Fontes: despesas = aba "7. Base de Dados" (colunas Verba e Classificação, revisadas em 30/10/2026; Classe e
Sub Classificação não são usadas);
VGV = abas 1, 2, 4, 5 e 6. Nenhum número é estimado: o que não existe na planilha fica vazio.
"""
import sys, re, json, html, datetime, collections, unicodedata, statistics, argparse

try:
    import openpyxl
except ImportError:
    print("FALHOU: openpyxl não instalado (pip install openpyxl --break-system-packages)")
    sys.exit(2)

MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
MESL = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"]
CC_CANON = ["Habitá", "Solina", "Costa dos Coqueiros", "Orla", "Kora", "DUE", "Boulevard", "Vila Matilde",
            "Tropí", "Reci", "Naturê", "Costa do Mar", "Costa Azul", "NoMar", "Praia", "Veja 2", "Cais"]
CC_TIPO = {c: ("Lançamento" if c in ("Kora", "Solina") else "Institucional" if c in ("DUE", "Reci", "Veja 2") else "Estoque") for c in CC_CANON}
SEM_CL = "(sem classificação)"
SEM_VB = "(sem verba)"
# quase iguais unificados com aprovação do Alexandre em 30/10/2026
NEAR = {"relacionamento": "relacionamento com o cliente", "exclusive praia": "praia exclusive"}
IMOB_ALIAS = {
    "ACNO CONSULTORIA LTDA": "ACNO Consultoria (Hub Nogueira)",
    "COSTA E LUANNA INTERMEDIACOES IMOBILIARIAS LTDA": "Costa e Luanna",
    "HUB NOGUEIRA CORRETORES DE IMOVEIS LTDA": "Hub Nogueira",
    "SOLIDA IMOBILIARIA LTDA": "Sólida",
    "CENTRAL DE VENDAS INTELIGENCIA IMOBILIARIA": "Central de Vendas",
    "P e B ADMINISTRACOES BENS LTDA": "P e B Administrações (Paulo Miranda)",
    "AXIS INTELIGENCIA IMOBILIARIA LTDA": "Axis Inteligência Imobiliária",
    "TOCCA ONZE": "Tocca Onze",
    "Imobiliária Marcos Trigueiro Ltda.": "Marcos Trigueiro",
    "GUILHERME DANTAS INTERMEDIACAO IMOBILIARIA LTDA": "Guilherme Dantas",
    "ADALBERTO LIMA INVESTIMENTOS IMOBILIARIOS LTDA": "Adalberto Lima",
    "ACHEI NEGOCIOS IMOBILIARIOS LTDA": "Achei Negócios Imobiliários",
    "FONSECA PAES SERVICOS DE CORRETAGEM E AVALIACAO DE IMOVEIS EIRELI": "Fonseca Paes",
    "FÉLIX, NUNES E MELO CONSULTORIA IMOBILIÁRIA LTDA": "Félix, Nunes e Melo",
    "SOLUCOESCOMERCIAISEIMOBILIARIASLTDA": "Soluções Comerciais e Imobiliárias",
    "SOLUCOES COMERCIAIS E IMOBILIARIASLTDA": "Soluções Comerciais e Imobiliárias",
    "HOUSE CONSULTORIA IMOBILIARIA LTDA": "House Consultoria",
    "Jairo Rocha Consultoria Imobiliária Ltda.": "Jairo Rocha",
    "VALERÃO MENDES": "Valerão Mendes",
    "FELIPPE AIRES INTELIGENCIA IMOBILIARIA LTDA": "Felippe Aires",
    "PLACE BROKERS NEGOCIOS IMOBILIARIOS": "Place Brokers",
    "FELIPE RIBEIRO INTERMEDIACAO IMOBILIARIA LTDA": "Felipe Ribeiro",
}
EMP_TO_CC = {"Costa Dos Coqueiros": "Costa dos Coqueiros", "Tropi": "Tropí", "Nomar": "NoMar", "Vila Matilda": "Vila Matilde"}


class Falha(Exception):
    pass


def sa(s):
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def ws_(s):
    return re.sub(r"\s+", " ", str(s)).strip()


def brl(v):
    s = f"{v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return "R$ " + s


def brlc(v):
    a = abs(v)
    if a >= 1e6:
        return "R$ " + f"{v/1e6:,.1f}".replace(",", "X").replace(".", ",").replace("X", ".") + " mi"
    if a >= 1e3:
        return "R$ " + f"{v/1e3:,.1f}".replace(",", "X").replace(".", ",").replace("X", ".") + " mil"
    return brl(v)


def pct(x, d=1):
    return f"{x*100:.{d}f}".replace(".", ",") + "%"


def num(v):
    return float(v) if isinstance(v, (int, float)) and not isinstance(v, bool) else None


def lista(xs):
    xs = list(xs)
    return xs[0] if len(xs) == 1 else ", ".join(xs[:-1]) + " e " + xs[-1]


class Canon:
    """Agrupa grafias que diferem só em maiúscula/espaço (+ quase iguais aprovados). Rótulo = grafia mais usada,
    com a primeira letra maiúscula."""

    def __init__(self, near=None):
        self.near = near or {}
        self.cnt = collections.defaultdict(collections.Counter)

    def key(self, v):
        if v is None or not ws_(v):
            return None
        k = ws_(v).lower()
        return self.near.get(k, k)

    def add(self, v):
        k = self.key(v)
        if k:
            self.cnt[k][ws_(v)] += 1
        return k

    def label(self, k):
        best = self.cnt[k].most_common()
        cand = [s for s, _ in best if s[:1].isupper()] or [best[0][0]]
        s = cand[0]
        return s if s.isupper() else s[:1].upper() + s[1:]

    def variants(self):
        return {self.label(k): sorted(c) for k, c in self.cnt.items() if len(c) > 1}


def canon_cc(v):
    if v is None or not str(v).strip():
        return None
    k = sa(str(v).strip()).lower()
    for c in CC_CANON:
        if sa(c).lower() == k:
            return c
    raise Falha(f"centro de custo desconhecido na aba 7: {v!r}")


def header_map(ws, row=6):
    h = {}
    for c in range(1, ws.max_column + 1):
        v = ws.cell(row, c).value
        if v is not None and ws_(v):
            h[sa(ws_(v)).lower()] = c
    return h


def colopt(h, *names):
    for n in names:
        k = sa(n).lower()
        if k in h:
            return h[k]
    return None


def col(h, *names):
    for n in names:
        k = sa(n).lower()
        if k in h:
            return h[k]
    raise Falha(f"coluna não encontrada na aba 7: {names[0]!r} (cabeçalho: {sorted(h)})")


def parse(xlsx, data_txt, hoje=None):
    wb = openpyxl.load_workbook(xlsx, data_only=True)
    wf = openpyxl.load_workbook(xlsx, data_only=False)
    need = ["1. Visão Geral", "2. VGV 2025 x 2026 MARKETING", "4. Imobiliárias", "5.Sintta", "6. Controle Verbas", "7. Base de Dados"]
    for n in need:
        if n not in wb.sheetnames:
            raise Falha(f"aba ausente: {n!r}")
    ws = wb["7. Base de Dados"]
    h = header_map(ws)
    C = dict(comp=col(h, "Comp."), cl=col(h, "Classificação", "Classificação Correta"),
             vb=col(h, "Verba"), fo=col(h, "Fornecedor"), ds=col(h, "Descritivo"), ccf=col(h, "CC Fat."),
             ccd=col(h, "CC Dest."), v=col(h, "Valor (R$)"), si=col(h, "Nº Sienge"))
    clc, vbc, ccv = Canon(NEAR), Canon(NEAR), collections.Counter()
    recs, flags = [], collections.Counter()
    for r in range(7, ws.max_row + 1):
        g = lambda k: ws.cell(r, C[k]).value
        if all(g(k) is None for k in ("cl", "vb", "fo", "v")):
            if g("comp") is not None:
                flags["linha_vazia_com_data"] += 1
            continue
        comp = g("comp")
        if not isinstance(comp, datetime.datetime):
            raise Falha(f"linha {r}: competência inválida {comp!r}")
        if comp.year != 2026:
            raise Falha(f"linha {r}: competência fora de 2026 ({comp:%d/%m/%Y})")
        vbk = vbc.add(g("vb"))
        ccf, ccd = canon_cc(g("ccf")), canon_cc(g("ccd"))
        if ccf is None:
            raise Falha(f"linha {r}: CC Fat. vazio")
        for x in (g("ccf"), g("ccd")):
            if x is not None and ws_(x):
                ccv[ws_(x)] += 1
        si = g("si")
        rec = dict(row=r, m=comp.month, dia=comp.day, vbk=vbk, ccf=ccf, ccd=ccd,
                   clk=clc.add(g("cl")), fo=ws_(g("fo")) if g("fo") else "(sem fornecedor)",
                   ds=ws_(g("ds")) if g("ds") else "",
                   si="" if si is None else (str(int(si)) if isinstance(si, float) else ws_(si)))
        v = num(g("v"))
        if v is not None:
            rec["v"] = round(-v, 2)
        else:
            raw = g("v")
            rec["raw"] = "" if raw is None else str(raw)
        if comp.day != 1:
            flags["data_dia_diferente_de_1"] += 1
        recs.append(rec)
    rows = [x for x in recs if "v" in x]
    semv = [x for x in recs if "v" not in x]
    if not rows:
        raise Falha("aba 7 sem lançamentos com valor")
    for x in recs:
        x["cl"] = clc.label(x["clk"]) if x["clk"] else SEM_CL
        x["vb"] = vbc.label(x["vbk"]) if x["vbk"] else SEM_VB

    # ---------- abas consolidadas (lidas por posição; checadas pelo rótulo) ----------
    bad = []
    def rd(c):
        v = c.value
        if isinstance(v, str) and v.startswith("#"):
            bad.append(f"{c.parent.title}!{c.coordinate} ({v})")
            return None
        return num(v)
    a1, a1f = wb["1. Visão Geral"], wf["1. Visão Geral"]
    def expect(wsx, cell, txt):
        v = wsx[cell].value
        if v is None or sa(txt).lower() not in sa(ws_(v)).lower():
            raise Falha(f"{wsx.title}!{cell}: esperado {txt!r}, encontrado {v!r}")
    expect(a1, "B6", "VGV TOTAL"); expect(a1, "D6", "TOTAL DESPESAS"); expect(a1, "B12", "Janeiro"); expect(a1, "B23", "Dezembro")
    vgv26 = [rd(a1.cell(12 + i, 3)) for i in range(12)]
    a1desp = [rd(a1.cell(12 + i, 4)) or 0.0 for i in range(12)]
    a1card = rd(a1["D7"])
    a1tab = rd(a1["D24"])
    typed = [i for i in range(12) if not str(a1f.cell(12 + i, 4).value or "").startswith("=")]

    a2 = wb["2. VGV 2025 x 2026 MARKETING"]
    expect(a2, "B8", "Janeiro"); expect(a2, "C7", "VGV 2025")
    vgv25 = [rd(a2.cell(8 + i, 3)) or 0.0 for i in range(12)]
    vgv26_a2 = [rd(a2.cell(8 + i, 4)) for i in range(12)]
    tot25_decl = rd(a2["C20"])

    a4 = wb["4. Imobiliárias"]
    expect(a4, "D6", "VGV Vendas")
    vgv_imob = [rd(a4.cell(7 + i, 4)) or 0.0 for i in range(12)]

    a5 = wb["5.Sintta"]
    expect(a5, "C5", "Vendas"); expect(a5, "J5", "Meta")
    s_vendas = [rd(a5.cell(6 + i, 3)) or 0.0 for i in range(12)]
    s_line_pct = num(a5["E18"].value); s_v_tot = num(a5["C18"].value); s_d_tot = num(a5["D18"].value)
    metas = []
    for r in range(6, 30):
        nm, mt, rz = a5.cell(r, 9).value, rd(a5.cell(r, 10)), rd(a5.cell(r, 11))
        if nm is None:
            break
        if mt:
            metas.append({"nome": ws_(nm), "meta": mt, "realizado": rz or 0.0})

    a6, a6f = wb["6. Controle Verbas"], wf["6. Controle Verbas"]
    expect(a6, "B7", "Empreendimento"); expect(a6, "B28", "Empreendimento")
    verbas_emp, a6_typed = [], 0
    for r in range(8, 27):
        nm = a6.cell(r, 2).value
        if nm is None or not ws_(nm):
            break
        verbas_emp.append({"nome": EMP_TO_CC.get(ws_(nm), ws_(nm)), "verba": rd(a6.cell(r, 3)), "usado": rd(a6.cell(r, 4)) or 0.0})
        if not str(a6f.cell(r, 4).value or "").startswith("="):
            a6_typed += 1
    vendas = []
    hdr6 = [ws_(a6.cell(28, c).value or "") for c in range(1, 32)]
    for r in range(29, 60):
        nm = a6.cell(r, 2).value
        if nm is None or not ws_(nm):
            break
        nome = EMP_TO_CC.get(ws_(nm), ws_(nm))
        vg = [round(rd(a6.cell(r, 4 + 2 * i)) or 0.0, 2) for i in range(12)]
        uh = [int(rd(a6.cell(r, 5 + 2 * i)) or 0) for i in range(12)]
        unid = rd(a6.cell(r, 3))
        vendas.append({"nome": nome, "unid": int(unid) if unid else None, "vendas": int(rd(a6.cell(r, 29)) or 0),
                       "estoque": int(rd(a6.cell(r, 30)) or 0), "vgv": vg, "uh": uh,
                       "tipo": "Lançamento" if nome in ("Kora", "Solina") else "Estoque"})
    if hdr6[28] != "Total de Vendas" or hdr6[29] != "Estoque":
        raise Falha(f"aba 6: colunas de vendas/estoque mudaram ({hdr6[28]!r}, {hdr6[29]!r})")
    a6_tot = [rd(a6.cell(29 + len(vendas), 4 + 2 * i)) for i in range(12)]

    # ---------- período ----------
    datetime.datetime.strptime(data_txt, "%d/%m/%Y %H:%M")  # valida o formato
    # status do mês (realizado / em curso / provisão) pela data da atualização, horário de Recife
    dt = hoje or (datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None) - datetime.timedelta(hours=3))
    if dt.year == 2026:
        CUR = dt.month
    else:
        CUR = 13 if dt.year > 2026 else 0
    REAL = min(12, CUR - 1)
    launched = [vgv26[i] for i in range(12) if i + 1 <= REAL and vgv26[i]]
    med = statistics.median(launched) if launched else 0
    vgv_ok = [bool(i + 1 <= REAL and vgv26[i] and vgv26[i] >= 0.05 * med) for i in range(12)]

    # ---------- dimensões compactas ----------
    def dimsort(vals):
        return sorted(vals, key=lambda x: (sa(x).lower(), x))
    CLS = dimsort({x["cl"] for x in recs})
    vtot = collections.defaultdict(float)
    for x in rows:
        vtot[x["vb"]] += x["v"]
    VERBAS = sorted({x["vb"] for x in recs}, key=lambda k: (-vtot.get(k, 0), sa(k).lower()))
    FORN = dimsort({x["fo"] for x in rows})
    CCS = [c for c in CC_CANON if any(x["ccf"] == c or x["ccd"] == c for x in rows)]
    CI, FI, CCI = ({v: i for i, v in enumerate(a)} for a in (CLS, FORN, CCS))
    # posições 5 (sub) e 6 (classe) ficam fixas em -1 e 0: essas colunas não são usadas
    L = [[x["m"], VERBAS.index(x["vb"]), CCI[x["ccf"]], CCI[x["ccd"]] if x["ccd"] else -1, CI[x["cl"]],
          -1, 0, FI[x["fo"]], x["v"], x["row"], x["si"], x["ds"],
          0 if x["dia"] == 1 else x["dia"]] for x in rows]
    imob = {str(FI[f]): a for f, a in IMOB_ALIAS.items() if f in FI}
    imob_novos = sorted({x["fo"] for x in rows if re.search(r"imobili", sa(x["cl"]).lower()) and x["fo"] not in IMOB_ALIAS
                         and re.search(r"IMOBILI|CORRET|BROKER|NEGOCIOS IMOB", sa(x["fo"]).upper()) and not re.search(r"ASSOCIACAO|SINDICATO|CONSELHO", sa(x["fo"]).upper())})
    SV = [{"row": x["row"], "m": x["m"], "verba": x["vb"], "classif": x["cl"], "forn": x["fo"], "desc": x["ds"], "raw": x["raw"]} for x in semv]

    # ---------- conciliação com a aba 1 ----------
    tot = round(sum(x["v"] for x in rows), 2)
    base_m = [round(sum(x["v"] for x in rows if x["m"] == i + 1), 2) for i in range(12)]
    base_vb = {v: round(sum(x["v"] for x in rows if x["vb"] == v), 2) for v in VERBAS}
    rc_card = a1card is not None and abs(tot - a1card) < 0.01

    # ---------- qualidade dos dados (tudo calculado desta planilha) ----------
    qi = []
    def Q(sev, tit, txt, acao):
        qi.append([sev, tit, txt, acao])
    if not rc_card:
        Q("C", "Base não bate com o card Total Despesas", f"A aba 7 soma {brl(tot)} e o card Total Despesas da aba 1 mostra {brl(a1card or 0)} (diferença de {brl(tot-(a1card or 0))}). O painel usa a aba 7.", "Conferir a fórmula do card e a base antes de usar a aba 1 em apresentações.")
    sem = [x for x in recs if x["cl"] == SEM_CL or x["vb"] == SEM_VB]
    if sem:
        sv = sum(x.get("v", 0) for x in sem)
        Q("A", "Lançamentos sem verba ou classificação", f"{len(sem)} lançamento{'s' if len(sem)>1 else ''} ({brl(sv)}) com Verba ou Classificação vazia na aba 7 (linhas {', '.join(str(x['row']) for x in sem)}). No painel aparecem como “{SEM_VB}” / “{SEM_CL}”.", "Preencher as colunas nessas linhas.")
    # mês fechado sem VGV válido, ou mês em curso com VGV lançado mas suspeito (< 5% da mediana)
    nolaunch = [i for i in range(12) if base_m[i] > 0 and ((i + 1 <= REAL and not vgv_ok[i]) or (i + 1 == CUR and vgv26[i] and vgv26[i] < 0.05 * med))]
    if nolaunch:
        partes = [f"{MESL[i]} ({brl(vgv26[i])})" if vgv26[i] else f"{MESL[i]} (vazio)" for i in nolaunch]
        Q("C", "VGV de " + lista([MESL[i] for i in nolaunch]) + " não lançado",
          f"A aba 1 registra VGV de {lista(partes)}. Meses sem VGV, com VGV abaixo de 5% da mediana dos meses lançados ou ainda em curso ficam fora de toda razão despesa ÷ VGV.",
          "Lançar o VGV do mês (fechamento CV CRM).")
    dif_m = [i for i in range(12) if abs(a1desp[i] - base_m[i]) >= 0.01]
    if dif_m:
        tp = [i for i in dif_m if i in typed]
        Q("C", "Despesas mensais da aba 1 diferentes da base",
          "Na tabela mensal da aba 1, " + "; ".join(f"{MESL[i]} {brl(a1desp[i])} × base {brl(base_m[i])} ({'+' if a1desp[i]>base_m[i] else ''}{brl(a1desp[i]-base_m[i])})" for i in dif_m) + "."
          + (f" Célula{'s' if len(tp)>1 else ''} sem fórmula: {', '.join('D'+str(12+i) for i in tp)}." if tp else "")
          + (f" A tabela soma {brl(a1tab)}; pela base, {brl(tot)}." if a1tab is not None else ""),
          "Restaurar a fórmula SUMIFS nas células da tabela mensal da aba 1.")
    s25 = round(sum(vgv25), 2)
    if tot25_decl is not None and abs(tot25_decl - s25) > 1:
        ytd = [i for i in range(12) if vgv_ok[i]]
        cres = (sum(vgv26[i] for i in ytd) / sum(vgv25[i] for i in ytd) - 1) if ytd else None
        Q("A", "Total de VGV 2025 não bate com os meses",
          f"A aba 2 declara {brl(tot25_decl)} para 2025, mas os 12 meses somam {brl(s25)}." + (f" Nos meses com VGV de 2026 lançado ({MESES[ytd[0]].lower()}–{MESES[ytd[-1]].lower()}) o crescimento é de {'+' if cres>=0 else ''}{pct(cres)}." if cres is not None else ""),
          "Trocar o total por fórmula e comparar períodos iguais.")
    dv = []
    for i in range(12):
        vals = {"aba 1": vgv26[i], "aba 2": vgv26_a2[i]}
        if i < 6 and a6_tot[i]:
            vals["aba 6"] = a6_tot[i]
        nums = {k: v for k, v in vals.items() if v}
        if len(nums) > 1 and max(nums.values()) - min(nums.values()) > 0.5:
            dv.append(f"{MESL[i]}: " + ", ".join(f"{brl(v)} ({k})" for k, v in nums.items()))
    if dv:
        Q("A", "VGV 2026 diferente entre as abas", "; ".join(dv) + ". O painel usa a aba 1.", "Definir uma fonte única (export de fechamento do CV CRM) e referenciar as abas a ela.")
    if bad:
        Q("A", "Células lidas pelo painel com erro", "O painel lê estas células e elas trazem erro de fórmula; o painel mostra esse valor vazio ou zerado (nada é estimado): " + ", ".join(bad[:20]) + (f" e mais {len(bad)-20}" if len(bad) > 20 else "") + ".", "Corrigir as fórmulas na planilha.")
    errs = {}
    for n in wb.sheetnames:
        k = sum(1 for row in wb[n].iter_rows() for c in row if isinstance(c.value, str) and re.match(r"#(VALUE|REF|N/A|DIV/0|NAME|NUM|NULL)", c.value))
        if k:
            errs[n] = k
    if errs:
        Q("A", "Fórmulas com erro na planilha", "; ".join(f"aba “{n}”: {k} células com erro (#VALUE!, #REF!…)" for n, k in errs.items()) + ". O painel não usa essas células: as despesas vêm da aba 7.", "Revisar as fórmulas dessas abas (as matrizes e rankings que somam por classificação).")
    rx = re.compile(r"R\$\s*:?\s*([\d.]+,\d{2})")
    cit = []
    valset = {round(x["v"], 2) for x in rows}
    for x in semv:
        mm = rx.search(x["ds"])
        if mm:
            v = float(mm.group(1).replace(".", "").replace(",", "."))
            if round(v, 2) not in valset:
                cit.append((x, v))
    if cit:
        Q("A", "Lançamentos sem valor com valor citado no descritivo",
          f"{len(cit)} lançamento{'s' if len(cit)>1 else ''} sem valor na coluna citam um valor no descritivo, sem outro lançamento de mesmo valor: "
          + "; ".join(f"linha {x['row']} ({MESES[x['m']-1].lower()}, {x['fo']}): {brl(v)}" for x, v in cit)
          + f" ({brl(sum(v for _, v in cit))} ao todo). Podem ter entrado rateados com outro valor ou estar fora do controle.",
          "Conferir com o Financeiro.")
    if s_v_tot and s_d_tot and s_line_pct is not None and abs(s_line_pct - s_d_tot / s_v_tot) > 0.0005:
        Q("M", "% Despesa/Receita da Sintta", f"A linha TOTAL da aba 5 mostra {pct(s_line_pct,2)}. A conta dos totais ({brl(s_d_tot)} ÷ {brl(s_v_tot)}) dá {pct(s_d_tot/s_v_tot,2)}.", "Corrigir a fórmula da linha TOTAL para a razão dos totais.")
    last = lambda arr: max([i for i, v in enumerate(arr) if v] or [-1])
    l1, l4, l6 = last([v if vgv_ok[i] else 0 for i, v in enumerate(vgv26)]), last(vgv_imob), last([sum(e["vgv"][i] for e in vendas) for i in range(12)])
    if l1 >= 0 and (l4 < l1 or l6 < l1):
        Q("M", "Aberturas de VGV defasadas", f"O VGV consolidado vai até {MESL[l1]}; a abertura por empreendimento (aba 6) vai até {MESL[l6] if l6>=0 else '—'} e a de imobiliárias (aba 4) até {MESL[l4] if l4>=0 else '—'}.", "Atualizar as aberturas na próxima carga.")
    Q("M", "Sem despesas de 2025", "A planilha só tem lançamentos de 2026; a aba 2 traz apenas o VGV de 2025. Não dá para comparar a despesa de marketing entre os dois anos.", "Incluir a base de despesas de 2025 (mesmo formato da aba 7).")
    nd = flags.get("data_dia_diferente_de_1", 0)
    if nd or flags.get("linha_vazia_com_data"):
        Q("O", "Datas de competência fora do dia 1", f"{nd} lançamentos têm data de competência fora do dia 1" + (f" e {flags.get('linha_vazia_com_data')} linhas vazias têm só a data" if flags.get('linha_vazia_com_data') else "") + ". O painel soma por mês, então os totais não mudam.", "Fixar a competência no dia 1.")
    if a6_typed:
        Q("O", "Verba por empreendimento digitada", f"Verba e utilizado da aba 6 são valores digitados ({a6_typed} linhas sem fórmula no utilizado), sem ligação com a base, e o período de acumulação não está declarado.", "Registrar na aba o período e a fonte do utilizado.")
    var = []
    for nome, cz in (("Verba", vbc), ("Classificação", clc)):
        vv = cz.variants()
        if vv:
            var.append(f"{nome}: " + "; ".join(f"{k} ({' / '.join('“'+s+'”' for s in v)})" for k, v in sorted(vv.items())))
    if var:
        Q("O", "Grafias unificadas no painel", ". ".join(var) + ".", "Usar lista suspensa (validação de dados) nessas colunas.")
    # coerência da taxonomia (só aponta; nada é reclassificado no painel)
    labs = {x["vb"] for x in recs}
    for a_, b_ in (("Mídia Digital", "Marketing Digital"),):
        if a_ in labs and b_ in labs:
            na = [x for x in recs if x["vb"] == a_]
            Q("O", f"Verbas parecidas: {a_} e {b_}", f"A aba 7 usa as duas: {a_} em {len(na)} lançamentos ({brl(sum(x.get('v',0) for x in na))}) e {b_} em {sum(1 for x in recs if x['vb']==b_)}. O painel mantém as duas separadas, como na planilha.", "Confirmar se são verbas diferentes ou se uma deve ser unificada na outra.")
    multi = collections.defaultdict(collections.Counter)
    for x in recs:
        if x["cl"] != SEM_CL:
            multi[x["cl"]][x["vb"]] += 1
    mm = {s: c for s, c in multi.items() if len(c) > 1}
    if mm:
        Q("O", "Classificações em mais de uma verba", "; ".join(f"{s}: " + ", ".join(f"{k} ({n})" for k, n in c.most_common()) for s, c in sorted(mm.items())) + ".", "Conferir se cada classificação deve pertencer a uma única verba.")
    docs = [(s, sum(multi[s].values())) for s in ("NF", "Verba") if s in multi]
    if docs:
        Q("O", "Classificações genéricas", "Classificações que não descrevem o tipo de despesa: " + ", ".join(f"“{s}” ({n} lançamentos)" for s, n in docs) + ".", "Trocar por uma classificação do tipo de despesa (ex.: leads, consultoria).")
    txt = [x for x in semv if x["raw"] != ""]
    if txt:
        Q("O", "Valores digitados como texto", "; ".join(f"linha {x['row']}: “{x['raw']}”" for x in txt) + ". Ficam fora dos totais da planilha e do painel.", "Corrigir as células.")
    if imob_novos:
        Q("O", "Possíveis imobiliárias novas", "Fornecedores com classificação de imobiliária que ainda não estão na lista de parceiros do painel: " + ", ".join(imob_novos) + ".", "Avisar para incluir na lista de parceiros (até lá entram em “Outros fornecedores”).")

    ccd_vazio = sum(1 for x in rows if not x["ccd"])
    ccd_dif = sum(1 for x in rows if x["ccd"] and x["ccd"] != x["ccf"])
    real_txt = f"jan–{MESES[REAL-1].lower()}" if REAL >= 1 else "—"
    vms = [i for i in range(12) if vgv_ok[i]]
    out = {
        "meta": {"dataPlanilha": data_txt, "geradoEm": dt.strftime("%d/%m/%Y %H:%M"),
                 "real": REAL, "cur": CUR, "nLanc": len(rows), "nSemValor": len(semv),
                 "ccdVazio": ccd_vazio, "ccdDif": ccd_dif,
                 "vgvAte": MESES[vms[-1]].lower() if vms else None,
                 "conc": {"card": a1card, "base": tot, "ok": rc_card}},
        "meses": MESES, "verbas": VERBAS, "cls": CLS, "subs": [], "forn": FORN, "ccs": CCS,
        "ccTipo": [CC_TIPO[c] for c in CCS], "imob": imob, "L": L, "semValor": SV,
        "vgv26": vgv26, "vgvOk": vgv_ok, "vgv25": vgv25, "aba1Desp": a1desp, "vgvImob": vgv_imob,
        "vendasEmp": vendas, "verbasEmp": verbas_emp,
        "sintta": {"vendas": s_vendas, "metas": metas}, "qi": qi, "flags": dict(flags),
    }
    resumo = {"total": tot, "n": len(rows), "semValor": len(semv), "card": a1card, "conc_ok": out["meta"]["conc"]["ok"],
              "vb": base_vb, "real": REAL, "cur": CUR, "classes": len(CLS), "verbas": len(VERBAS), "qi": len(qi),
              "semClass": len(sem), "imob_novos": imob_novos}
    return out, resumo


DATA_RE = re.compile(r'(<script type="application/json" id="fin-data">)(.*?)(</script>)', re.S)
SIG = ("L", "semValor", "vgv26", "vgvOk", "vgv25", "aba1Desp", "vgvImob", "vendasEmp", "verbasEmp", "sintta", "qi", "cls", "subs", "forn", "ccs", "imob")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("xlsx"); ap.add_argument("painel"); ap.add_argument("saida"); ap.add_argument("--data", required=True)
    ap.add_argument("--force", action="store_true", help="gera mesmo sem mudança nos dados")
    a = ap.parse_args()
    try:
        data, rs = parse(a.xlsx, a.data)
        page = open(a.painel, encoding="utf-8").read()
        m = DATA_RE.search(page)
        if not m:
            raise Falha("bloco fin-data não encontrado no painel")
        try:
            old = json.loads(m.group(2).replace("<\\/", "</"))
        except Exception:
            old = {}
        same = all(old.get(k) == json.loads(json.dumps(data[k])) for k in SIG) and (old.get("meta", {}).get("real"), old.get("meta", {}).get("cur")) == (data["meta"]["real"], data["meta"]["cur"])
        line = (f"base {data['meta']['dataPlanilha']} · {rs['n']} lançamentos · {brl(rs['total'])} · card aba 1 {brl(rs['card'] or 0)} "
                f"({'confere' if rs['conc_ok'] else 'DIVERGE'}) · {rs['verbas']} verbas · {rs['classes']} classificações · "
                f"realizado até {MESES[rs['real']-1] if rs['real']>=1 else '—'} · {rs['qi']} apontamentos de qualidade")
        if same and not a.force:
            print("UNCHANGED | " + line)
            return
        js = json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
        new = page[:m.start(2)] + js + page[m.end(2):]
        open(a.saida, "w", encoding="utf-8").write(new)
        print("CHANGED | " + line)
        print("verbas: " + " · ".join(f"{k} {brl(v)}" for k, v in rs["vb"].items()))
        if rs["semClass"]:
            print(f"aviso: {rs['semClass']} lançamentos sem verba ou classificação")
        if rs["imob_novos"]:
            print("aviso: possíveis imobiliárias novas: " + "; ".join(rs["imob_novos"]))
        if not rs["conc_ok"]:
            print("aviso: conciliação com a aba 1 diverge (publicar mesmo assim e avisar)")
    except Falha as e:
        print(f"FALHOU: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
