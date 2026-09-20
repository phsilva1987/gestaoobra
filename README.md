# Gestão da Reforma — Baseline funcional para implementação no Bolt

> **Status:** protótipo funcional consolidado.  
> **Fonte de verdade funcional e visual:** `index.html` da branch `main`.  
> **Objetivo da próxima fase:** transformar o protótipo atual em uma aplicação de produção com frontend componentizado, autenticação real, banco persistente, armazenamento de imagens e controle de acesso no servidor, **sem perder regras, fluxos, cálculos ou o layout já aprovado**.

## 1. Instrução principal para o Bolt

O `index.html` atual não é apenas uma referência visual: ele é a **especificação funcional executável** do produto.

Ao implementar a nova aplicação:

- **Não redesenhar arbitrariamente.**
- **Não remover funcionalidades existentes.**
- **Não alterar regras de negócio ou cálculos sem aprovação.**
- Preservar navegação, hierarquia visual, identidade, responsividade, textos importantes, estados, filtros, dashboards, formulários e fluxos já existentes.
- Reutilizar o comportamento validado antes de propor melhorias.
- Migrar de forma incremental: primeiro reproduzir fielmente, depois componentizar e conectar backend.
- Evitar overengineering, dependências desnecessárias e refatorações que não tragam benefício funcional claro.
- Toda mudança deve ser pequena, testável e reversível.

## 2. Produto

Sistema para gestão de reformas e obras. O uso inicial é o **Estúdio Noremati Pilates Clássico**, mas o produto deve suportar múltiplos projetos independentes, como apartamento, casa, loja, escritório, studio/comercial e outros.

Modelo central:

```text
Projeto
  └── Etapa / Obra
        ├── Trabalho / Profissional
        ├── Material
        └── Equipamento
              ↓
          Financeiro
```

O Dashboard, Cronograma e Financeiro são derivados dessas informações.

### Regra inegociável

> **Todo custo precisa estar vinculado a uma etapa da obra.**

Trabalho de profissional, material e equipamento nunca podem existir como custo avulso sem etapa. Se a etapa ainda não existir, ela deve ser cadastrada antes.

## 3. Baseline atual que deve ser preservado

O protótipo atual já contém e deve continuar contendo:

- múltiplos projetos;
- troca do projeto atual pelo seletor superior;
- imagem/capa individual por projeto;
- Dashboard por projeto;
- progresso geral e progresso por etapa;
- resumo financeiro;
- bloco **Atenção necessária**;
- **Próximos 7 dias**;
- **Saúde da reforma** responsiva;
- etapas/obra e checklist;
- profissionais;
- múltiplos trabalhos/vínculos de um profissional com etapas;
- materiais;
- equipamentos;
- cronograma;
- financeiro;
- fornecedores;
- categorias;
- configurações;
- relatórios existentes;
- backup e restauração JSON;
- filtros e estados existentes;
- navegação desktop e mobile;
- header superior sticky;
- sidebar desktop com rolagem independente quando necessário;
- tabelas responsivas/roláveis;
- notificações/toasts;
- validações bloqueantes para regras críticas.

Não reconstruir telas do zero sem antes reproduzir o comportamento da versão atual.

## 4. Identidade visual e UX

Preservar o estilo aprovado do protótipo: visual profissional, elegante, compacto, tons claros/creme/dourado, cards arredondados e boa hierarquia de informação.

### Imagem do projeto

A área visual no topo da sidebar, atualmente usada como identidade do projeto, deve exibir **a imagem cadastrada no projeto atual**.

Regras:

1. Cada projeto possui sua própria imagem/capa.
2. Ao trocar o projeto no seletor, a imagem deve mudar imediatamente.
3. A imagem ocupa somente a área já definida na sidebar e mantém o mesmo tamanho/layout.
4. A imagem não deve alterar o header nem outras áreas da aplicação.
5. Na versão de produção, armazenar o arquivo no **Supabase Storage** e persistir somente URL/path no projeto.
6. Deve existir preview, troca e remoção da imagem.
7. Definir fallback visual quando o projeto não possuir imagem.
8. Validar tipo e tamanho do arquivo antes do upload.

### Responsividade

Preservar desktop, tablet e mobile.

- Header continua sticky.
- Sidebar não pode esconder itens de navegação.
- Tabelas largas devem ter scroll horizontal interno, sem gerar overflow da página inteira.
- Cards devem usar `min-width: 0`/grid responsivo quando necessário.
- Dashboard não deve criar grandes espaços vazios desnecessários.
- **Saúde da reforma** deve crescer conforme o conteúdo e reorganizar indicadores automaticamente.
- Em telas menores, grids devem virar uma coluna quando necessário.
- Não usar alturas rígidas para conteúdo variável.

