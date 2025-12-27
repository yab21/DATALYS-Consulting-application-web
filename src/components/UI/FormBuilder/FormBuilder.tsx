"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  Input,
  Textarea,
  Select,
  SelectItem,
  Switch,
  Button,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  RadioGroup,
  Radio,
  Slider,
} from "@heroui/react";
import { useForm, Controller, FieldValues, Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Types pour les champs du formulaire
export type FieldType =
  | "text"
  | "email"
  | "password"
  | "number"
  | "textarea"
  | "select"
  | "multiselect"
  | "checkbox"
  | "radio"
  | "switch"
  | "date"
  | "slider"
  | "file";

export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  description?: string;
  validation?: z.ZodType<any>;
  options?: { value: string | number; label: string; description?: string }[];
  min?: number;
  max?: number;
  step?: number;
  accept?: string; // Pour les fichiers
  multiple?: boolean;
  defaultValue?: any;
  grid?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
  };
  conditional?: {
    field: string;
    value: any;
    operator?:
      | "equals"
      | "not_equals"
      | "contains"
      | "greater_than"
      | "less_than";
  };
}

export interface FormSection {
  title: string;
  description?: string;
  fields: FormField[];
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export interface FormBuilderProps {
  sections: FormSection[];
  onSubmit: (data: FieldValues) => void | Promise<void>;
  loading?: boolean;
  defaultValues?: FieldValues;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  className?: string;
  validationSchema?: z.ZodType<any>;
  layout?: "vertical" | "horizontal";
  showProgress?: boolean;
}

// Générateur automatique de schéma Zod
const generateValidationSchema = (
  sections: FormSection[],
): z.ZodObject<any> => {
  const schemaFields: Record<string, z.ZodType<any>> = {};

  sections.forEach((section) => {
    section.fields.forEach((field) => {
      let fieldSchema: z.ZodType<any>;

      // Utiliser la validation personnalisée si fournie
      if (field.validation) {
        fieldSchema = field.validation;
      } else {
        // Génération automatique basée sur le type
        switch (field.type) {
          case "email":
            fieldSchema = z.string().email("Format email invalide");
            break;
          case "number":
            fieldSchema = z.number();
            if (field.min !== undefined)
              fieldSchema = (fieldSchema as z.ZodNumber).min(field.min);
            if (field.max !== undefined)
              fieldSchema = (fieldSchema as z.ZodNumber).max(field.max);
            break;
          case "password":
            fieldSchema = z.string().min(6, "Minimum 6 caractères");
            break;
          case "date":
            fieldSchema = z.date();
            break;
          case "checkbox":
            fieldSchema = z.boolean();
            break;
          case "multiselect":
            fieldSchema = z
              .array(z.string())
              .min(1, "Sélectionnez au moins une option");
            break;
          default:
            fieldSchema = z.string();
            if (field.min)
              fieldSchema = (fieldSchema as z.ZodString).min(field.min);
            if (field.max)
              fieldSchema = (fieldSchema as z.ZodString).max(field.max);
        }
      }

      // Rendre optionnel si pas requis
      if (!field.required) {
        fieldSchema = fieldSchema.optional();
      }

      schemaFields[field.name] = fieldSchema;
    });
  });

  return z.object(schemaFields);
};

export const FormBuilder: React.FC<FormBuilderProps> = ({
  sections,
  onSubmit,
  loading = false,
  defaultValues = {},
  submitLabel = "Valider",
  cancelLabel = "Annuler",
  onCancel,
  className,
  validationSchema,
  layout = "vertical",
  showProgress = false,
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    new Set(
      sections
        .map((_, index) =>
          sections[index].defaultExpanded !== false ? index : -1,
        )
        .filter((i) => i >= 0),
    ),
  );

  // Génération du schéma de validation
  const schema = validationSchema || generateValidationSchema(sections);

  // Configuration React Hook Form
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = useForm({
    resolver: zodResolver(schema as any),
    defaultValues,
    mode: "onChange",
  });

  const watchedValues = watch();

  // Gestion des sections expansibles
  const toggleSection = useCallback((index: number) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  // Vérification des conditions d'affichage
  const shouldShowField = useCallback(
    (field: FormField): boolean => {
      if (!field.conditional) return true;

      const fieldValue = watchedValues[field.conditional.field];
      const targetValue = field.conditional.value;
      const operator = field.conditional.operator || "equals";

      switch (operator) {
        case "equals":
          return fieldValue === targetValue;
        case "not_equals":
          return fieldValue !== targetValue;
        case "contains":
          return Array.isArray(fieldValue) && fieldValue.includes(targetValue);
        case "greater_than":
          return Number(fieldValue) > Number(targetValue);
        case "less_than":
          return Number(fieldValue) < Number(targetValue);
        default:
          return true;
      }
    },
    [watchedValues],
  );

  // Rendu des champs
  const renderField = useCallback(
    (field: FormField, sectionIndex: number, fieldIndex: number) => {
      if (!shouldShowField(field)) return null;

      const fieldError = errors[field.name];
      const fieldId = `${sectionIndex}-${fieldIndex}-${field.name}`;

      return (
        <motion.div
          key={field.name}
          className={cn(
            "w-full",
            field.grid
              ? `col-span-${field.grid.sm || 1} md:col-span-${field.grid.md || field.grid.sm || 1}`
              : "",
          )}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: fieldIndex * 0.05 }}
        >
          <Controller
            name={field.name as Path<FieldValues>}
            control={control}
            render={({ field: { onChange, value, ...fieldProps } }) => {
              switch (field.type) {
                case "textarea":
                  return (
                    <Textarea
                      {...fieldProps}
                      id={fieldId}
                      label={field.label}
                      placeholder={field.placeholder}
                      description={field.description}
                      isRequired={field.required}
                      isDisabled={field.disabled}
                      isInvalid={!!fieldError}
                      errorMessage={fieldError?.message as string}
                     
                      onValueChange={onChange}
                      minRows={3}
                      classNames={{
                        label: "text-gray-800 dark:text-gray-200 font-medium",
                        description: "text-gray-600 dark:text-gray-400",
                        input: "text-gray-900 dark:text-white",
                        inputWrapper:
                          "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600",
                      }}
                    />
                  );

                case "select":
                  return (
                    <Select
                      {...fieldProps}
                      id={fieldId}
                      label={field.label}
                      placeholder={field.placeholder}
                      description={field.description}
                      isRequired={field.required}
                      isDisabled={field.disabled}
                      isInvalid={!!fieldError}
                      errorMessage={fieldError?.message as string}
                      selectedKeys={value ? [value] : []}
                      onSelectionChange={(keys) => {
                        const selectedValue = Array.from(keys)[0];
                        onChange(selectedValue);
                      }}
                      classNames={{
                        label: "text-gray-800 dark:text-gray-200 font-medium",
                        description: "text-gray-600 dark:text-gray-400",
                        trigger:
                          "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600",
                        value: "text-gray-900 dark:text-white",
                      }}
                    >
                      {field.options?.map((option) => (
                        <SelectItem key={option.value}>
                          {option.label}
                        </SelectItem>
                      )) || []}
                    </Select>
                  );

                case "multiselect":
                  return (
                    <Select
                      {...fieldProps}
                      id={fieldId}
                      label={field.label}
                      placeholder={field.placeholder}
                      description={field.description}
                      isRequired={field.required}
                      isDisabled={field.disabled}
                      isInvalid={!!fieldError}
                      errorMessage={fieldError?.message as string}
                      selectionMode="multiple"
                      selectedKeys={value || []}
                      onSelectionChange={(keys) => onChange(Array.from(keys))}
                      classNames={{
                        label: "text-gray-800 dark:text-gray-200 font-medium",
                        description: "text-gray-600 dark:text-gray-400",
                        trigger:
                          "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600",
                        value: "text-gray-900 dark:text-white",
                      }}
                    >
                      {field.options?.map((option) => (
                        <SelectItem key={option.value}>
                          {option.label}
                        </SelectItem>
                      )) || []}
                    </Select>
                  );

                case "checkbox":
                  return (
                    <div className="flex flex-col gap-2">
                      <Checkbox
                        {...fieldProps}
                        id={fieldId}
                        isSelected={value || false}
                        onValueChange={onChange}
                        isRequired={field.required}
                        isDisabled={field.disabled}
                        isInvalid={!!fieldError}
                        classNames={{
                          label: "text-gray-900 dark:text-white",
                        }}
                      >
                        {field.label}
                      </Checkbox>
                      {field.description && (
                        <p className="text-small text-gray-500 dark:text-gray-400">
                          {field.description}
                        </p>
                      )}
                      {fieldError && (
                        <p className="text-small text-danger">
                          {fieldError.message as string}
                        </p>
                      )}
                    </div>
                  );

                case "radio":
                  return (
                    <RadioGroup
                      {...fieldProps}
                      id={fieldId}
                      label={field.label}
                      description={field.description}
                      isRequired={field.required}
                      isDisabled={field.disabled}
                      isInvalid={!!fieldError}
                      errorMessage={fieldError?.message as string}
                     
                      onValueChange={onChange}
                      classNames={{
                        label: "text-gray-800 dark:text-gray-200 font-medium",
                        description: "text-gray-600 dark:text-gray-400",
                      }}
                    >
                      {field.options?.map((option) => (
                        <Radio key={option.value} value={String(option.value)}>
                          {option.label}
                          {option.description && (
                            <p className="text-small text-default-400">
                              {option.description}
                            </p>
                          )}
                        </Radio>
                      )) || []}
                    </RadioGroup>
                  );

                case "switch":
                  return (
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-600 dark:bg-gray-700">
                      <div>
                        <label
                          htmlFor={fieldId}
                          className="text-medium font-medium text-gray-900 dark:text-white"
                        >
                          {field.label}
                          {field.required && (
                            <span className="ml-1 text-danger">*</span>
                          )}
                        </label>
                        {field.description && (
                          <p className="text-small text-gray-500 dark:text-gray-400">
                            {field.description}
                          </p>
                        )}
                      </div>
                      <Switch
                        {...fieldProps}
                        id={fieldId}
                        isSelected={value || false}
                        onValueChange={onChange}
                        isDisabled={field.disabled}
                      />
                    </div>
                  );

                case "slider":
                  return (
                    <div className="space-y-2">
                      <label
                        htmlFor={fieldId}
                        className="text-medium font-medium text-gray-900 dark:text-white"
                      >
                        {field.label}
                        {field.required && (
                          <span className="ml-1 text-danger">*</span>
                        )}
                      </label>
                      <Slider
                        {...fieldProps}
                        id={fieldId}
                        minValue={field.min || 0}
                        maxValue={field.max || 100}
                        step={field.step || 1}
                       
                        onChange={onChange}
                        isDisabled={field.disabled}
                        className="max-w-md"
                      />
                      {field.description && (
                        <p className="text-small text-gray-500 dark:text-gray-400">
                          {field.description}
                        </p>
                      )}
                      {fieldError && (
                        <p className="text-small text-danger">
                          {fieldError.message as string}
                        </p>
                      )}
                    </div>
                  );

                case "number":
                  return (
                    <Input
                      {...fieldProps}
                      id={fieldId}
                      type="number"
                      label={field.label}
                      placeholder={field.placeholder}
                      description={field.description}
                      isRequired={field.required}
                      isDisabled={field.disabled}
                      isInvalid={!!fieldError}
                      errorMessage={fieldError?.message as string}
                     
                      onValueChange={(val) => onChange(val ? Number(val) : "")}
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      classNames={{
                        label: "text-gray-800 dark:text-gray-200 font-medium",
                        description: "text-gray-600 dark:text-gray-400",
                        input: "text-gray-900 dark:text-white",
                        inputWrapper:
                          "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600",
                      }}
                    />
                  );

                default:
                  return (
                    <Input
                      {...fieldProps}
                      id={fieldId}
                      type={
                        field.type === "password"
                          ? "password"
                          : field.type === "email"
                            ? "email"
                            : "text"
                      }
                      label={field.label}
                      placeholder={field.placeholder}
                      description={field.description}
                      isRequired={field.required}
                      isDisabled={field.disabled}
                      isInvalid={!!fieldError}
                      errorMessage={fieldError?.message as string}
                     
                      onValueChange={onChange}
                      classNames={{
                        label: "text-gray-800 dark:text-gray-200 font-medium",
                        description: "text-gray-600 dark:text-gray-400",
                        input: "text-gray-900 dark:text-white",
                        inputWrapper:
                          "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600",
                      }}
                    />
                  );
              }
            }}
          />
        </motion.div>
      );
    },
    [control, errors, shouldShowField],
  );

