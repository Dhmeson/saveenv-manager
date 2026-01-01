import { Clipboard } from 'lucide-react';

interface PasteButtonProps {
  onPaste:  (index: number, field: "name" | "value", value: string) => void;
  className?: string;
  title?: string;
  disabled?: boolean;
  index:number,
  field:'name'|'value'
}

export const PasteButton: React.FC<PasteButtonProps> = ({
  onPaste,
  className = "absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
  title = "",
  disabled = false,
  field,index
}) => {
  const handleClick = async () => {
    if (disabled) return;
    
    try {
      const text = await navigator.clipboard.readText();
      onPaste(index,field,text);
    } catch (err) {
      console.error(':', err);
      // Fallback: mostrar alerta para o usuário tentar Ctrl+V
      alert('Error');
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
      title={title}
      disabled={disabled}
    >
      <Clipboard className="w-4 h-4" />
    </button>
  );
};

// Exemplo de uso:
// <PasteButton 
//   onPaste={(text) => updateVariable(index, 'name', text)}
//   title="Colar nome da variável"
// />

// Com customização:
// <PasteButton 
//   onPaste={(text) => updateVariable(index, 'value', text)}
//   className="custom-paste-button"
//   disabled={isLoading}
// />