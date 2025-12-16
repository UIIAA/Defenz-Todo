import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'CRM | Defenz',
    description: 'Gestão de Relacionamento com Clientes',
}

export default function CrmLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 space-y-4 p-8 pt-6">
                {children}
            </div>
        </div>
    )
}
