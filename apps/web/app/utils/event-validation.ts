export interface EventFormData {
  title?: string;
  description?: string;
  location?: string;
  capacity?: number | string | null;
  startsAt?: string;
}

export interface ValidationOptions {
  minCapacity?: number;
  checkStartsAt?: boolean;
}

/**
 * Valida los datos del formulario de creación y edición de eventos.
 * Retorna el mensaje de error en español o `null` si es válido.
 */
export function validateEventForm(
  form: EventFormData,
  options: ValidationOptions = {}
): string | null {
  const title = (form.title ?? '').trim();
  if (!title) {
    return 'El título es obligatorio.';
  }
  if (title.length < 3) {
    return 'El título debe tener al menos 3 caracteres.';
  }
  if (title.length > 120) {
    return 'El título no puede exceder 120 caracteres.';
  }

  if (form.capacity === '' || form.capacity === null || form.capacity === undefined) {
    return 'El aforo (capacity) es obligatorio.';
  }
  const capacity = Number(form.capacity);
  if (!Number.isInteger(capacity) || capacity <= 0) {
    return 'El aforo debe ser un número entero mayor a 0.';
  }
  if (capacity > 100_000) {
    return 'El aforo no puede exceder 100,000 lugares.';
  }

  if (options.minCapacity !== undefined && capacity < options.minCapacity) {
    return `El nuevo aforo (${capacity}) no puede ser menor al número de asistentes ya registrados (${options.minCapacity}).`;
  }

  if (options.checkStartsAt) {
    if (!form.startsAt) {
      return 'La fecha de inicio (startsAt) es obligatoria.';
    }
    const date = new Date(form.startsAt);
    if (isNaN(date.getTime())) {
      return 'La fecha de inicio no tiene un formato válido.';
    }
    if (date.getTime() <= Date.now()) {
      return 'La fecha de inicio debe ser una fecha futura.';
    }
  }

  return null;
}