## 5. Dashboard

O Dashboard deve sempre refletir somente o projeto selecionado.

Preservar:

- indicadores/KPIs existentes;
- progresso da obra;
- lista completa de etapas no bloco de progresso, com rolagem interna quando necessário;
- resumo financeiro;
- Atenção necessária;
- Próximos 7 dias;
- Saúde da reforma.

### Progresso da obra

Não limitar artificialmente a sete etapas. Exibir todas dentro da área rolável.

### Saúde da reforma

No desktop, aproveitar a largura disponível: aproximadamente 35% para **Próximos 7 dias** e 65% para **Saúde da reforma**. Os indicadores internos devem usar grid adaptativo e aceitar novos indicadores sem deformar o layout. Tablet/mobile devem reorganizar automaticamente.

## 6. Modelo de dados recomendado

### Projeto
Campos mínimos:

- id;
- nome;
- tipo;
- status;
- cliente/empresa;
- responsável;
- endereço;
- orçamento;
- data inicial;
- data prevista/final;
- `cover_image_url` ou `cover_image_path`;
- created_at;
- updated_at.

### Etapa / Obra

- id;
- projeto_id;
- nome;
- categoria;
- prioridade;
- status;
- progresso;
- dependência;
- data inicial;
- data prevista/final;
- observações.

**Não persistir custo contratado, valor pago ou responsável como valores manuais quando forem derivados dos vínculos.**

### Profissional

- id;
- projeto_id;
- nome;
- serviço/especialidade;
- telefone;
- e-mail;
- status;
- observações.

### Trabalho

Representa o vínculo profissional ↔ etapa.

- id;
- projeto_id;
- etapa_id **obrigatório**;
- profissional_id;
- valor contratado/cobrado;
- valor pago;
- forma de pagamento;
- parcelas;
- chave PIX;
- status;
- datas/observações necessárias.

Um profissional pode possuir vários trabalhos em etapas diferentes.

### Material

- id;
- projeto_id;
- etapa_id **obrigatório**;
- nome;
- categoria;
- fornecedor;
- quantidade;
- unidade;
- valor unitário;
- valor pago;
- status;
- observações.

### Equipamento

- id;
- projeto_id;
- etapa_id **obrigatório**;
- nome;
- quantidade;
- valor;
- valor pago quando aplicável;
- fornecedor;
- data de compra;
- previsão/data de entrega;
- status;
- observações.

### Fornecedor

Fornecedor deve ser isolado por projeto.

- id;
- projeto_id;
- nome;
- telefone;
- e-mail;
- site/Instagram;
- observações.

### Categoria

Existem dois níveis:

- categorias globais/base administradas pelo Admin;
- categorias adicionais específicas do projeto.

Não poluir a base global quando o usuário criar uma categoria exclusiva de um projeto.

### Usuários e vínculo com projetos

Implementar relação muitos-para-muitos:

```text
usuarios
projetos
projeto_operadores
  projeto_id
  usuario_id
```

Um projeto pode possuir vários operadores e um operador pode participar de vários projetos.

## 7. Cálculos derivados

Os cálculos existentes são regra de negócio e não devem ser substituídos por valores digitados manualmente.

### Etapa

```text
Custo contratado =
  Trabalhos vinculados
+ Materiais vinculados
+ Equipamentos vinculados
```

```text
Valor pago =
  Valores pagos dos Trabalhos
+ Valores pagos dos Materiais
+ Valores pagos dos Equipamentos
```

Responsáveis da etapa = profissionais que possuem Trabalho vinculado àquela etapa.

### Projeto / Financeiro

Consolidar a partir dos registros reais do projeto e preservar os indicadores atuais, incluindo mão de obra, materiais, equipamentos, valor pago/a pagar, orçamento e imprevistos existentes no protótipo.

Evitar dupla contagem. Não criar valores financeiros paralelos que dupliquem Trabalho, Material ou Equipamento.

## 8. Status e progresso

Preservar a sugestão automática de progresso:

| Status | Progresso sugerido |
|---|---:|
| Não iniciado | 0% |
| Cotação | 20% |
| Contratado | 40% |
| Em andamento | 50% |
| Concluído | 100% |
| Bloqueado | manter valor atual |

O usuário pode ajustar manualmente quando o fluxo atual permitir.

Quando uma etapa/checklist atingir as condições de conclusão já implementadas no protótipo, preservar a automação existente de conclusão.

