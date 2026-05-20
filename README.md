# Agenda Josielly

App web instalavel em formato Kanban para agenda pessoal e de trabalho.

## Como abrir

Abra `index.html` no navegador.

Tambem pode abrir por servidor local:

```bash
node dev-server.js
```

Depois acesse `http://127.0.0.1:4173`.

Para instalar como aplicativo no celular ou em outro computador, publique a pasta em um servico HTTPS, como GitHub Pages, Netlify ou Vercel. Depois abra o link no celular e use a opcao "Adicionar a tela inicial".

## Recursos

- Kanban com Hoje, Semana, Acompanhamentos e Finalizado.
- Calendario mensal clicavel com compromissos do dia.
- Modo claro e modo escuro.
- Calendario Gmail pessoal e calendario corporativo por compromisso.
- Criar, editar, excluir, buscar e arrastar compromissos.
- Checklist de finalizado.
- Upload da foto clicando no quadro da foto.
- Dados salvos no navegador usado.

## Acesso em qualquer lugar

Veja o arquivo `PUBLICAR_E_SINCRONIZAR.md`.

Para publicar no Vercel, veja `VERCEL.md`.

## Calendarios

- `Exportar` gera um arquivo `.ics` para importar no Google Agenda, Outlook ou Apple Calendar.
- `Importar` le arquivos `.ics` exportados de outras agendas.
- `Google Agenda` e `Outlook` abrem a criacao de evento com base no proximo compromisso.

Sincronizacao automatica em duas vias com e-mail particular e e-mail de trabalho exige credenciais OAuth do Google/Microsoft e um backend publicado.
