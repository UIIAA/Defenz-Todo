import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }

    // Verificar se é um arquivo Excel
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.oasis.opendocument.spreadsheet'
    ];

    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|ods)$/i)) {
      return NextResponse.json(
        { success: false, error: 'Formato de arquivo inválido. Use .xlsx, .xls ou .ods' },
        { status: 400 }
      );
    }

    // Ler arquivo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Parse do Excel
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Converter para JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (!jsonData || jsonData.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Planilha vazia ou formato inválido' },
        { status: 400 }
      );
    }

    // Mapear colunas para formato esperado (5W2H)
    const activities = jsonData.map((row: any, index: number) => {
      // Mapear diferentes possíveis nomes de colunas
      const getField = (possibleNames: string[]) => {
        for (const name of possibleNames) {
          if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
            return String(row[name]).trim();
          }
        }
        return '';
      };

      const getPriority = () => {
        const priority = getField(['Prioridade', 'Priority', 'prioridade', 'priority']);
        // Convert numeric or text priority
        if (priority === '0' || priority.toLowerCase().includes('alta') || priority.toLowerCase().includes('high')) return 0;
        if (priority === '1' || priority.toLowerCase().includes('média') || priority.toLowerCase().includes('media') || priority.toLowerCase().includes('medium')) return 1;
        if (priority === '2' || priority.toLowerCase().includes('baixa') || priority.toLowerCase().includes('low')) return 2;
        return 1; // default: média
      };

      const getStatus = () => {
        const status = getField(['Status', 'Estado', 'status']);
        const statusLower = status.toLowerCase();

        // Map common status values
        if (statusLower.includes('ok') || statusLower.includes('concluído') || statusLower.includes('concluido') || statusLower.includes('completed')) {
          return 'completed';
        }
        if (statusLower.includes('andamento') || statusLower.includes('progress') || statusLower.includes('em andamento')) {
          return 'in_progress';
        }
        // Default to pending if empty or unknown
        return statusLower === '' ? 'pending' : statusLower;
      };

      return {
        // O Quê? (What) - Título da ação
        title: getField(['O Quê?', 'O Que?', 'What', 'Título', 'Title', 'Atividade', 'Task', 'titulo']),

        // Por Quê? (Why) - Justificativa detalhada
        description: getField(['Por Quê?', 'Por Que?', 'Why', 'Descrição', 'Description', 'Justificativa', 'descricao']),

        // Área
        area: getField(['Área', 'Area', 'Setor', 'area']),

        // Prioridade (0=Alta, 1=Média, 2=Baixa)
        priority: getPriority(),

        // Status
        status: getStatus(),

        // Quem? (Who) - Responsável
        responsible: getField(['Quem?', 'Quem', 'Who', 'Responsável', 'Responsible', 'responsavel']),

        // Quando? (When) - Prazo/Timeline
        deadline: getField(['Quando?', 'Quando', 'When', 'Prazo', 'Deadline', 'Data', 'prazo']),

        // Onde? (Where) - Local/Plataforma
        location: getField(['Onde?', 'Onde', 'Where', 'Local', 'Location', 'Plataforma', 'local']),

        // Como? (How) - Método/Processo detalhado
        how: getField(['Como?', 'Como', 'How', 'Método', 'Processo', 'Execução']),

        // Quanto? (How Much) - Investimento/Custo
        cost: getField(['Quanto?', 'Quanto', 'How Much', 'Custo', 'Cost', 'Valor', 'Investimento', 'Orçamento'])
      };
    });

    // Validar que pelo menos tem título
    const validActivities = activities.filter((a: any) => a.title && a.title.trim() !== '');

    if (validActivities.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nenhuma atividade válida encontrada na planilha' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: validActivities,
      count: validActivities.length,
      message: `${validActivities.length} atividades importadas com sucesso`
    });

  } catch (error: any) {
    console.error('Upload Excel error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao processar arquivo Excel',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// Configuração para permitir uploads
export const config = {
  api: {
    bodyParser: false,
  },
};
