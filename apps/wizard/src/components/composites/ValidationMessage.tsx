interface ValidationMessageProps {
  id?: string;
  message: string;
}

/** Renders a field-level validation error. Associates via id for aria-describedby. */
export function ValidationMessage({ id, message }: ValidationMessageProps): JSX.Element {
  return (
    <p id={id} className="mt-1 text-sm text-danger">
      {message}
    </p>
  );
}