## 9. Navegação

Preservar os módulos existentes no protótipo e sua organização atual. A referência definitiva para nomes, ordem e comportamento é o `index.html`.

Principais áreas:

1. Dashboard
2. Projetos
3. Obra / Etapas
4. Profissionais
5. Materiais
6. Equipamentos
7. Cronograma
8. Financeiro
9. Configurações

Configurações concentra dados auxiliares do projeto, categorias, fornecedores e recursos administrativos/backup existentes.

## 10. UX dos formulários

Preservar:

- criação e edição;
- máscaras/formatação monetária brasileira;
- valores exibidos como `R$ 10.000,00`;
- dropdowns de categorias;
- dropdowns de fornecedores;
- criação rápida inline de categoria/fornecedor;
- vínculo obrigatório de custos com etapa;
- feedback de sucesso por toast;
- validação crítica bloqueante;
- confirmações antes de exclusões/ações destrutivas;
- filtros por projeto;
- atualização da interface após salvar;
- prevenção de perda silenciosa de dados.

Não usar `prompt()` como interface de cadastro.

## 11. Arquitetura alvo

Arquitetura recomendada para a implementação no Bolt:

```text
Frontend
  React + TypeScript
       │
       ├── Supabase Auth
       ├── Supabase PostgreSQL
       └── Supabase Storage
```

Pode utilizar a stack padrão atual do Bolt quando compatível, mas evitar adicionar frameworks/bibliotecas sem necessidade.

### Frontend

Componentizar progressivamente, por exemplo:

- AppShell;
- Sidebar;
- Header;
- ProjectSelector;
- ProjectImage;
- Dashboard;
- ProjectForm;
- Stage/Obra;
- Professionals;
- Materials;
- Equipment;
- Schedule;
- Finance;
- Settings;
- Modal/Form components;
- Toast/notifications.

Não é obrigatório seguir esses nomes; o importante é eliminar o modelo monolítico sem mudar comportamento.

### Estado

Não usar `localStorage` como banco principal em produção.

Pode ser usado apenas para preferências não sensíveis e temporárias, quando fizer sentido.

## 12. Supabase

### Auth

Implementar autenticação real com Supabase Auth.

Nunca implementar senha manualmente nem manter credenciais hardcoded no frontend.

### Database

PostgreSQL/Supabase passa a ser a fonte de verdade.

Todas as entidades de projeto devem carregar `projeto_id` quando aplicável.

Criar foreign keys e constraints para impedir registros órfãos.

Especialmente:

- Trabalho exige etapa;
- Material exige etapa;
- Equipamento exige etapa.

### Storage

Criar bucket apropriado para imagens dos projetos.

O banco guarda path/URL, não Base64.

Ao substituir/remover uma imagem, evitar arquivos órfãos quando possível.

### RLS

Row Level Security é obrigatória.

## 13. Perfis e permissões

### Admin

- acesso a todos os projetos;
- criar/editar projetos;
- vincular/desvincular operadores;
- administrar categorias globais;
- acesso administrativo completo.

### Operador

- vê somente projetos aos quais está vinculado;
- dentro desses projetos, pode operar os módulos permitidos;
- operadores do mesmo projeto trabalham sobre os mesmos dados.

Por padrão, até nova decisão, somente o **Admin** vincula/desvincula operadores.

A segurança deve estar no banco/RLS. Esconder um botão não é controle de acesso.

## 14. Segurança

Obrigatório:

- autenticação real;
- RLS;
- nenhuma secret/service-role key no frontend;
- variáveis de ambiente para configurações;
- validação server-side/banco para regras críticas;
- sanitização/escape de conteúdo exibido;
- evitar HTML inseguro derivado diretamente de dados do usuário;
- validação de upload;
- constraints e foreign keys;
- tratamento claro de erros;
- operações destrutivas com confirmação.

O protótipo usa bastante HTML dinâmico e handlers inline. Na migração, preferir componentes/event handlers do framework em vez de copiar esse padrão literalmente.

## 15. Migração dos dados atuais

O protótipo atual usa a chave de `localStorage`:

```text
norematiReforma
```

A implementação de produção deve permitir uma migração controlada dos dados existentes.

Estratégia recomendada:

1. exportar backup JSON pelo protótipo;
2. validar versão/estrutura;
3. importar para tabelas do Supabase;
4. mapear IDs e relações;
5. validar todos os vínculos de etapa;
6. comparar totais antes/depois;
7. manter o backup original intacto.

Não migrar dados silenciosamente sem validação.

## 16. Backup e restauração

Mesmo com backend, manter uma forma de exportação administrativa.

