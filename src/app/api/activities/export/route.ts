import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Get query params for filters (optional)
    const status = searchParams.get('status');
    const area = searchParams.get('area');

    // Fetch activities from database
    const activities = await db.activity.findMany({
      where: {
        userId: user.id,
        deletedAt: null,
        ...(status && { status }),
        ...(area && { area })
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform activities to Excel format
    const getPriorityLabel = (priority: number) => {
      switch (priority) {
        case 0: return 'Alta';
        case 1: return 'Média';
        case 2: return 'Baixa';
        default: return 'Não definida';
      }
    };

    const getStatusLabel = (status: string) => {
      switch (status) {
        case 'pending': return 'Pendente';
        case 'in_progress': return 'Em Andamento';
        case 'completed': return 'Concluído';
        default: return status;
      }
    };

    const filteredData = activities.map(activity => ({
      'O Quê?': activity.title,
      'Por Quê?': activity.description || '',
      'Área': activity.area,
      'Prioridade': getPriorityLabel(activity.priority),
      'Status': getStatusLabel(activity.status),
      'Quem?': activity.responsible || '',
      'Quando?': activity.deadline || '',
      'Onde?': activity.location || '',
      'Como?': activity.how || '',
      'Quanto?': activity.cost || ''
    }));

    // Criar workbook
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Atividades');

    // Ajustar largura das colunas
    const maxWidth = 50;
    const wscols = [
      { wch: 40 }, // O Quê?
      { wch: maxWidth }, // Por Quê?
      { wch: 15 }, // Área
      { wch: 12 }, // Prioridade
      { wch: 15 }, // Status
      { wch: 30 }, // Quem?
      { wch: 20 }, // Quando?
      { wch: 25 }, // Onde?
      { wch: maxWidth }, // Como?
      { wch: 20 }, // Quanto?
    ];
    worksheet['!cols'] = wscols;

    // Gerar buffer do Excel
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Retornar arquivo
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="atividades_defenz_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });

  } catch (error: any) {
    console.error('Export Excel error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao exportar para Excel',
        details: error.message
      },
      { status: 500 }
    );
  }
}
