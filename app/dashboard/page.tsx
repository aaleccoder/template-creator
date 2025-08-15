"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/theme-toggle";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface Template {
  id: string;
  name: string;
  description: string;
  collectionId: string;
  collectionName: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/templates');
        if (!response.ok) {
          throw new Error('No se pudo obtener la lista de plantillas.');
        }
        const data = await response.json();
        setTemplates(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (response.ok) {
        router.push('/');
      } else {
        alert('Error al cerrar sesión.');
      }
    } catch (error) {
      alert('Ocurrió un error inesperado.');
    }
  };

  const renderContent = () => {
    if (loading) {
      return <p>Cargando plantillas...</p>;
    }

    if (error) {
      return <p className="text-destructive">Error: {error}</p>;
    }

    if (templates.length === 0) {
      return <p>No se encontraron plantillas. Empieza por crear una.</p>;
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {templates.map((template) => (
          <Link href={`/templates/${template.id}`} key={template.id}>
            <Card className="hover:border-primary transition-colors duration-200 cursor-pointer">
              <CardHeader>
                <CardTitle>{template.name}</CardTitle>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    );
  };

  return (
    <div className="font-sans flex flex-col h-screen bg-background">
      <header className="flex justify-between items-center w-full p-4 border-b">
        <h1 className="text-2xl font-bold">Dashboard de Plantillas</h1>
        <div className="flex items-center gap-4">
          <ModeToggle />
          <Link href="/documents">
            <Button variant="outline">Documentos</Button>
          </Link>
          <Button onClick={handleLogout}>Cerrar Sesión</Button>
        </div>
      </header>
      <main className="flex-1 p-8 overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Plantillas Disponibles</h2>
        {renderContent()}
      </main>
    </div>
  );
}