"use client";

import { useState, useCallback } from 'react';

export interface AlertState {
  isOpen: boolean;
  type: 'success' | 'error' | 'warning' | 'info' | 'confirm';
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  loading?: boolean;
}

export const useAlert = () => {
  const [alertState, setAlertState] = useState<AlertState>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  const showAlert = useCallback((config: Omit<AlertState, 'isOpen'>) => {
    setAlertState({
      ...config,
      isOpen: true
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertState(prev => ({
      ...prev,
      isOpen: false
    }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setAlertState(prev => ({
      ...prev,
      loading
    }));
  }, []);

  // Méthodes de convenance
  const showSuccess = useCallback((title: string, message: string, onConfirm?: () => void) => {
    showAlert({
      type: 'success',
      title,
      message,
      confirmText: 'OK',
      onConfirm
    });
  }, [showAlert]);

  const showError = useCallback((title: string, message: string, onConfirm?: () => void) => {
    showAlert({
      type: 'error',
      title,
      message,
      confirmText: 'OK',
      onConfirm
    });
  }, [showAlert]);

  const showWarning = useCallback((title: string, message: string, onConfirm?: () => void) => {
    showAlert({
      type: 'warning',
      title,
      message,
      confirmText: 'OK',
      onConfirm
    });
  }, [showAlert]);

  const showInfo = useCallback((title: string, message: string, onConfirm?: () => void) => {
    showAlert({
      type: 'info',
      title,
      message,
      confirmText: 'OK',
      onConfirm
    });
  }, [showAlert]);

  const showConfirm = useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    options?: {
      confirmText?: string;
      cancelText?: string;
    }
  ) => {
    showAlert({
      type: 'confirm',
      title,
      message,
      confirmText: options?.confirmText || 'Confirmer',
      cancelText: options?.cancelText || 'Annuler',
      onConfirm,
      onCancel
    });
  }, [showAlert]);

  return {
    alertState,
    showAlert,
    hideAlert,
    setLoading,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm
  };
};

export default useAlert;