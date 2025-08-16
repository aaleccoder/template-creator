"use client";

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const breadcrumbTranslations: { [key: string]: string } = {
  dashboard: 'Dashboard',
  templates: 'Plantillas',
  documents: 'Documentos',
  edit: 'Editar',
};

interface BreadcrumbSegment {
  href: string;
  label: string;
}

export function DynamicBreadcrumb() {
  const pathname = usePathname();
  const [segments, setSegments] = useState<BreadcrumbSegment[]>([]);

  useEffect(() => {
    const generateSegments = async () => {
      const pathSegments = pathname.split('/').filter(Boolean);
      const breadcrumbSegments: BreadcrumbSegment[] = [];

      for (let i = 0; i < pathSegments.length; i++) {
        const segment = pathSegments[i];
        const href = `/${pathSegments.slice(0, i + 1).join('/')}`;
        let label = breadcrumbTranslations[segment] || segment;

        if (pathSegments[i - 1] === 'templates' && segment) {
          try {
            const res = await fetch(`/api/templates/${segment}`);
            if (res.ok) {
              const template = await res.json();
              label = template.name;
            }
          } catch (error) {
            console.error('Failed to fetch template name:', error);
          }
        } else if (pathSegments[i - 2] === 'templates' && pathSegments[i-1] === "documents" && segment) {
          try {
            const res = await fetch(`/api/documents/${segment}`);
            if (res.ok) {
              const doc = await res.json();
              label = doc.name;
            }
          } catch (error) {
            console.error('Failed to fetch document name:', error);
          }
        }

        breadcrumbSegments.push({ href, label });
      }
      setSegments(breadcrumbSegments);
    };

    generateSegments();
  }, [pathname]);

  if (segments.length === 0) {
    return null;
  }

  return (
    <div className="md:px-8 px-2 mt-4">
      <Breadcrumb>
        <BreadcrumbList className="text-lg font-bold">
          {segments.map((segment, index) => {
            const isLast = index === segments.length - 1;
            return (
              <React.Fragment key={segment.href}>
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage>{segment.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={segment.href}>
                      {segment.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator />}
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}