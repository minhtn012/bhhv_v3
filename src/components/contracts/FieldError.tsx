interface FieldErrorProps {
  fieldName: string;
  errors: Record<string, string>;
}

export default function FieldError({ fieldName, errors }: FieldErrorProps) {
  const error = errors[fieldName];
  if (!error) return null;
  
  return (
    <div className="text-red-400 text-sm mt-1">
      {error}
    </div>
  );
}