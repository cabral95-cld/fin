# Painel Controle Financeiro de Marketing — DUE Incorporadora

Código do painel publicado como artifact no Claude. **Este repositório não contém dados**: a planilha, o `data.json` e o `index.html` montado ficam fora (ver `.gitignore`).

## Peças
- `sync_fin.py` — lê a planilha do Financeiro (aba "7. Base de Dados", colunas *Classificação Correta* e *Sub Classificação (Correta)*; VGV das abas 1, 2, 4, 5 e 6), concilia com a aba 1, recalcula os apontamentos de qualidade e troca só o bloco `fin-data` do painel.
  `python3 -I sync_fin.py planilha.xlsx painel.html painel_novo.html --data "DD/MM/AAAA HH:MM"` → `UNCHANGED` · `CHANGED` · `FALHOU`.
- `build.py` — monta `index.html` a partir de `index.src.html` + `app.js` + fontes Outfit + logo: `python3 build.py planilha.xlsx "DD/MM/AAAA HH:MM"`.
- `tests/check_fin.cjs` — teste headless (Playwright) antes de publicar: `node tests/check_fin.cjs index.html` → `CHECK OK`.
- `tests/qa*.py` — QA visual (capturas, relatório, PDF, copiar imagem).

## Dependências
`pip install openpyxl` · `cd libs && npm ci` (html-to-image 1.11.11, jsPDF 2.5.1, @fontsource/outfit) · Playwright/Chromium para os testes.

## Atualização
Tarefa agendada todo sábado às 8h (Recife): baixa a planilha do Google Drive, roda `sync_fin.py` e `check_fin.cjs` e republica o artifact se os dados mudaram.
