"use client";

import Link from "next/link";
import { useState } from "react";
import { MenuIcon, XIcon, BarChart3Icon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "../ui/theme-toggle";

const navLinks = [
  { label: "Fonctionnalités", href: "#fonctionnalites" },
  { label: "Modules", href: "#modules" },
  { label: "Tarifs", href: "#tarifs" },
  { label: "FAQ", href: "#faq" },
  { label: "App", href: "/app"}
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex flex-1 items-center gap-2 font-bold text-foreground">
          <BarChart3Icon className="size-6 text-primary" />
          <span className="text-lg">Previsia</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex md:flex-1 md:justify-center">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 md:flex md:flex-1 md:justify-end">
          <Link
            href="#"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" })
            )}
          >
            Se connecter
          </Link>
          <Link
            href="/app"
            className={cn(buttonVariants({ size: "sm" }))}
          >
            Essai gratuit
          </Link>
          <ThemeToggle />
        </div>

        {/* Mobile burger */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <XIcon /> : <MenuIcon />}
        </Button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t bg-background md:hidden">
          <nav className="flex flex-col px-4 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="py-3 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            <Separator className="my-3" />
            <div className="flex flex-col gap-2">
              <Link href="#" className={cn(buttonVariants({ variant: "outline" }))}>
                Se connecter
              </Link>
              <Link href="#" className={cn(buttonVariants())}>
                Essai gratuit
              </Link>
              <ThemeToggle/>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
