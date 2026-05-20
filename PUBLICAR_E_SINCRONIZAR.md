# Publicar e sincronizar a Agenda Josielly

Para acessar a agenda de qualquer computador e instalar no iPhone, ela precisa sair do modo local e ir para a nuvem.

## O que precisa existir

1. **Site publicado em HTTPS**
   - Vercel, Netlify ou GitHub Pages.
   - Isso permite abrir a agenda por um link tipo `https://agenda-josielly...`.
   - No iPhone, esse link pode virar aplicativo usando **Compartilhar > Adicionar à Tela de Início**.

2. **Banco de dados em nuvem**
   - Recomendo **Supabase**.
   - Ele salva compromissos, rotinas, anexos e preferências fora do navegador.
   - Assim, o que for alterado em um computador aparece no iPhone e em outros computadores.

3. **Login**
   - Pode ser por e-mail/senha.
   - Depois podemos evoluir para login Google/corporativo.

## Caminho recomendado

### Fase 1: publicar como aplicativo

Publicar a pasta `AGENDA` em um serviço HTTPS.

Resultado:
- abre de qualquer computador;
- instala no iPhone como aplicativo;
- ainda salva localmente se não houver banco configurado.

### Fase 2: sincronizar dados

Criar um projeto no Supabase com tabelas para:

- `appointments`: compromissos/agendamentos;
- `routines`: demandas e acompanhamentos;
- `attachments`: arquivos e prints;
- `profile`: nome, foto e preferências.

Resultado:
- dados sincronizados entre dispositivos;
- backups na nuvem;
- mesma agenda no computador e no iPhone.

### Fase 3: integração com Gmail/corporativo

Depois da agenda estar online, conectar Google Calendar e calendário corporativo.

Resultado:
- importar compromissos externos;
- exportar/sincronizar eventos;
- evitar conflitos com agenda do e-mail.

## Observação importante

Hoje os dados estão salvos no navegador usando `localStorage`.
Isso funciona para testar, mas não sincroniza entre aparelhos.

Para ter todas as atualizações em qualquer lugar, precisamos implementar a Fase 2.
