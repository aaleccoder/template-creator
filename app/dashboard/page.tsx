"use client";

import { useEffect, useState } from "react";
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Template {
  id: string;
  name: string;
  description: string;
  collectionId: string;
  collectionName: string;
}

export default function DashboardPage() {
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


  const renderContent = () => {
    if (loading) {
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="flex flex-col h-full">
                <CardHeader className="flex-grow">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      );
    }

    if (error) {
      return <p className="text-destructive">Error: {error}</p>;
    }

    if (templates.length === 0) {
      return <p>No se encontraron plantillas. Empieza por crear una.</p>;
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {templates.map((template) => (
            <Link href={`/templates/${template.id}`} key={template.id} passHref>
              <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                <CardHeader className="flex-grow">
                  <CardTitle className="text-lg font-semibold mb-2">{template.name}</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground line-clamp-3">
                    {template.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <main className="flex-1 p-6 overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
}