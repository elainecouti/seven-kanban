# Playbook Operacional — Seven Midas Marketing

## Equipe e Papéis

| Papel | Quem | Responsabilidades |
|-------|------|-------------------|
| **Elaine** | Gestora/Dona | Decisões de budget, aprovação de estratégia, relacionamento com cliente, visão geral |
| **Head** | Estratégia | Definir criativos, ângulos, públicos, estratégia de campanha, análise de performance |
| **Gestor Operacional** | Execução | Otimização diária, nomenclatura, UTMs, pausar/escalar, relatórios |
| **Equipe** | Suporte | Monitoramento, alertas, checklist operacional, tarefas recorrentes |

---

## Funis por Tipo de Cliente

### Tipo 1: Clínicas de Saúde (DM2, Emagrecentro, CDT, Médicos)

```
Meta Ads → Landing Page (UTM) → WhatsApp (ZapClinic) → SDR responde → Agendamento → Consulta
```

| Etapa | KPI | Meta | Threshold de Alerta |
|-------|-----|------|---------------------|
| Impressões → Clique | **CTR** | > 1.5% | < 1.0% |
| Clique → LP | **CPC** | < R$ 3.00 | > R$ 5.00 |
| LP → WhatsApp | **Taxa de conversão LP** | > 15% | < 8% |
| WhatsApp → Resposta SDR | **Tempo de resposta** | < 10 min | > 30 min |
| Resposta → Agendamento | **Taxa de agendamento** | > 25% | < 15% |
| Investimento → Lead | **CPL** | < R$ 25 | > R$ 40 |
| Investimento → Agendamento | **Custo por agendamento** | < R$ 80 | > R$ 120 |
| Frequência do criativo | **Frequência** | < 2.5 | > 3.5 |
| Alcance vs Impressões | **Frequência média** | < 3.0 | > 4.0 |

### Tipo 2: E-commerce (Max Outlet)

```
Meta Ads → Site → Adicionar ao Carrinho → Compra
```

| Etapa | KPI | Meta | Threshold de Alerta |
|-------|-----|------|---------------------|
| Impressões → Clique | **CTR** | > 1.2% | < 0.8% |
| Clique → Compra | **Taxa de conversão** | > 2% | < 1% |
| Investimento → Receita | **ROAS** | > 4x | < 2x |
| Custo por compra | **CPA** | < R$ 50 | > R$ 80 |
| Carrinho → Compra | **Taxa de checkout** | > 40% | < 25% |
| Frequência | **Frequência** | < 3.0 | > 4.0 |

**Regra especial:** Separar análise por objetivo (WPP=conversas, tráfego=seguidores, vendas=compras).

### Tipo 3: Vendas presenciais (Workshop Empresarial — Diego Vieira)

```
Meta Ads → LP → Initiate Checkout → Compra (Monetizze → Postback → Pixel Purchase)
```

| Etapa | KPI | Meta | Threshold de Alerta |
|-------|-----|------|---------------------|
| Impressões → Clique | **CTR** | > 1.0% | < 0.6% |
| Clique → Initiate Checkout | **Taxa de initiate** | > 3% | < 1.5% |
| Initiate → Compra | **Taxa de aprovação** | > 60% | < 40% |
| Investimento → Receita | **ROAS** | > 3x | < 1.5x |
| Custo por venda | **CPA** | Depende do ticket | > 30% do ticket |

**Funil:** Anúncio → LP → Initiate Checkout → Compra via Monetizze. Postback envia Purchase pro Pixel.

### Tipo 4: Eventos (Cibelly Cordeiro)

```
Meta Ads → LP → Inscrição (formulário ou WhatsApp)
```

| Etapa | KPI | Meta | Threshold de Alerta |
|-------|-----|------|---------------------|
| Impressões → Clique | **CTR** | > 2.0% | < 1.0% |
| Clique → Inscrição | **Taxa de conversão** | > 10% | < 5% |
| Custo por inscrição | **CPI** | < R$ 30 | > R$ 50 |

