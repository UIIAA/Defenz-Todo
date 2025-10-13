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

    // Mapear colunas para formato esperado
    const activities = jsonData.map((row: any, index: number) => {
      // Mapear diferentes possíveis nomes de colunas
      const getField = (possibleNames: string[]) => {
        for (const name of possibleNames) {
          if (row[name] !== undefined && row[name] !== null) {
            return String(row[name]);
          }
        }
        return '';
      };

      const getPriority = () => {
        const priority = getField(['Prioridade', 'Priority', 'prioridade', 'priority']);
        if (priority.toLowerCase().includes('alta') || priority.toLowerCase().includes('high') || priority === '0') return 0;
        if (priority.toLowerCase().includes('média') || priority.toLowerCase().includes('medium') || priority === '1') return 1;
        if (priority.toLowerCase().includes('baixa') || priority.toLowerCase().includes('low') || priority === '2') return 2;
        return 1; // default: média
      };

      const getStatus = () => {
        const status = getField(['Status', 'Estado', 'status']);
        if (status.toLowerCase().includes('concluído') || status.toLowerCase().includes('completed') || status.toLowerCase().includes('concluido')) return 'completed';
        if (status.toLowerCase().includes('andamento') || status.toLowerCase().includes('progress')) return 'in_progress';
        return 'pending';
      };

      return {
        title: getField(['Título', 'Title', 'O Quê?', 'O Que?', 'Atividade', 'Task', 'titulo']),
        description: getField(['Descrição', 'Description', 'Por Quê?', 'Por Que?', 'Justificativa', 'descricao']),
        area: getField(['Área', 'Area', 'Setor', 'area']),
        priority: getPriority(),
        status: getStatus(),
        responsible: getField(['Responsável', 'Responsible', 'Quem?', 'Quem', 'responsavel']),
        deadline: getField(['Prazo', 'Deadline', 'Quando?', 'Quando', 'Data', 'prazo']),
        location: getField(['Local', 'Location', 'Onde?', 'Onde', 'local']),
        how: getField(['Como?', 'Como', 'How', 'Método', 'Processo']),
        cost: getField(['Custo', 'Cost', 'Quanto?', 'Quanto', 'Valor', 'Investimento'])
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
