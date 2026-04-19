import { cn } from "@/lib/utils";

export const ControlTabContainer: React.FC<React.ComponentProps<"section">> = ({className, ...props }) => {
    return <section className={cn("flex flex-col gap-4 h-full overflow-hidden p-6", className)} {...props}/>;
};