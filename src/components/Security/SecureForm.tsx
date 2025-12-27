'use client';

import React, { useState, useCallback, FormEvent } from 'react';
import { Card, CardBody, Button, Input, Chip } from '@heroui/react';
import { Shield, AlertTriangle, CheckCircle, Lock } from 'lucide-react';
import { Permission } from '@/lib/permissions';
import { useSecureAPI } from '@/hooks/useSecureAPI';

interface SecureFormProps {
  children: React.ReactNode;
  onSubmit: (data: FormData | any) => Promise<any>;
  requiredPermissions?: Permission | Permission[];
  validateData?: (data: any) => { valid: boolean; errors?: string[] };
  title?: string;
  description?: string;
  submitText?: string;
  className?: string;
  disabled?: boolean;
  showSecurityInfo?: boolean;
}

export function SecureForm({
  children,
  onSubmit,
  requiredPermissions,
  validateData,
  title,
  description,
  submitText = 'Envoyer',
  className = '',
  disabled = false,
  showSecurityInfo = true
}: SecureFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState<string | null>(null);
  
  const { validateAndSend, hasPermission, isAuthenticated, user } = useSecureAPI();

  // Vérifier les permissions au rendu
  const hasRequiredPermissions = requiredPermissions 
    ? (Array.isArray(requiredPermissions) 
        ? requiredPermissions.some(p => hasPermission(p))
        : hasPermission(requiredPermissions))
    : true;

  const handleSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!hasRequiredPermissions || disabled) return;

    setIsSubmitting(true);
    setErrors([]);
    setSuccess(null);

    try {
      const formData = new FormData(event.currentTarget);
      const data = Object.fromEntries(formData.entries());

      const result = await validateAndSend(
        data,
        onSubmit,
        {
          requirePermissions: requiredPermissions,
          validateData
        }
      );

      if (result.error) {
        setErrors([result.error]);
      } else {
        setSuccess('Opération réussie !');
        // Réinitialiser le formulaire
        (event.target as HTMLFormElement).reset();
      }
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Erreur inconnue']);
    } finally {
      setIsSubmitting(false);
    }
  }, [hasRequiredPermissions, disabled, validateAndSend, onSubmit, requiredPermissions, validateData]);

  // Affichage si pas authentifié
  if (!isAuthenticated) {
    return (
      <Card className={className}>
        <CardBody className="text-center p-8">
          <Lock className="w-8 h-8 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Authentification requise</h3>
          <p className="text-gray-600">Connectez-vous pour accéder à ce formulaire.</p>
        </CardBody>
      </Card>
    );
  }

  // Affichage si permissions insuffisantes
  if (!hasRequiredPermissions) {
    return (
      <Card className={className}>
        <CardBody className="text-center p-8">
          <Shield className="w-8 h-8 text-danger-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Accès restreint</h3>
          <p className="text-gray-600">
            Vous n'avez pas les permissions nécessaires pour utiliser ce formulaire.
          </p>
          {process.env.NODE_ENV === 'development' && requiredPermissions && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
              <strong>Permissions requises:</strong> {' '}
              {Array.isArray(requiredPermissions) 
                ? requiredPermissions.join(', ') 
                : requiredPermissions}
            </div>
          )}
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardBody className="p-6">
        {/* En-tête du formulaire */}
        {(title || description) && (
          <div className="mb-6">
            {title && (
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-gray-600">
                {description}
              </p>
            )}
          </div>
        )}

        {/* Informations de sécurité */}
        {showSecurityInfo && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-medium">Formulaire sécurisé</span>
            </div>
            <p className="text-blue-700 text-xs mt-1">
              Connecté en tant que: <strong>{user?.name}</strong> • 
              Rôle: <strong>{user?.role_id === 1 ? 'Administrateur' : 'Partenaire'}</strong>
            </p>
          </div>
        )}

        {/* Messages d'erreur */}
        {errors.length > 0 && (
          <div className="mb-4 p-4 bg-danger-50 border border-danger-200 rounded-lg">
            <div className="flex items-center gap-2 text-danger-800 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">Erreur{errors.length > 1 ? 's' : ''}</span>
            </div>
            <ul className="text-danger-700 text-sm">
              {errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Message de succès */}
        {success && (
          <div className="mb-4 p-4 bg-success-50 border border-success-200 rounded-lg">
            <div className="flex items-center gap-2 text-success-800">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">{success}</span>
            </div>
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {children}
          
          {/* Bouton de soumission */}
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              color="primary"
              isLoading={isSubmitting}
              disabled={disabled || !hasRequiredPermissions}
              startContent={!isSubmitting && <Shield className="w-4 h-4" />}
            >
              {isSubmitting ? 'Traitement...' : submitText}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

// Composant d'input sécurisé avec validation
interface SecureInputProps {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  validation?: (value: string) => string | null;
  sensitive?: boolean; // Pour les données sensibles
  disabled?: boolean;
  className?: string;
}

export function SecureInput({
  name,
  label,
  type = 'text',
  required = false,
  placeholder,
  validation,
  sensitive = false,
  disabled = false,
  className = ''
}: SecureInputProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const handleChange = (newValue: string) => {
    setValue(newValue);
    
    if (touched && validation) {
      setError(validation(newValue));
    }
  };

  const handleBlur = () => {
    setTouched(true);
    if (validation) {
      setError(validation(value));
    }
  };

  return (
    <div className={className}>
      <Input
        name={name}
        label={label}
        type={type}
       
        onValueChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        isInvalid={touched && !!error}
        errorMessage={touched && error}
        endContent={sensitive && <Lock className="w-4 h-4 text-gray-400" />}
      />
    </div>
  );
}

// Hook pour valider des formulaires sécurisés
export function useSecureFormValidation() {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValid, setIsValid] = useState(false);

  const validateField = useCallback((name: string, value: any, rules: any) => {
    const fieldErrors: string[] = [];

    // Validation required
    if (rules.required && (!value || value.toString().trim() === '')) {
      fieldErrors.push('Ce champ est requis');
    }

    // Validation email
    if (rules.email && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      fieldErrors.push('Format email invalide');
    }

    // Validation longueur minimum
    if (rules.minLength && value && value.toString().length < rules.minLength) {
      fieldErrors.push(`Minimum ${rules.minLength} caractères`);
    }

    // Validation pattern
    if (rules.pattern && value && !rules.pattern.test(value)) {
      fieldErrors.push('Format invalide');
    }

    // Validation personnalisée
    if (rules.custom && value) {
      const customError = rules.custom(value);
      if (customError) fieldErrors.push(customError);
    }

    return fieldErrors.length > 0 ? fieldErrors[0] : null;
  }, []);

  const updateField = useCallback((name: string, value: any, rules?: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (rules) {
      const error = validateField(name, value, rules);
      setErrors(prev => ({ ...prev, [name]: error || '' }));
    }
  }, [validateField]);

  const validateForm = useCallback((validationRules: Record<string, any>) => {
    const newErrors: Record<string, string> = {};
    let hasErrors = false;

    Object.keys(validationRules).forEach(fieldName => {
      const error = validateField(fieldName, formData[fieldName], validationRules[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        hasErrors = true;
      }
    });

    setErrors(newErrors);
    setIsValid(!hasErrors);
    
    return !hasErrors;
  }, [formData, validateField]);

  return {
    formData,
    errors,
    isValid,
    updateField,
    validateForm,
    setFormData,
    clearErrors: () => setErrors({}),
    clearForm: () => {
      setFormData({});
      setErrors({});
      setIsValid(false);
    }
  };
}