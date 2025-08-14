"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ImageUploader from './image-uploader';

type FormFieldOption = {
  value: string;
  label: string;
};

type FormField = {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  placeholder?: string;
  options?: FormFieldOption[];
  itemFields?: FormField[];
};

type Schema = {
  title: string;
  description: string;
  fields: FormField[];
};

type FormRendererProps = {
  schema: Schema;
  onSubmit: (formData: { [key: string]: any }) => void;
  initialData?: { [key: string]: any };
  submitButtonText?: string;
};

export default function FormRenderer({ schema, onSubmit, initialData = {}, submitButtonText = 'Generar' }: FormRendererProps) {
    const [formData, setFormData] = useState<{ [key: string]: any }>({});

    const stringifiedSchema = useMemo(() => JSON.stringify(schema), [schema]);
    const stringifiedInitialData = useMemo(() => JSON.stringify(initialData), [initialData]);

    useEffect(() => {
        const parsedSchema = JSON.parse(stringifiedSchema);
        const parsedInitialData = JSON.parse(stringifiedInitialData);
    
        const initialFormState: { [key: string]: any } = {};
        parsedSchema.fields.forEach((field: FormField) => {
            if (parsedInitialData && parsedInitialData[field.name]) {
                initialFormState[field.name] = parsedInitialData[field.name];
            } else if (field.type === 'array') {
                initialFormState[field.name] = field.itemFields ? [] : {};
            } else {
                initialFormState[field.name] = '';
            }
        });
        setFormData(initialFormState);
    }, [stringifiedSchema, stringifiedInitialData]);

    const handleInputChange = useCallback((key: string, value: any) => {
        setFormData(prevData => ({ ...prevData, [key]: value }));
    }, []);

    const handleArrayChange = useCallback((arrayKey: string, index: number, itemKey: string, value: string) => {
        setFormData(prevData => {
            const newArray = [...(prevData[arrayKey] || [])];
            newArray[index] = { ...newArray[index], [itemKey]: value };
            return { ...prevData, [arrayKey]: newArray };
        });
    }, []);

    const addArrayItem = useCallback((key: string) => {
        const fieldSchema = schema.fields.find(f => f.name === key);
        const newItem = fieldSchema?.itemFields?.reduce((acc, field) => {
            acc[field.name] = '';
            return acc;
        }, {} as {[key: string]: string}) || {};

        setFormData(prevData => ({
            ...prevData,
            [key]: [...(prevData[key] || []), newItem]
        }));
    }, [schema.fields]);

    const removeArrayItem = useCallback((key: string, index: number) => {
        setFormData(prevData => {
            const newArray = [...(prevData[key] || [])];
            newArray.splice(index, 1);
            return { ...prevData, [key]: newArray };
        });
    }, []);

    const handleSubmit = useCallback((event: React.FormEvent) => {
        event.preventDefault();
        onSubmit(formData);
    }, [formData, onSubmit]);

    const renderField = useCallback((field: FormField) => {
        const key = field.name;

        if (field.type === 'array') {
            return (
                <div key={key} className="space-y-4 p-4 border rounded-md">
                    <Label className="font-semibold text-lg">{field.label}</Label>
                    {(formData[key] || []).map((item: any, index: number) => (
                        <div key={index} className="space-y-2 p-3 border rounded-md relative">
                             <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => removeArrayItem(key, index)}
                                className="absolute top-2 right-2"
                            > X </Button>
                            {field.itemFields?.map(subField => (
                                <div key={subField.name} className="grid w-full items-center gap-1.5">
                                    <Label htmlFor={`${key}-${index}-${subField.name}`}>{subField.label}</Label>
                                    <Input
                                        type={subField.type || 'text'}
                                        id={`${key}-${index}-${subField.name}`}
                                        value={item[subField.name] || ''}
                                        onChange={e => handleArrayChange(key, index, subField.name, e.target.value)}
                                        placeholder={subField.placeholder}
                                        required={subField.required}
                                    />
                                </div>
                            ))}
                        </div>
                    ))}
                    <Button type="button" variant="outline" onClick={() => addArrayItem(key)}>
                        Añadir {field.label}
                    </Button>
                </div>
            );
        }

        return (
            <div key={key} className="grid w-full items-center gap-1.5">
                {field.type !== 'image' && (
                    <Label htmlFor={key}>{field.label}</Label>
                )}
                {
                    field.type === 'textarea' ? (
                        <Textarea
                            id={key}
                            value={formData[key] || ''}
                            onChange={(e) => handleInputChange(key, e.target.value)}
                            placeholder={field.placeholder}
                            required={field.required}
                        />
                    ) : field.type === 'image' ? (
                        <ImageUploader
                            label={field.label}
                            initialUrl={formData[key] || ''}
                            onUploadComplete={(url) => handleInputChange(key, url)}
                        />
                    ) : field.type === 'select' ? (
                        <Select onValueChange={(value: string) => handleInputChange(key, value)} value={formData[key] || ''}>
                            <SelectTrigger>
                                <SelectValue placeholder={field.placeholder || 'Seleccione una opción'} />
                            </SelectTrigger>
                            <SelectContent>
                                {field.options?.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : (
                        <Input
                            type={field.type || 'text'}
                            id={key}
                            value={formData[key] || ''}
                            onChange={(e) => handleInputChange(key, e.target.value)}
                            placeholder={field.placeholder}
                            required={field.required}
                        />
                    )
                }
            </div>
        );
    }, [formData, handleInputChange, handleArrayChange, addArrayItem, removeArrayItem]);

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {schema.fields.map(field => renderField(field))}
            <Button type="submit">{submitButtonText}</Button>
        </form>
    );
}