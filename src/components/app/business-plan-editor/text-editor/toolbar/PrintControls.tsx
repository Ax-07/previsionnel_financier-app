import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export const PrintControls: React.FC = () => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Button 
        variant="ghost" 
        size="default" 
        className="my-0.5" 
        onClick={handlePrint} 
        aria-label="Imprimer"
        title="Imprimer"
    >
      <Printer className="h-4 w-4" />
    </Button>
  );
};
