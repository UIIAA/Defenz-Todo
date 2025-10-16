import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { importActivitiesSchema } from '@/lib/validations/activity'
import { handleApiError, successResponse, ApiError } from '@/lib/api-helpers'

/**
 * Atividades iniciais da planilha do projeto Defenz
 * Estas atividades são usadas apenas para seed inicial do banco
 */
const initialActivities = [
  {
    title: 'Definição e Aplicação da Identidade Visual',
    area: 'Marketing',
    priority: 0,
    status: 'pending',
    description: 'Ter uma identidade visual profissional e consistente é a base para credibilidade, reconhecimento de marca e diferenciação no mercado competitivo de cibersegurança. O kit de revenda e manual da marca são um ótimo ponto de partida, conectando diretamente à atualização do site existente para reforçar a presença online unificada.',
    responsible: 'Marcos (com suporte de Design)',
    deadline: 'Imediato (Semanas 1-2, iniciando nesta terça-feira)',
    location: 'Agência/Designer, Site atual da Defenz, Materiais de Comunicação',
    how: '1. Avaliar agências/designers com base no manual existente. 2. Contratar para refinar logo, paleta de cores, tipografia (se necessário). 3. Aplicar imediatamente no site live, integrando com as atualizações do site para consistência visual em todas as páginas. 4. Conectar ao conteúdo futuro (blog/LinkedIn) para padronização.',
    cost: 'Custo de contratação de designer/agência (orçamento inicial estimado em R$ 2.000-5.000, dependendo da complexidade).'
  },
  {
    title: 'Atualização do Site "Simples"',
    area: 'Marketing',
    priority: 0,
    status: 'pending',
    description: 'O site é o cartão de visitas digital. Como já está no ar, focar em funcionalidade e nova identidade visual é fundamental para apresentar a empresa, seus serviços (como Bitdefender GravityZone) e capturar leads, conectando ao funil de conteúdo e ads para tráfego integrado.',
    responsible: 'Marcos (com suporte de Design/Desenvolvimento Web)',
    deadline: 'Semanas 2-4 (após identidade visual, alinhando com shadow na quinta e sexta para insights práticos sobre GravityZone).',
    location: 'Site atual da Defenz (já live).',
    how: '1. Aplicar a nova identidade visual definida na etapa anterior. 2. Criar/refinar páginas essenciais: "Sobre Nós", "Soluções" (destacando Bitdefender GravityZone com insights do shadow). 3. Preparar estrutura para Blog (integrando automação via N8n para conteúdo). 4. Garantir responsividade (mobile friendly) e otimizar para SEO inicial. 5. Conectar a leads via formulários para importação futura no CRM.',
    cost: 'Custo de desenvolvimento web (se houver complexidade além do visual, estimado em R$ 1.000-3.000).'
  },
  {
    title: 'Produção e Publicação de Conteúdo Relevante (Blog/LinkedIn)',
    area: 'Marketing',
    priority: 2,
    status: 'pending',
    description: 'Conteúdo de qualidade atrai o público-alvo (Analistas de TI, Empresários, Gerentes de Segurança), constrói autoridade, gera tráfego orgânico e educa os leads. Conecta à identidade visual (para padronização) e ao site atualizado (para direcionamento de tráfego), alimentando a lista de prospects e ads.',
    responsible: 'Marcos',
    deadline: 'Contínuo (a partir da Semana 3, incorporando insights do shadow na quinta e sexta sobre GravityZone).',
    location: 'LinkedIn da Defenz, Blog no site da Defenz (integrado à estrutura preparada).',
    how: '1. Pesquisar tópicos "melhores do mercado" em cibersegurança B2B e Bitdefender (usando conhecimentos do shadow). 2. Definir um calendário editorial alinhado com monitoramento de mercado. 3. Produzir artigos (texto) e posts (vídeos curtos, infográficos) sobre dores e soluções (ex: Ransomware, LGPD, EDR), aplicando identidade visual. 4. Publicar regularmente no LinkedIn e no Blog. 5. Avançar com o fluxo de criação automática do Blog via N8n, conectando a captura de leads para o CRM futuro.',
    cost: 'Horas internas (20-30h/semana inicial), possível custo de ferramenta de automação (N8n, R$ 100-500/mês se escalado).'
  },
  {
    title: 'Construção da Lista de Prospects',
    area: 'Vendas',
    priority: 2,
    status: 'pending',
    description: 'Ter uma lista segmentada de potenciais clientes é o combustível para a equipa de vendas. Conecta ao conteúdo (para nutrição de leads) e ao CRM (para importação), acelerando a prospecção ativa após o shadow.',
    responsible: 'Marcos',
    deadline: 'Semanas 3-5 (após conteúdo inicial, usando insights do shadow para refinar filtros).',
    location: 'LinkedIn Helper, Ferramentas de inteligência de vendas (teste).',
    how: '1. Finalizar a avaliação do LinkedIn Helper para extração de leads qualificados, integrando com conteúdo publicado. 2. Filtrar por cargo (Gestor de TI, Sócio-Diretor, CISO), setor e tamanho da empresa (mais de 20 computadores), priorizando leads alinhados com GravityZone. 3. Organizar a lista para importação no CRM, conectando a ads para captura adicional.',
    cost: 'Custo do LinkedIn Helper (R$ 200-500/mês), outras ferramentas de prospecção (se houver, R$ 100-300).'
  },
  {
    title: 'Configuração de Ads no Google',
    area: 'Marketing',
    priority: 1,
    status: 'pending',
    description: 'Capturar a demanda já existente. Conecta ao site atualizado (para landing pages) e ao conteúdo (para remarketing), direcionando tráfego qualificado para a lista de prospects e funil de vendas.',
    responsible: 'Marcos',
    deadline: 'A partir da Semana 5 (após site, conteúdo inicial e shadow para refinamento de mensagens sobre GravityZone).',
    location: 'Google Ads.',
    how: '1. Pesquisar palavras-chave relevantes (antivírus corporativo, EDR para empresas, Bitdefender GravityZone), usando dados de monitoramento de mercado. 2. Criar campanhas de pesquisa focadas em alta intenção de compra. 3. Direcionar para páginas específicas do site (soluções, contacto), integrando com CRM para rastreamento de leads.',
    cost: 'Orçamento de Google Ads (inicial R$ 1.000-3.000/mês, ajustável com base em ROI).'
  },
  {
    title: 'Contratação do Vendedor',
    area: 'Vendas',
    priority: 2,
    status: 'pending',
    description: 'A presença de um vendedor dedicado é essencial para converter os leads gerados pelo marketing em clientes pagantes e para iniciar a prospecção ativa, conectando à lista de prospects e ao CRM para execução eficiente.',
    responsible: 'Marcos',
    deadline: 'Semanas 4-8 (após shadow na quinta e sexta, para incorporar conhecimentos em entrevistas).',
    location: 'Plataformas de recrutamento (LinkedIn), rede de contactos.',
    how: '1. Definir o perfil exato (experiência em SaaS B2B, cibersegurança, com ênfase em GravityZone). 2. Realizar entrevistas, usando insights do shadow. 3. Contratar e integrar, alinhando com procedimentos de venda e treinamento sombra interno.',
    cost: 'Salário (R$ 4.000-7.000/mês), benefícios, custos de recrutamento (R$ 500-1.000).'
  },
  {
    title: 'Configuração do CRM (Pipedrive)',
    area: 'Vendas',
    priority: 2,
    status: 'pending',
    description: 'O CRM é a espinha dorsal da gestão de vendas. Conecta à lista de prospects (para importação), ao conteúdo/leads (para nutrição) e aos ads (para rastreamento), otimizando o funil com dados do shadow.',
    responsible: 'Marcos',
    deadline: 'Semanas 4-6 (paralelo à contratação de vendedor, pós-shadow para refinamento).',
    location: 'Pipedrive.',
    how: '1. Finalizar avaliação e contratar o Pipedrive. 2. Configurar o funil de vendas da Defenz, incorporando etapas baseadas em GravityZone. 3. Importar a lista de prospects gerada. 4. Integrar com e-mail, site (formulários) e outras ferramentas necessárias para automação.',
    cost: 'Custo da licença do Pipedrive (R$ 100-300/mês).'
  },
  {
    title: 'Desenvolvimento de Procedimentos e Scripts de Venda',
    area: 'Gestão',
    priority: 2,
    status: 'pending',
    description: 'Garante consistência na comunicação, facilita o treinamento do novo vendedor e otimiza a conversão, conectando ao conhecimento aprofundado de GravityZone e ao CRM para medição de KPIs.',
    responsible: 'Marcos',
    deadline: 'Semanas 8-10 (após integração do vendedor, usando insights contínuos do shadow e monitoramento).',
    location: 'Documentos internos (Google Docs/Wiki).',
    how: '1. Documentar o processo de vendas (o que o vendedor precisa fazer em cada etapa, alinhado ao funil no CRM). 2. Criar scripts básicos de abordagem (e-mail, telefone) e objeções comuns, destacando benefícios de GravityZone. 3. Realizar treinamento "sombra" (acompanhamento) inicial, conectando a reuniões semanais para ajustes.',
    cost: 'Horas internas de treinamento e documentação (10-20h inicial).'
  },
  {
    title: 'Aprofundar Conhecimento Bitdefender GravityZone',
    area: 'Gestão',
    priority: 2,
    status: 'pending',
    description: 'Dominar a solução Bitdefender é fundamental para a credibilidade, confiança do cliente e capacidade de venda consultiva, conectando a todo o plano (conteúdo, ads, vendas) para mensagens consistentes.',
    responsible: 'Marcos',
    deadline: 'Contínuo (iniciando com shadow na quinta e sexta desta semana).',
    location: 'Cursos Bitdefender, ambiente GravityZone.',
    how: '1. Finalizar o curso principal e shadow marcado. 2. Continuar a explorar e praticar no GravityZone, integrando insights a conteúdo e scripts de venda. 3. Manter-se atualizado sobre novas funcionalidades via monitoramento de mercado.',
    cost: 'Horas internas (5-10h/semana).'
  },
  {
    title: 'Reuniões de Alinhamento Semanal',
    area: 'Gestão',
    priority: 0,
    status: 'pending',
    description: 'Garantir que a equipa esteja sincronizada, que os desafios sejam abordados rapidamente e que o plano esteja a ser executado conforme o planeado, conectando todas as prioridades para ajustes holísticos.',
    responsible: 'Fernando e Marcos',
    deadline: 'Semanal (iniciando nesta terça-feira, revisando shadow na reunião pós-sexta).',
    location: 'Reunião virtual/presencial.',
    how: 'Reunião curta para revisar o progresso das ações, KPIs (ex: leads gerados, tráfego no site) e ajustar prioridades, incorporando feedbacks do shadow e monitoramento.',
    cost: 'Horas internas (1-2h/semana).'
  },
  {
    title: 'Monitoramento do Mercado e Concorrência',
    area: 'Gestão',
    priority: 2,
    status: 'pending',
    description: 'Estar atento ao que os concorrentes estão a fazer e às tendências de cibersegurança, conectando a conteúdo (para oportunidades), ads (para palavras-chave) e vendas (para diferenciação).',
    responsible: 'Fernando / Marcos',
    deadline: 'Mensal (com checks semanais iniciais pós-shadow).',
    location: 'Pesquisa online, feeds de notícias da indústria.',
    how: 'Acompanhar blogs de concorrentes, notícias do setor, novas ameaças para identificar oportunidades de conteúdo e diferenciação, integrando a calendário editorial e scripts de venda.',
    cost: 'Horas internas (2-5h/mês).'
  },
  {
    title: 'Produção de material de boas vidas',
    area: 'Back office',
    priority: 2,
    status: 'pending',
    description: 'Garantir ferramentas e infra-estrutura minima adequada para colaborador',
    responsible: 'Fernando / Marcos',
    deadline: 'Após idendidade visual, Fechamento da arte 3 dias, Producão 5 dias, Notebook 5 dias, Celular ( Usar linha 10Xd em outro telefone para vendedor efetuar contato nesse momento )',
    location: 'Web Meeting',
    how: 'Bolsa, Camisa, Garrafa, Pad Mouse, Notebook, Licença Office, Telefone',
    cost: 'A definir'
  },
  {
    title: 'Alinhamento semanal com SS',
    area: 'Vendas',
    priority: 0,
    status: 'pending',
    description: 'Programar reuniões semanais breves com o SS, com o objetivo de acompanhar a evolução dos leads.',
    responsible: 'Fernando / Marcos',
    deadline: 'TBD',
    location: 'Web Meeting',
    how: 'Reuniões semanais de acompanhamento',
    cost: 'Horas internas'
  },
  {
    title: 'Desenvolver um dashboard que consolide as principais ações e os indicadores de resultado.',
    area: 'Estratégico',
    priority: 1,
    status: 'pending',
    description: 'Assegurar o foco nas atividades, a execução das entregas conforme o planejado e a devida visibilidade.',
    responsible: 'Fernando / Marcos',
    deadline: 'A definir',
    location: 'Dashboard online',
    how: 'Desenvolvimento de dashboard com KPIs e métricas',
    cost: 'Horas de desenvolvimento'
  },
  {
    title: 'Abrir nova conta empresa',
    area: 'Estratégico',
    priority: 0,
    status: 'pending',
    description: 'Garantir a governança financeira da empresa.',
    responsible: 'Fernando',
    deadline: 'Imediato',
    location: 'Instituição financeira',
    how: 'Abertura de conta jurídica',
    cost: 'Taxas bancárias'
  }
]

