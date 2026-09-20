# Gestão de Obra — Especificação para migração (Bolt / backend real)

> Este documento descreve o sistema que já existe hoje (protótipo funcional em
> HTML/JS, sem servidor) e o que precisa ser construído de verdade no Bolt
> para resolver as limitações que esse protótipo **não consegue** resolver:
> múltiplos usuários com permissões reais, dados sincronizados entre
> dispositivos e isolamento de dados garantido por servidor (não só por
> convenção no código).

## 1. O que o sistema faz

Gestão de projetos de reforma/obra (uso inicial: Noremati Pilates Clássico,
mas desenhado para múltiplos projetos de tipos variados — apartamento, loja,
studio comercial etc.). Cada projeto acompanha etapas de obra, profissionais
contratados, materiais, equipamentos e o financeiro consolidado, com
progresso e custo sempre calculados a partir dos vínculos reais — nunca
digitados à mão soltos.

## 2. Por que está migrando

O protótipo atual roda inteiro no navegador (um arquivo `.html`), com os
dados salvos em `localStorage`. Isso significa:

- **Sem login real.** Não existe "usuário", só o navegador de quem abriu o
  arquivo. Qualquer um com o arquivo (ou o link) tem acesso a tudo.
- **Sem sincronização.** Cada navegador/dispositivo tem seus próprios dados,
  isolados. Não há como duas pessoas colaborarem no mesmo projeto em tempo
  real, nem acessar os dados de outro aparelho.
- **Sem controle de acesso por papel.** Tudo que existe no arquivo hoje é
  visível e editável por quem quer que o abra.

Essas três coisas **exigem backend** (banco de dados + autenticação +
autorização no servidor) — não são resolvíveis só com código client-side, e
é exatamente isso que o Bolt precisa entregar.

## 3. Papéis de usuário (autenticação e permissão real)

Dois perfis, com controle de acesso **no servidor** (nunca só escondendo
botões na tela):

### Admin (dono do sistema — ex.: Paulo Henrique)
- Vê e gerencia **todos os projetos** de todos os operadores.
- Vê e gerencia a lista **global/base** de categorias e fornecedores.
- Pode vincular ("atrelar") fornecedores e categorias globais a projetos
  específicos quando fizer sentido.
- Acesso irrestrito de leitura e escrita em tudo.

### Operador (ex.: uma arquiteta, um mestre de obra)
- Pode criar projetos.
- **Um projeto pode ter vários operadores vinculados ao mesmo tempo** (ex.:
  a arquiteta e o mestre de obra no mesmo projeto, cada um com login
  próprio). Não é "um projeto = um dono" — é uma relação muitos-para-muitos
  entre operadores e projetos.
- Dentro de qualquer projeto ao qual esteja vinculado, o operador pode
  cadastrar: etapas de obra, profissionais, materiais, equipamentos,
  fornecedores e categorias extras. Todos os operadores vinculados a um
  projeto enxergam e editam os mesmos dados dele (não há hierarquia entre
  operadores de um mesmo projeto neste momento — arquiteta e mestre de obra
  têm o mesmo nível de acesso dentro do projeto).
- **Só enxerga os projetos aos quais está vinculado** — nunca projetos de
  outros operadores/outros times. Isso precisa ser garantido por regra no
  banco (ex.: Row Level Security no Supabase, via uma tabela de vínculo
  `projeto_operadores` com `projeto_id` + `usuario_id`), não só por filtro
  na tela.

> Ponto em aberto que ainda precisa de decisão sua: quem pode vincular um
> operador a um projeto — só o Admin, ou um operador já vinculado também
> pode convidar/adicionar outro (ex.: a arquiteta adiciona o mestre de obra
> sem precisar de você)? Enquanto não decidir, o padrão mais seguro é só o
> Admin poder vincular/desvincular operadores de um projeto.

## 4. Modelo de dados

Cada projeto isola completamente os dados abaixo (nenhum dado de um projeto
deve aparecer, nem por engano, em outro):

| Entidade | Campos principais | Regra importante |
|---|---|---|
| **Projeto** | nome, tipo (Apartamento/Studio/Loja/etc.), status, cliente/empresa, responsável, endereço, orçamento, datas | vinculado a um ou mais operadores (tabela de vínculo `projeto_operadores`) |
| **Etapa de obra** | nome, categoria, prioridade, status, progresso, dependência, datas | **Custo, valor pago e responsável NÃO são digitados** — são sempre calculados a partir dos vínculos abaixo |
| **Profissional** | nome, serviço, telefone, e-mail, status | dados de contato fixos; valores ficam nos "Trabalhos" |
| **Trabalho** (vínculo profissional↔etapa) | profissional, etapa, valor cobrado, valor pago, forma de pagamento, parcelas, chave PIX, status | um profissional pode ter **vários** trabalhos, um por etapa (ex.: mesmo pedreiro cobrando separado pela demolição e pela reforma do banheiro). **Etapa é obrigatória, sem exceção.** |
| **Material** | nome, categoria, fornecedor, quantidade, unidade, valor unitário, valor pago, status | **Etapa vinculada é obrigatória, sem exceção** |
| **Equipamento** | nome, quantidade, valor, fornecedor, datas de compra/entrega, status | **Etapa vinculada é obrigatória, sem exceção** |
| **Fornecedor** | nome, telefone, e-mail, site/Instagram | **isolado por projeto** — um fornecedor de equipamento de pilates não deve aparecer num projeto de loja de carro, e vice-versa |
| **Categoria** (de obra e de material) | nome | **base global** (mesma lista sugerida em todo projeto novo, administrada pelo Admin) **+ categorias extras que cada projeto pode criar só para si** |

