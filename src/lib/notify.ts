import Swal from 'sweetalert2';

export interface ConfirmOptions {
  title: string;
  text?: string;
  html?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  icon?: 'warning' | 'question' | 'info' | 'error';
  confirmButtonColor?: string;
}

/**
 * Modern standard confirmation dialog replacing window.confirm
 */
export async function showConfirm(options: ConfirmOptions): Promise<boolean> {
  const result = await Swal.fire({
    title: options.title,
    text: options.text,
    html: options.html,
    icon: options.icon || 'question',
    showCancelButton: true,
    confirmButtonColor: options.confirmButtonColor || '#2563eb',
    cancelButtonColor: '#64748b',
    confirmButtonText: options.confirmButtonText || 'យល់ព្រម (Confirm)',
    cancelButtonText: options.cancelButtonText || 'បោះបង់ (Cancel)',
    reverseButtons: true,
    focusConfirm: false,
    customClass: {
      popup: 'swal2-custom-popup',
      title: 'swal2-custom-title',
      confirmButton: 'swal2-custom-btn-confirm',
      cancelButton: 'swal2-custom-btn-cancel',
    },
  });

  return result.isConfirmed;
}

/**
 * Modern standard success alert
 */
export async function showSuccess(title: string, text?: string) {
  return Swal.fire({
    icon: 'success',
    title,
    text,
    confirmButtonColor: '#059669',
    confirmButtonText: 'យល់ព្រម (OK)',
    timer: 2600,
    timerProgressBar: true,
    customClass: {
      popup: 'swal2-custom-popup',
      title: 'swal2-custom-title',
      confirmButton: 'swal2-custom-btn-confirm',
    },
  });
}

/**
 * Modern standard error alert
 */
export async function showError(title: string, text?: string) {
  return Swal.fire({
    icon: 'error',
    title,
    text,
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'យល់ព្រម (OK)',
    customClass: {
      popup: 'swal2-custom-popup',
      title: 'swal2-custom-title',
      confirmButton: 'swal2-custom-btn-confirm',
    },
  });
}

/**
 * Modern standard warning alert
 */
export async function showWarning(title: string, text?: string) {
  return Swal.fire({
    icon: 'warning',
    title,
    text,
    confirmButtonColor: '#f59e0b',
    confirmButtonText: 'យល់ព្រម (OK)',
    customClass: {
      popup: 'swal2-custom-popup',
      title: 'swal2-custom-title',
      confirmButton: 'swal2-custom-btn-confirm',
    },
  });
}

/**
 * Modern standard info alert
 */
export async function showInfo(title: string, text?: string) {
  return Swal.fire({
    icon: 'info',
    title,
    text,
    confirmButtonColor: '#3b82f6',
    confirmButtonText: 'យល់ព្រម (OK)',
    customClass: {
      popup: 'swal2-custom-popup',
      title: 'swal2-custom-title',
      confirmButton: 'swal2-custom-btn-confirm',
    },
  });
}

/**
 * Modern toast notification in top-right
 */
export function showToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    },
  });

  return Toast.fire({
    icon: type,
    title: message,
  });
}

export const notify = {
  confirm: showConfirm,
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
  toast: showToast,
};

export default notify;
