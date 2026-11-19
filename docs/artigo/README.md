# Artigo do projeto final

Documentação no formato de artigo de conferência (layout SBC), exigida pela disciplina.

- `artigo.tex`: texto do artigo
- `sbc-template.sty`: layout SBC (A4, Times 12pt, coluna única)
- `figuras/`: capturas de tela usadas no artigo
- `artigo.pdf`: versão compilada

## Antes de entregar

- Preencher os nomes de todos os integrantes no `\author` do `artigo.tex` (procure `TODO(grupo)`).
- Recompilar e conferir que o PDF entregue no Canvas é igual ao impresso.

## Como compilar

Com Docker, sem instalar LaTeX:

```bash
cd docs/artigo
docker run --rm -u "$(id -u):$(id -g)" -v "$PWD":/doc -w /doc texlive/texlive:latest-medium latexmk -pdf artigo.tex
```

Também funciona no Overleaf: envie a pasta `docs/artigo` inteira e compile `artigo.tex` com pdfLaTeX.
