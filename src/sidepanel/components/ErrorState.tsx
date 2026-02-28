interface Props { message: string; }

export function ErrorState({ message }: Props) {
  return (
    <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
      {message}
    </div>
  );
}
