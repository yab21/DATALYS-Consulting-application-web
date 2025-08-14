"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useNotifications, notificationHelpers } from "@/components/UI/Notifications/NotificationSystem";

interface UseOptimizedFormOptions<T> {
  initialValues: T;
  onSubmit: (values: T) => Promise<void> | void;
  validate?: (values: T) => Record<string, string> | null;
  autoSave?: boolean;
  autoSaveDelay?: number;
  debounceDelay?: number;
  enableDrafts?: boolean;
  draftKey?: string;
  onAutoSave?: (values: T) => void;
}

interface UseOptimizedFormReturn<T> {
  values: T;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isDirty: boolean;
  isAutoSaving: boolean;
  touched: Record<string, boolean>;
  setValue: (key: keyof T, value: any) => void;
  setValues: (values: Partial<T>) => void;
  setError: (key: keyof T, error: string) => void;
  clearError: (key: keyof T) => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  reset: (newValues?: T) => void;
  saveDraft: () => void;
  loadDraft: () => boolean;
  clearDraft: () => void;
  validateField: (key: keyof T) => boolean;
  validateForm: () => boolean;
}

export function useOptimizedForm<T extends Record<string, any>>({
  initialValues,
  onSubmit,
  validate,
  autoSave = false,
  autoSaveDelay = 3000,
  debounceDelay = 300,
  enableDrafts = true,
  draftKey,
  onAutoSave,
}: UseOptimizedFormOptions<T>): UseOptimizedFormReturn<T> {
  
  const { showNotification } = useNotifications();
  
  // États
  const [values, setValuesState] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isDirty, setIsDirty] = useState(false);
  
  // Refs pour les timers
  const debounceTimer = useRef<NodeJS.Timeout>();
  const autoSaveTimer = useRef<NodeJS.Timeout>();
  const initialValuesRef = useRef(initialValues);
  
  // Clé unique pour les drafts
  const finalDraftKey = draftKey || `form_draft_${JSON.stringify(initialValues).substring(0, 50)}`;

  // Charger le draft au montage
  useEffect(() => {
    if (enableDrafts) {
      loadDraft();
    }
  }, []);

  // Effet pour détecter les changements
  useEffect(() => {
    const hasChanged = JSON.stringify(values) !== JSON.stringify(initialValuesRef.current);
    setIsDirty(hasChanged);
  }, [values]);

  // Auto-save
  useEffect(() => {
    if (!autoSave || !isDirty) return;

    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    autoSaveTimer.current = setTimeout(() => {
      handleAutoSave();
    }, autoSaveDelay);

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [values, isDirty, autoSave, autoSaveDelay]);

  // Fonction d'auto-save
  const handleAutoSave = useCallback(async () => {
    if (!validateForm() || !isDirty) return;

    setIsAutoSaving(true);
    try {
      if (onAutoSave) {
        await onAutoSave(values);
      } else if (enableDrafts) {
        saveDraft();
      }
      
      showNotification(notificationHelpers.success(
        "Sauvegarde automatique",
        "Vos modifications ont été sauvegardées"
      ));
    } catch (error) {
      showNotification(notificationHelpers.error(
        "Erreur de sauvegarde",
        "Impossible de sauvegarder automatiquement"
      ));
    } finally {
      setIsAutoSaving(false);
    }
  }, [values, isDirty, onAutoSave, enableDrafts, showNotification]);

  // Fonction pour définir une valeur avec debouncing
  const setValue = useCallback((key: keyof T, value: any) => {
    setValuesState(prev => ({ ...prev, [key]: value }));
    setTouched(prev => ({ ...prev, [key]: true }));
    
    // Clear l'erreur si elle existe
    if (errors[key as string]) {
      clearError(key);
    }

    // Validation avec debounce
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      validateField(key);
    }, debounceDelay);
  }, [errors, debounceDelay]);

  // Fonction pour définir plusieurs valeurs
  const setValues = useCallback((newValues: Partial<T>) => {
    setValuesState(prev => ({ ...prev, ...newValues }));
    
    // Marquer tous les champs comme touchés
    const touchedFields = Object.keys(newValues).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    
    setTouched(prev => ({ ...prev, ...touchedFields }));
  }, []);

  // Gestion des erreurs
  const setError = useCallback((key: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [key as string]: error }));
  }, []);

  const clearError = useCallback((key: keyof T) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[key as string];
      return newErrors;
    });
  }, []);

  // Validation d'un champ
  const validateField = useCallback((key: keyof T): boolean => {
    if (!validate) return true;

    const fieldErrors = validate(values);
    const fieldError = fieldErrors?.[key as string];

    if (fieldError) {
      setError(key, fieldError);
      return false;
    } else {
      clearError(key);
      return true;
    }
  }, [values, validate, setError, clearError]);

  // Validation du formulaire complet
  const validateForm = useCallback((): boolean => {
    if (!validate) return true;

    const formErrors = validate(values);
    
    if (formErrors && Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return false;
    } else {
      setErrors({});
      return true;
    }
  }, [values, validate]);

  // Soumission du formulaire
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!validateForm()) {
      showNotification(notificationHelpers.error(
        "Erreurs de validation",
        "Veuillez corriger les erreurs avant de soumettre"
      ));
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit(values);
      
      // Reset dirty state et clear draft
      setIsDirty(false);
      initialValuesRef.current = values;
      if (enableDrafts) {
        clearDraft();
      }
      
      showNotification(notificationHelpers.success(
        "Succès",
        "Formulaire soumis avec succès"
      ));
    } catch (error) {
      showNotification(notificationHelpers.error(
        "Erreur de soumission",
        error instanceof Error ? error.message : "Une erreur est survenue"
      ));
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validateForm, onSubmit, enableDrafts, showNotification]);

  // Reset du formulaire
  const reset = useCallback((newValues?: T) => {
    const resetValues = newValues || initialValues;
    setValuesState(resetValues);
    setErrors({});
    setTouched({});
    setIsDirty(false);
    initialValuesRef.current = resetValues;
    
    if (enableDrafts) {
      clearDraft();
    }
  }, [initialValues, enableDrafts]);

  // Gestion des drafts
  const saveDraft = useCallback(() => {
    if (!enableDrafts) return;
    
    try {
      localStorage.setItem(finalDraftKey, JSON.stringify({
        values,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.warn("Impossible de sauvegarder le draft:", error);
    }
  }, [values, finalDraftKey, enableDrafts]);

  const loadDraft = useCallback((): boolean => {
    if (!enableDrafts) return false;
    
    try {
      const draftData = localStorage.getItem(finalDraftKey);
      if (!draftData) return false;

      const { values: draftValues, timestamp } = JSON.parse(draftData);
      
      // Vérifier si le draft n'est pas trop ancien (24h)
      const maxAge = 24 * 60 * 60 * 1000; // 24 heures
      if (Date.now() - timestamp > maxAge) {
        clearDraft();
        return false;
      }

      setValuesState(draftValues);
      setIsDirty(true);
      
      showNotification(notificationHelpers.info(
        "Draft chargé",
        "Un brouillon de ce formulaire a été restauré"
      ));
      
      return true;
    } catch (error) {
      console.warn("Impossible de charger le draft:", error);
      return false;
    }
  }, [finalDraftKey, enableDrafts, showNotification]);

  const clearDraft = useCallback(() => {
    if (!enableDrafts) return;
    
    try {
      localStorage.removeItem(finalDraftKey);
    } catch (error) {
      console.warn("Impossible de supprimer le draft:", error);
    }
  }, [finalDraftKey, enableDrafts]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, []);

  return {
    values,
    errors,
    isSubmitting,
    isDirty,
    isAutoSaving,
    touched,
    setValue,
    setValues,
    setError,
    clearError,
    handleSubmit,
    reset,
    saveDraft,
    loadDraft,
    clearDraft,
    validateField,
    validateForm,
  };
}