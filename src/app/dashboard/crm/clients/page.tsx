import { getClients } from '@/actions/crm'
import { AddClientDialog } from '@/components/crm/AddClientDialog'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ClientsPage() {
    const clients = await getClients()

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Clientes</h2>
                <AddClientDialog />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Lista de Clientes</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Empresa</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Telefone</TableHead>
                                <TableHead>Segmento</TableHead>
                                <TableHead className="text-right">Oportunidades</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {clients.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        Nenhum cliente cadastrado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                clients.map((client) => (
                                    <TableRow key={client.id}>
                                        <TableCell className="font-medium">{client.name}</TableCell>
                                        <TableCell>{client.company || '-'}</TableCell>
                                        <TableCell>{client.email || '-'}</TableCell>
                                        <TableCell>{client.phone || '-'}</TableCell>
                                        <TableCell>{client.segment || '-'}</TableCell>
                                        <TableCell className="text-right">{client._count.opportunities}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