/**
 * POST /api/activities/import
 *
 * Importa as atividades iniciais do projeto Defenz.
 *
 * SEGURANÇA:
 * - Requer autenticação
 * - Apenas permite importação se:
 *   1. O banco está vazio (primeiro uso), ou
 *   2. O usuário é admin e confirma explicitamente
 * - Valida todos os dados com Zod antes de inserir
 * - Nunca deleta atividades de outros usuários
 *
 * Query params:
 * - confirm=true: Obrigatório para admin forçar reimportação
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticação
    const user = await getCurrentUser()

    if (!user) {
      throw new ApiError('Não autorizado', 401)
    }

    if (!user.id) {
      throw new ApiError('ID de usuário inválido', 400)
    }

    // 2. Verificar se banco está vazio (primeiro uso)
    const activityCount = await db.activity.count()
    const isFirstUse = activityCount === 0

    // 3. Se não for primeiro uso, verificar permissões de admin
    if (!isFirstUse) {
      // Apenas admin pode reimportar dados
      if (user.role !== 'admin') {
        throw new ApiError(
          'Apenas administradores podem reimportar atividades em um banco com dados existentes',
          403
        )
      }

      // Admin precisa confirmar explicitamente
      const { searchParams } = new URL(request.url)
      const confirmed = searchParams.get('confirm') === 'true'

      if (!confirmed) {
        throw new ApiError(
          'Reimportação requer confirmação explícita. Use ?confirm=true',
          400
        )
      }

      // Admin confirmou: deletar APENAS atividades do próprio usuário
      await db.activity.deleteMany({
        where: { userId: user.id }
      })
    }

    // 4. Validar dados com Zod
    const validation = importActivitiesSchema.safeParse(initialActivities)

    if (!validation.success) {
      throw new ApiError('Dados de importação inválidos', 400, validation.error.issues)
    }

    // 5. Inserir atividades validadas com userId correto
    const activities = await db.activity.createMany({
      data: validation.data.map(activity => ({
        ...activity,
        userId: user.id
      }))
    })

    return successResponse(
      {
        count: activities.count,
        imported: validation.data.length
      },
      `${activities.count} atividades importadas com sucesso${isFirstUse ? ' (primeira configuração)' : ' (reimportação admin)'}`
    )
  } catch (error) {
    console.error('Error importing activities:', error)
    return handleApiError(error)
  }
}