### Tipo 5: Tráfego para perfil (Dr. Leandro, Dra. Alessandra, Dra. Chris, Dra. Michelle, Fisio Guilherme)

```
Meta Ads → Perfil Instagram (objetivo: visitas ao perfil / seguidores)
```

| Etapa | KPI | Meta | Threshold de Alerta |
|-------|-----|------|---------------------|
| Impressões → Clique | **CTR** | > 0.8% | < 0.5% |
| Custo por clique | **CPC** | < R$ 2.00 | > R$ 3.00 |
| Alcance | **Reach** | Crescente | Estagnado |
| Frequência | **Frequência** | < 4.0 | > 5.0 |

**IMPORTANTE:** Não cobrar leads/conversões desses clientes. Objetivo é visitas e crescimento do perfil, não conversão direta.

---

## Regras de Automação: Análise → Card no Kanban

### Alertas Diários (rodar toda manhã às 8h)

| Regra | Condição | Card criado | Prioridade | Atribui pra | Categoria |
|-------|----------|-------------|------------|-------------|-----------|
| CPL explodiu | CPL últimas 24h > 2x média 7 dias | "CPL alto em [cliente] — investigar" | Urgente | Head | campanha |
| Zero leads | 0 leads nas últimas 48h com campanha ativa | "Sem leads [cliente] há 2 dias" | Urgente | Gestor Operacional | tracking |
| CTR despencou | CTR < 1% (clínicas) ou < 0.8% (outros) | "CTR baixo [cliente] — revisar criativos" | Alta | Head | criativo |
| Criativo fadigado | Frequência > 3.5 | "Fadiga no criativo [ad_name] — trocar" | Alta | Head | criativo |
| Budget acabando | Gasto > 85% do budget mensal antes do dia 25 | "Budget [cliente] quase esgotado" | Urgente | Elaine | orcamento |
| Campanha pausada | Campanha ativa ontem, pausada hoje | "Campanha [nome] pausada — verificar" | Alta | Gestor Operacional | campanha |
| CPC alto | CPC > R$ 5.00 (clínicas) | "CPC alto [cliente] — otimizar público" | Alta | Gestor Operacional | campanha |

### Alertas Semanais (toda segunda-feira)

| Regra | Condição | Card criado | Prioridade | Atribui pra | Categoria |
|-------|----------|-------------|------------|-------------|-----------|
| Performance semanal | Sempre | "Análise semanal [cliente]" | Média | Gestor Operacional | relatorio |
| Público saturado | Alcance/Audiência > 70% | "Público saturado [cliente] — expandir" | Alta | Head | campanha |
| ROAS baixo (e-commerce) | ROAS < 2x na semana | "ROAS baixo Max Outlet — revisar" | Urgente | Head | campanha |
| Teste A/B sem resultado | Teste rodando > 7 dias sem significância | "Definir teste A/B [cliente]" | Média | Head | criativo |

### Alertas Mensais (dia 1 de cada mês)

| Regra | Condição | Card criado | Prioridade | Atribui pra | Categoria |
|-------|----------|-------------|------------|-------------|-----------|
| Relatório mensal | Sempre, para cada cliente ativo | "Relatório mensal [cliente] — [mês]" | Alta | Equipe | relatorio |
| Revisão de budget | Sempre | "Revisão de budget [mês] — todos os clientes" | Alta | Elaine | orcamento |
| Revisão de criativos | Sempre | "Banco de criativos — atualizar [mês]" | Média | Head | criativo |
| Revisão de públicos | Sempre | "Revisar públicos e segmentações" | Média | Head | campanha |

---

## Processos Operacionais

### Diário (Gestor Operacional + Equipe)