  // Soumission du formulaire
  const handleFormSubmit = useCallback(
    async (data: FieldValues) => {
      try {
        await onSubmit(data);
      } catch (error) {
        console.error("Erreur lors de la soumission:", error);
      }
    },
    [onSubmit],
  );

  // Calcul du progrès
  const progress = useMemo(() => {
    if (!showProgress) return 0;
    const totalFields = sections.reduce(
      (acc, section) => acc + section.fields.length,
      0,
    );
    const filledFields = Object.values(watchedValues).filter(
      (value) => value !== undefined && value !== null && value !== "",
    ).length;
    return Math.round((filledFields / totalFields) * 100);
  }, [sections, watchedValues, showProgress]);

  return (
    <div className={cn("mx-auto w-full max-w-4xl", className)}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Barre de progression */}
        {showProgress && (
          <Card>
            <CardBody className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-small font-medium">
                  Progression du formulaire
                </span>
                <span className="text-small text-default-400">{progress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-default-200">
                <div
                  className="h-2 rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </CardBody>
          </Card>
        )}

        {/* Sections du formulaire */}
        {sections.map((section, sectionIndex) => (
          <motion.div
            key={sectionIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: sectionIndex * 0.1 }}
          >
            <Card>
              <CardHeader
                className={cn(
                  "pb-3",
                  section.collapsible && "cursor-pointer hover:bg-default-50",
                )}
                onClick={
                  section.collapsible
                    ? () => toggleSection(sectionIndex)
                    : undefined
                }
              >
                <div className="flex w-full items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{section.title}</h3>
                    {section.description && (
                      <p className="mt-1 text-small text-default-400">
                        {section.description}
                      </p>
                    )}
                  </div>
                  {section.collapsible && (
                    <Button
                      isIconOnly
                      variant="light"
                      size="sm"
                      className="ml-2"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className={cn(
                          "transition-transform",
                          expandedSections.has(sectionIndex)
                            ? "rotate-180"
                            : "",
                        )}
                      >
                        <path d="M7 10l5 5 5-5z" />
                      </svg>
                    </Button>
                  )}
                </div>
              </CardHeader>

              {(!section.collapsible || expandedSections.has(sectionIndex)) && (
                <CardBody className="pt-0">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {section.fields.map((field, fieldIndex) =>
                      renderField(field, sectionIndex, fieldIndex),
                    )}
                  </div>
                </CardBody>
              )}
            </Card>
          </motion.div>
        ))}

        {/* Actions du formulaire */}
        <div className="flex flex-col justify-end gap-3 pt-6 sm:flex-row">
          {onCancel && (
            <Button
              variant="flat"
              onPress={onCancel}
              isDisabled={loading || isSubmitting}
              className="order-2 sm:order-1"
            >
              {cancelLabel}
            </Button>
          )}
          <Button
            type="submit"
            color="primary"
            isLoading={loading || isSubmitting}
            isDisabled={!isValid}
            className="order-1 sm:order-2"
          >
            {loading || isSubmitting ? "Traitement..." : submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default FormBuilder;
