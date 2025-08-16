import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

async function getRecentDocuments() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/dashboard/recent-documents`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to fetch template documents');
  }
  return res.json();
}

async function getRecentConvertedDocuments() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/dashboard/recent-converted-documents`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to fetch converted documents');
  }
  return res.json();
}

export default async function DashboardPage() {
  const recentDocuments = await getRecentDocuments();
  const recentConvertedDocuments = await getRecentConvertedDocuments();

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 p-4 md:p-8">
        <div className="grid gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold tracking-tight">Bienvenido a Template Creator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                Esta aplicación te ayuda a crear y gestionar documentos de varias maneras. Puedes generar documentos a partir de plantillas predefinidas o convertir archivos de Office a PDF. Está diseñada para ser simple, rápida y eficiente.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="space-y-2">
                    <h3 className="font-semibold text-lg">¿Qué hace?</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-500 dark:text-gray-400">
                        <li>Gestiona plantillas de documentos.</li>
                        <li>Genera formularios dinámicos a partir de un esquema JSON.</li>
                        <li>Proporciona una vista previa en vivo mientras llenas el formulario.</li>
                        <li>Genera y almacena en caché PDFs bajo demanda.</li>
                        <li>Convierte documentos de Office (Word, Excel, PowerPoint) a PDF.</li>
                        <li>Almacena todos tus documentos y activos de forma segura.</li>
                    </ul>
                </div>
                <div className="space-y-2">
                    <h3 className="font-semibold text-lg">¿Cómo se usa?</h3>
                     <ol className="list-decimal list-inside space-y-1 text-gray-500 dark:text-gray-400">
                        <li><strong>Para plantillas:</strong> Ve a la página de <Link href="/templates" className="text-blue-500 hover:underline">Plantillas</Link>, selecciona una, rellena el formulario y guarda el PDF.</li>
                        <li><strong>Para conversiones:</strong> Ve a la página de <Link href="/documents" className="text-blue-500 hover:underline">Documentos</Link>, sube un archivo de Office y obtén una vista previa en PDF.</li>
                    </ol>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Documentos de Plantillas Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {recentDocuments.items.map((doc: any) => (
                    <Link href={`/templates/${doc.template}/${doc.id}/edit`} key={doc.id} className="block">
                      <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        <div>
                          <p className="font-semibold">{doc.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Última actualización: {format(new Date(doc.updated), "d 'de' MMMM, yyyy 'a las' h:mm a", { locale: es })}
                          </p>
                        </div>
                        <Badge variant="outline">{doc.status}</Badge>
                      </div>
                    </Link>
                  ))}
                  {recentDocuments.items.length === 0 && (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                      No se encontraron documentos de plantillas.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Documentos Convertidos Recientemente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {recentConvertedDocuments.items.map((doc: any) => (
                    <Link href={`/documents?file=${doc.file}`} key={doc.id} className="block">
                      <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        <div>
                          <p className="font-semibold">{doc.title}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Última actualización: {format(new Date(doc.updated), "d 'de' MMMM, yyyy 'a las' h:mm a", { locale: es })}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                  {recentConvertedDocuments.items.length === 0 && (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                      No se encontraron documentos convertidos.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}