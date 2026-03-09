import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Cta() {
  return (
    <section className="w-full bg-primary py-20 md:py-28">
      <div className="container mx-auto flex flex-col items-center gap-8 px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-extrabold leading-tight text-primary-foreground md:text-4xl lg:text-5xl">
          Prêt à produire votre premier prévisionnel ?
        </h2>
        <p className="max-w-xl text-base leading-relaxed text-primary-foreground/80 md:text-lg">
          Rejoignez des milliers de particuliers qui ont construit leur dossier
          de financement avec Previsia, sans comptable.
        </p>
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="#"
            className={cn(
              buttonVariants({ size: "lg" }),
              "bg-background text-foreground hover:bg-background/90 gap-2"
            )}
          >
            Commencer gratuitement
            <ArrowRightIcon className="size-4" />
          </Link>
          <Link
            href="#"
            className={cn(
              buttonVariants({ variant: "ghost", size: "lg" }),
              "text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            )}
          >
            Voir la démo
          </Link>
        </div>
        <p className="text-sm text-primary-foreground/60">
          14 jours d&apos;essai gratuit · Sans carte bancaire · Sans engagement
        </p>
      </div>
    </section>
  );
}
