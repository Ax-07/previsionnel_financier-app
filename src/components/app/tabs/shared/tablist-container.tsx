import { cn } from "@/lib/utils";

/**
 * Container pour les listes d'onglets, avec styles communs.
 * Utilisé pour la barre des onglets principale.
 */
export const TablistContainer: React.FC<React.ComponentProps<"div">> = ({ className, ...props }) => {
  return <div className={cn("shrink-0 overflow-x-auto overflow-y-hidden border-b border-accent-foreground bg-primary/80 text-primary-foreground", className)} {...props} />;
};
/**
 * Container pour les listes d'onglets, avec styles communs.
 * Utilisé pour la barre des sous-onglets.
 */
export const SubTablistContainer: React.FC<React.ComponentProps<"div">> = ({ className, ...props }) => {
  return <div className={cn("shrink-0 overflow-x-auto overflow-y-hidden border-b border-accent-foreground bg-primary/60 text-primary-foreground", className)} {...props} />;
};

export const TabContentContainer: React.FC<React.ComponentProps<"div">> = ({ className, ...props }) => {
  return <div className={cn("px-32 py-8", className)} {...props} />;
};