### Regra inegociável confirmada com a cliente
> Todo custo (trabalho de profissional, material ou equipamento) **precisa**
> estar vinculado a uma etapa de obra. Não existe custo "avulso" solto sem
> etapa — mesmo que isso signifique cadastrar a etapa primeiro antes de
> comprar um equipamento. Essa regra não tem exceção, nem para equipamento
> comprado antes da etapa existir no cronograma.

### Cálculos derivados (nunca digitados diretamente)
- Custo contratado de uma etapa = soma de todos os trabalhos + materiais +
  equipamentos vinculados a ela.
- Valor pago de uma etapa = soma dos valores pagos desses mesmos vínculos.
- Responsável de uma etapa = lista dos profissionais vinculados a ela via
  "Trabalho".
- Resumo financeiro do projeto (dashboard) = soma de tudo isso, mostrando:
  Valor a Pagar, Valor de Materiais, Valor de Mão de obra, Valor de
  Equipamentos já comprados. **Não existe "Administrativo pago"** — foi
  removido de propósito por não fazer sentido no fluxo.

## 5. Navegação / telas

Ordem do menu lateral, agrupado:
1. Dashboard
2. **Cadastros:** Obra, Profissionais, Materiais, Equipamentos
3. **Acompanhamento:** Cronograma, Financeiro
4. Configurações (contém: dados do projeto, categorias, fornecedores e
   backup/exportação de dados)

## 6. Comportamentos de UX a preservar

- **Categoria e fornecedor com cadastro rápido inline**: ao criar uma etapa
  ou material, se a categoria/fornecedor não existir ainda, dá pra cadastrar
  ali mesmo sem sair do formulário (sem `prompt()` do navegador — um
  mini-formulário embutido).
- **Progresso sugerido pelo status da etapa** (o usuário pode sobrescrever
  manualmente depois):
  - Não iniciado → 0%
  - Cotação → 20%
  - Contratado → 40%
  - Em andamento → 50%
  - Concluído → 100%
  - Bloqueado → **não sugere nada** (mantém o progresso manual atual, porque
    uma etapa pode travar em qualquer % de conclusão e forçar 10% apagaria
    informação real)
- **Mensagens de sucesso** (ex.: "backup restaurado", "salvo com sucesso")
  aparecem como notificação temporária (toast), não bloqueiam a tela.
- **Mensagens de validação/erro** (ex.: "selecione a etapa vinculada")
  continuam bloqueantes — o usuário precisa resolver antes de continuar,
  porque isso já causou perda de dados no protótipo quando era só um aviso
  discreto.
- Interface responsiva (funciona bem em celular), com tabelas roláveis
  horizontalmente quando têm muitas colunas.

## 7. Requisitos de segurança para o Bolt implementar

- **Autenticação real** (login com e-mail/senha ou provedor OAuth) — não
  reaproveitar nenhuma lógica de "perfil" do protótipo, que era só visual.
- **Autorização no banco**, não só na interface: um operador logado nunca
  deve conseguir ler ou escrever dados de outro operador via API, mesmo
  manipulando requisições diretamente (ex.: Row Level Security do
  Supabase, políticas por `user_id`/`owner_id` em cada tabela).
- **Sanitização de entrada** em todo campo de texto exibido depois em tela
  (nome de etapa, observações, nome de fornecedor etc.) — o protótipo tinha
  um ponto de XSS nesse tipo de campo que foi corrigido; não reintroduzir
  esse problema ao migrar.
- **Nenhum dado sensível em texto plano desnecessário** — senhas sempre via
  hash do próprio provedor de auth, nunca implementadas do zero.
- Exportar/restaurar backup (.json) pode continuar existindo como
  conveniência, mas deixa de ser a única forma de "levar os dados" de um
  lugar para o outro — com backend, os dados já ficam centralizados.

## 8. Fora de escopo para este documento

- Definição visual/de marca (cores, tipografia) — reaproveitar o que já
  existe no protótipo como referência de estilo, ajustável livremente.
- Relatórios/exportações adicionais além do resumo financeiro atual.
- Notificações (e-mail, WhatsApp) — não foi discutido ainda.

---
*Este README resume as decisões tomadas em conversas com a cliente sobre o
protótipo em `new.html`. Qualquer dúvida sobre uma regra específica, a
referência é o comportamento já implementado e testado nesse protótipo.*
