"use client";

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

type Schema = {
    [key: string]: {
        type: string;
        label: string;
    };
};

type FormRendererProps = {
    schema: Schema;
    onSubmit: (formData: { [key: string]: any }) => void;
    initialData?: { [key: string]: any };
    submitButtonText?: string;
};

export default function FormRenderer({ schema, onSubmit, initialData = {}, submitButtonText = 'Generar Vista Previa' }: FormRendererProps) {
    const [formData, setFormData] = useState<{ [key: string]: any }>({});

    // Inicializar o actualizar el estado del formulario cuando el schema o los datos iniciales cambian
    useEffect(() => {
        const dataFromSchema: { [key: string]: any } = {};
        Object.keys(schema).forEach(key => {
            dataFromSchema[key] = initialData[key] || '';
        });
        setFormData(dataFromSchema);
    }, [schema, initialData]);

    const handleInputChange = (key: string, value: string) => {
        setFormData(prevData => ({
            ...prevData,
            [key]: value
        }));
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {Object.entries(schema).map(([key, field]) => {
                const { type, label } = field;
                return (
                    <div key={key} className="grid w-full items-center gap-1.5">
                        <Label htmlFor={key}>{label}</Label>
                        {type === 'textarea' ? (
                            <Textarea
                                id={key}
                                value={formData[key] || ''}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange(key, e.target.value)}
                                placeholder={`Ingrese ${label.toLowerCase()}...`}
                            />
                        ) : (
                            <Input
                                type={type || 'text'} // 'text' por defecto
                                id={key}
                                value={formData[key] || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(key, e.target.value)}
                                placeholder={`Ingrese ${label.toLowerCase()}...`}
                            />
                        )}
                    </div>
                );
            })}
            <Button type="submit">{submitButtonText}</Button>
        </form>
    );
}