import Link from "next/link";
import { BarChart3Icon } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const footerLinks = {
  Produit: [
    { label: "Fonctionnalités", href: "#fonctionnalites" },
    { label: "Modules", href: "#modules" },
    { label: "Tarifs", href: "#tarifs" },
    { label: "Roadmap", href: "#" },
  ],
  Ressources: [
    { label: "Documentation", href: "#" },
    { label: "Guides", href: "#" },
    { label: "FAQ", href: "#faq" },
    { label: "Changelog", href: "#" },
  ],
  Légal: [
    { label: "Mentions légales", href: "#" },
    { label: "CGU", href: "#" },
    { label: "Politique de confidentialité", href: "#" },
    { label: "RGPD", href: "#" },
  ],
};

export default function Footer() {
  return (
    <footer className="w-full bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2 font-bold text-foreground">
              <BarChart3Icon className="size-5 text-primary" />
              <span>Previsia</span>
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Le prévisionnel financier professionnel accessible à tous.
              Les outils des experts-comptables, sans la complexité.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category} className="flex flex-col gap-3">
              <h4 className="text-sm font-semibold text-foreground">{category}</h4>
              <ul className="flex flex-col gap-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator />

        <div className="flex flex-col items-center justify-between gap-3 py-6 text-sm text-muted-foreground sm:flex-row">
          <span>© 2026 Previsia. Tous droits réservés.</span>
          <span>Le prévisionnel financier pour tous les porteurs de projet</span>
        </div>
      </div>
    </footer>
  );
}
