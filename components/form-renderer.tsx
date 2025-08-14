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
  type: string; // 'text' | 'number' | 'textarea' | 'select' | 'date' | 'image' | 'array' | etc.
  required?: boolean;
  placeholder?: string;
  options?: FormFieldOption[];
  itemFields?: FormField[]; // For 'array' items
  // Validation metadata
  format?: 'email' | 'url';
  pattern?: string;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  integer?: boolean;
  step?: number;
  // Image validation hints (client)
  acceptMime?: string;     // e.g., 'image/*'
  maxSizeMB?: number;      // e.g., 5
  // Array constraints
  minItems?: number;
  maxItems?: number;
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
    const [errors, setErrors] = useState<Record<string, string | null>>({});

    const stringifiedSchema = useMemo(() => JSON.stringify(schema), [schema]);
    const stringifiedInitialData = useMemo(() => JSON.stringify(initialData), [initialData]);

    useEffect(() => {
        const parsedSchema = JSON.parse(stringifiedSchema);
        const parsedInitialData = JSON.parse(stringifiedInitialData);
    
        const initialFormState: { [key: string]: any } = {};
        const initialErrors: Record<string, string | null> = {};
        parsedSchema.fields.forEach((field: FormField) => {
            if (parsedInitialData && parsedInitialData[field.name] !== undefined) {
                initialFormState[field.name] = parsedInitialData[field.name];
            } else if (field.type === 'array') {
                initialFormState[field.name] = field.itemFields ? [] : {};
            } else {
                initialFormState[field.name] = '';
            }
            initialErrors[field.name] = null;
        });
        setFormData(initialFormState);
        setErrors(initialErrors);
    }, [stringifiedSchema, stringifiedInitialData]);

    // Helpers
    const isEmpty = (v: any) => v === null || v === undefined || (typeof v === 'string' && v.trim() === '');

    const validateField = useCallback((field: FormField, value: any): string | null => {
        // Required check
        if (field.required) {
            if (field.type === 'array') {
                const arr = Array.isArray(value) ? value : [];
                if (arr.length === 0) return 'Este campo es requerido.';
                if (field.minItems !== undefined && arr.length < field.minItems) {
                    return `Debe agregar al menos ${field.minItems} elemento(s).`;
                }
            } else if (isEmpty(value)) {
                return 'Este campo es requerido.';
            }
        }

        // Skip further checks if empty and not required
        if (!field.required && isEmpty(value)) return null;

        // Type-specific validations
        if (field.type === 'number') {
            const num = typeof value === 'number' ? value : Number(value);
            if (Number.isNaN(num)) return 'Debe ingresar un número válido.';
            if (field.integer && !Number.isInteger(num)) return 'Debe ser un número entero.';
            if (field.min !== undefined && num < field.min) return `El valor mínimo es ${field.min}.`;
            if (field.max !== undefined && num > field.max) return `El valor máximo es ${field.max}.`;
        }

        if (field.type === 'text' || field.type === 'textarea' || field.type === 'date' || field.type === 'image') {
            const str = String(value ?? '');
            if (field.minLength !== undefined && str.length < field.minLength) {
                return `Debe tener al menos ${field.minLength} caracteres.`;
            }
            if (field.maxLength !== undefined && str.length > field.maxLength) {
                return `Debe tener como máximo ${field.maxLength} caracteres.`;
            }
            if (field.pattern) {
                const re = new RegExp(field.pattern);
                if (!re.test(str)) return 'Formato inválido.';
            }
            if (field.format === 'email') {
                const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRe.test(str)) return 'Ingrese un correo electrónico válido.';
            }
        }

        if (field.type === 'select') {
            if (field.options && !field.options.some(o => o.value === value)) {
                return 'Seleccione una opción válida.';
            }
        }

        // Array item validations
        if (field.type === 'array' && Array.isArray(value) && field.itemFields?.length) {
            for (const [idx, item] of value.entries()) {
                for (const sub of field.itemFields) {
                    const msg = validateField(
                        { ...sub, name: `${field.name}[${idx}].${sub.name}` },
                        item?.[sub.name]
                    );
                    if (msg) {
                        return `Elemento #${idx + 1}: ${sub.label} - ${msg}`;
                    }
                }
            }
            if (field.maxItems !== undefined && value.length > field.maxItems) {
                return `No puede agregar más de ${field.maxItems} elemento(s).`;
            }
        }

        return null;
    }, []);
    
    const handleInputChange = useCallback((key: string, value: any) => {
        // Find field by key for coercion and validation
        const field = schema.fields.find(f => f.name === key);

        let coerced = value;
        if (field && field.type === 'number') {
            // Keep empty string as-is to allow clearing the field
            if (value === '' || value === null || value === undefined) {
                coerced = '';
            } else {
                coerced = field.integer ? parseInt(value, 10) : parseFloat(value);
            }
        }

        setFormData(prevData => ({ ...prevData, [key]: coerced }));
        if (field) {
            const err = validateField(field, coerced);
            setErrors(prev => ({ ...prev, [key]: err }));
        }
    }, [schema.fields, validateField]);

    const handleArrayChange = useCallback((arrayKey: string, index: number, itemKey: string, value: string) => {
        setFormData(prevData => {
            const newArray = [...(prevData[arrayKey] || [])];
            newArray[index] = { ...newArray[index], [itemKey]: value };
            return { ...prevData, [arrayKey]: newArray };
        });
        const field = schema.fields.find(f => f.name === arrayKey);
        if (field) {
            const current = (formData[arrayKey] || []).map((it: any, i: number) => i === index ? { ...it, [itemKey]: value } : it);
            const err = validateField(field, current);
            setErrors(prev => ({ ...prev, [arrayKey]: err }));
        }
    }, [schema.fields, formData, validateField]);

    const addArrayItem = useCallback((key: string) => {
        const fieldSchema = schema.fields.find(f => f.name === key);
        const newItem = fieldSchema?.itemFields?.reduce((acc, field) => {
            acc[field.name] = '';
            return acc;
        }, {} as {[key: string]: string}) || {};

        setFormData(prevData => {
            const updated = [...(prevData[key] || []), newItem];
            // Validate array after add
            const err = fieldSchema ? validateField(fieldSchema, updated) : null;
            setErrors(e => ({ ...e, [key]: err }));
            return {
                ...prevData,
                [key]: updated
            };
        });
    }, [schema.fields, validateField]);

    const removeArrayItem = useCallback((key: string, index: number) => {
        const fieldSchema = schema.fields.find(f => f.name === key);
        setFormData(prevData => {
            const newArray = [...(prevData[key] || [])];
            newArray.splice(index, 1);
            // Validate after remove
            const err = fieldSchema ? validateField(fieldSchema, newArray) : null;
            setErrors(e => ({ ...e, [key]: err }));
            return { ...prevData, [key]: newArray };
        });
    }, [schema.fields, validateField]);

    const handleSubmit = useCallback((event: React.FormEvent) => {
        event.preventDefault();
        // Validate all fields on submit
        const newErrors: Record<string, string | null> = {};
        for (const field of schema.fields) {
            const err = validateField(field, formData[field.name]);
            newErrors[field.name] = err;
        }
        setErrors(newErrors);
        const hasError = Object.values(newErrors).some(Boolean);
        if (hasError) return;
        onSubmit(formData);
    }, [formData, onSubmit, schema.fields, validateField]);

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
                    {errors[key] && <p className="text-sm text-destructive">{errors[key]}</p>}
                </div>
            );
        }

        // Input type adjustments
        const derivedInputType =
            field.format === 'email' ? 'email' :
            field.type === 'number' ? 'number' :
            field.type || 'text';

        return (
            <div key={key} className="grid w-full items-center gap-1.5">
                {field.type !== 'image' && (
                    <Label htmlFor={key}>{field.label}</Label>
                )}
                {
                    field.type === 'textarea' ? (
                        <>
                            <Textarea
                                id={key}
                                value={formData[key] || ''}
                                onChange={(e) => handleInputChange(key, e.target.value)}
                                placeholder={field.placeholder}
                                required={field.required}
                            />
                            {errors[key] && <p className="text-sm text-destructive">{errors[key]}</p>}
                        </>
                    ) : field.type === 'image' ? (
                        <>
                            <ImageUploader
                                label={field.label}
                                initialUrl={formData[key] || ''}
                                onUploadComplete={(url) => handleInputChange(key, url)}
                                acceptMime={field.acceptMime || 'image/*'}
                                maxSizeMB={field.maxSizeMB || 5}
                            />
                            {errors[key] && <p className="text-sm text-destructive">{errors[key]}</p>}
                        </>
                    ) : field.type === 'select' ? (
                        <>
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
                            {errors[key] && <p className="text-sm text-destructive">{errors[key]}</p>}
                        </>
                    ) : (
                        <>
                            <Input
                                type={derivedInputType}
                                id={key}
                                value={formData[key] ?? (field.type === 'number' ? '' : '')}
                                onChange={(e) => handleInputChange(key, e.target.value)}
                                placeholder={field.placeholder}
                                required={field.required}
                                // HTML-level constraints
                                min={field.type === 'number' && field.min !== undefined ? field.min : undefined}
                                max={field.type === 'number' && field.max !== undefined ? field.max : undefined}
                                step={field.type === 'number' && field.step !== undefined ? field.step : (field.integer ? 1 : undefined)}
                                pattern={field.pattern}
                                inputMode={field.type === 'number' ? 'decimal' : undefined}
                            />
                            {errors[key] && <p className="text-sm text-destructive">{errors[key]}</p>}
                        </>
                    )
                }
            </div>
        );
    }, [formData, errors, handleInputChange, handleArrayChange, addArrayItem, removeArrayItem]);

    const canSubmit = useMemo(() => {
        // Recompute validity
        for (const field of schema.fields) {
            const msg = validateField(field, formData[field.name]);
            if (msg) return false;
        }
        return true;
    }, [schema.fields, formData, validateField]);

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {schema.fields.map(field => renderField(field))}
            <Button type="submit" disabled={!canSubmit}>{submitButtonText}</Button>
        </form>
    );
}