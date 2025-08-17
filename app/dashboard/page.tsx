import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// async function getRecentDocuments() {
//   const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/dashboard/recent-documents`, { cache: 'no-store' });
//   if (!res.ok) {
//     throw new Error('Failed to fetch template documents');
//   }
//   return res.json();
// }
//
// async function getRecentConvertedDocuments() {
//   const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/dashboard/recent-converted-documents`, { cache: 'no-store' });
//   if (!res.ok) {
//     throw new Error('Failed to fetch converted documents');
//   }
//   return res.json();
// }

export default async function DashboardPage() {

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
        </div>
      </main>
    </div>
  );
}