O backup não será mais o mecanismo principal de sincronização, mas continua útil para portabilidade e segurança operacional.

Restauração deve:

- validar o arquivo;
- exigir confirmação;
- informar impacto;
- evitar restauração parcial silenciosa;
- registrar erro claramente se falhar.

## 17. Estratégia de implementação no Bolt

Executar em fases. **Não tentar reescrever tudo de uma vez.**

### Fase 1 — Reprodução

- abrir e estudar `index.html`;
- mapear telas, dados, cálculos e eventos;
- reproduzir o visual e navegação;
- criar componentes sem mudar comportamento;
- validar desktop/tablet/mobile.

### Fase 2 — Backend

- configurar Supabase;
- criar schema;
- Auth;
- RLS;
- Storage;
- repositories/services de dados;
- substituir persistência local módulo a módulo.

### Fase 3 — Migração

- importar dados do backup atual;
- comparar contagens e totais;
- validar projetos;
- validar etapas;
- validar custos;
- validar imagens.

### Fase 4 — QA

Validar pelo menos:

- criar/trocar projeto;
- imagem muda com projeto;
- criar/editar/excluir etapa;
- checklist;
- progresso;
- profissional com múltiplos trabalhos;
- material com etapa obrigatória;
- equipamento com etapa obrigatória;
- categorias;
- fornecedores;
- financeiro sem dupla contagem;
- Dashboard;
- Cronograma;
- filtros;
- responsividade;
- permissões Admin/Operador;
- isolamento entre projetos;
- isolamento entre usuários;
- refresh/login/logout sem perda de dados.

## 18. Critérios de aceite

A migração só está concluída quando:

1. Nenhuma funcionalidade relevante do protótipo tiver desaparecido.
2. O layout permanecer reconhecível e fiel ao aprovado.
3. Os cálculos financeiros baterem com o protótipo para o mesmo conjunto de dados.
4. Todo custo possuir etapa.
5. Trocar projeto atualizar todos os módulos e a imagem do projeto.
6. Dados persistirem entre dispositivos/sessões autorizadas.
7. Dois operadores vinculados ao mesmo projeto enxergarem os mesmos dados.
8. Operador não conseguir acessar projeto sem vínculo, inclusive tentando acesso direto/API.
9. Admin conseguir administrar todos os projetos.
10. Não existirem credenciais sensíveis no frontend.
11. Desktop, tablet e mobile estiverem funcionais.
12. Não houver regressão no header sticky, sidebar, tabelas ou Dashboard.

## 19. O que não fazer

- Não apagar regras porque parecem redundantes.
- Não simplificar o modelo removendo o vínculo obrigatório com etapa.
- Não criar custo manual paralelo.
- Não usar apenas filtros de frontend como autorização.
- Não guardar imagem Base64 no banco como solução final.
- Não colocar service-role key no navegador.
- Não substituir a interface inteira por um template genérico.
- Não alterar cores/layout aprovado sem necessidade.
- Não introduzir várias bibliotecas para resolver problemas simples.
- Não migrar todos os módulos simultaneamente sem checkpoints.

## 20. Débito técnico conhecido do protótipo

O arquivo atual é intencionalmente um protótipo consolidado e ainda possui legado de várias evoluções:

- arquivo único grande;
- múltiplos blocos JavaScript;
- wrappers/overrides históricos de funções como `page`, `render` e `openModal`;
- estilos inline;
- handlers HTML inline;
- uso de `localStorage`;
- imagem atual armazenada localmente;
- HTML dinâmico.

**Não limpar o protótipo apenas por estética antes da migração.** Use-o para entender o comportamento. A nova arquitetura deve eliminar essa dívida naturalmente durante a componentização, com testes de regressão a cada módulo.

## 21. Regra de trabalho para mudanças futuras

Prioridade:

```text
PATCH > REWRITE
REUSE > RECREATE
SIMPLE > COMPLEX
WORKING BEHAVIOR > UNNECESSARY REFACTOR
```

Antes de alterar algo que já funciona:

1. identificar o comportamento atual;
2. entender a regra de negócio;
3. fazer a menor mudança possível;
4. testar impactos nos demais módulos;
5. preservar dados existentes.

---

## Referência final

Para qualquer divergência entre uma interpretação deste README e um comportamento funcional já aprovado, **inspecionar primeiro o `index.html` atual** e preservar o comportamento existente até que haja uma decisão explícita de mudança.

Este README é o documento de handoff para a próxima fase no Bolt. O protótipo atual deve ser tratado como **Prototype Baseline** do produto.