| Hora | Processo | Responsável |
|------|----------|-------------|
| 08:00 | Script automático roda: puxa dados Meta Ads, verifica thresholds, cria cards | Automático |
| 08:30 | Revisar cards criados automaticamente no Kanban | Gestor Operacional |
| 09:00 | Verificar campanhas com entrega irregular (impressões zeradas, pausadas) | Gestor Operacional |
| 10:00 | Monitorar leads no ZapClinic — tempo de resposta dos SDRs | Equipe |
| 14:00 | Otimizações: pausar criativos ruins, ajustar budgets, testar variações | Gestor Operacional |
| 17:00 | Atualizar Kanban: mover cards, comentar progresso | Todos |

### Semanal (Head + Elaine)

| Dia | Processo | Responsável |
|-----|----------|-------------|
| Segunda | Reunião de planejamento: revisar semana anterior, priorizar semana | Head + Elaine |
| Segunda | Criar novos criativos/ângulos para clientes com fadiga | Head |
| Quarta | Análise de performance meio de semana (ajustar rota) | Gestor Operacional |
| Sexta | Relatório semanal rápido (top 5 clientes + alertas) | Gestor Operacional |
| Sexta | Revisar e limpar Kanban: arquivar concluídas, repriorizar | Todos |

### Mensal (Todos)

| Quando | Processo | Responsável |
|--------|----------|-------------|
| Dia 1-3 | Gerar relatórios mensais de todos os clientes | Equipe |
| Dia 1-3 | Cards automáticos criados pra cada relatório | Automático |
| Dia 3-5 | Cruzar Meta Ads x ZapClinic: CPL real, agendamentos | Gestor Operacional |
| Dia 5-7 | Análise estratégica: o que funcionou, o que mudar | Head |
| Dia 7-10 | Revisar budgets e negociar com clientes se necessário | Elaine |
| Dia 10 | Planejamento de criativos do mês (novos ângulos, formatos) | Head |
| Dia 15 | Checkpoint meio de mês: performance vs meta | Head + Elaine |

---

## Dashboard de KPIs (métricas que o script deve calcular)

### Visão Geral da Agência

| Métrica | Fórmula | Meta |
|---------|---------|------|
| Investimento total | Soma de spend de todos os clientes | Acompanhar |
| CPL médio (clínicas) | Spend / Leads ZapClinic | < R$ 25 |
| Custo por agendamento | Spend / Agendamentos | < R$ 80 |
| ROAS (e-commerce) | Receita / Spend | > 4x |
| Clientes com CPL acima da meta | Count | 0 ideal |
| Clientes sem leads há 48h | Count | 0 |
| Cards atrasados no Kanban | Count | < 5 |

### Por Cliente

| Métrica | Como calcular |
|---------|---------------|
| Spend do período | insights.spend |
| Impressões, Cliques, CTR, CPC | insights diretos |
| Leads (ZapClinic) | API ZapClinic /reports/generate |
| Agendamentos | Diálogos do chatbot (não tags) |
| CPL real | Spend / Leads ZapClinic |
| Custo por agendamento | Spend / Agendamentos |
| Taxa de agendamento | Agendamentos / Leads |
| Tempo médio de resposta SDR | Primeira mensagem SDR - primeira mensagem lead |
| Criativos ativos | Count de ads com status ACTIVE |
| Criativo com maior CTR | Top 1 ad by CTR |
| Criativo com maior frequência | Top 1 ad by frequency |

---

## Nomenclatura Padrão (já implementado)

```
Campanha:  {prefixo}_{objetivo}_{mesano}     → dm2vit_trafego_mar26
Conjunto:  {segmentacao}_{idade}_{geo}        → interesse_diabetes_35-65_es
Anúncio:   {formato}_{descricao}_{versao}     → video_depoimento_joao_v1
```

---

## Stack Tecnológico

| Ferramenta | Função |
|------------|--------|
| **Meta Ads API** | Dados de performance |
| **ZapClinic API** | Leads, conversas, agendamentos |
| **Supabase** | Backend do Kanban + tracking das LPs |
| **GitHub Pages** | Landing pages + Kanban |
| **Telegram Bot** | Notificações (@sevenmktbot) |
| **Python scripts** | Automação, análise, geração de cards |
