import React from "react";
import Image from "next/image";
import { Badge } from "../ui/badge";

const wrapperStyle = (paddingBottom: string): React.CSSProperties => ({
  position: "relative",
  width: "100%",
  paddingBottom,
});

const absoluteInsetStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
};

const Hero = () => {
  return (
    <section className="dark overflow-hidden bg-background pt-12 font-sans md:pt-20 w-full h-dvh">
      <div className="mx-auto">
        <div className="mb-24 flex flex-col items-center gap-8">
          <Badge variant={"outline"} className="rounded-full px-3 py-1 text-sm font-medium">
            Prévisionnel financier pour tous
          </Badge>

          <div className="flex flex-col items-center gap-6 text-center">
            <h1 className="mb-5 text-center text-xl lg:text-2xl 2xl:text-5xl font-bold text-foreground">
              Faites votre prévisionnel comme un pro, sans être comptable
            </h1>
            <p className="max-w-205 text-center text-sm lg:text-base 2xl:text-2xl font-medium text-foreground">
              Previsia vous donne accès aux mêmes outils que les experts-comptables.
              Construisez un prévisionnel complet, professionnel et bancable en quelques
              minutes, sans aucune connaissance comptable requise.
            </p>
          </div>
        </div>

        <div className="relative mx-auto aspect-[2.488709677/1] max-w-[80%]">
          {/* Image 1 — far left */}
          <div className="absolute bottom-0 left-0 z-10 w-[27%] overflow-hidden">
            <div style={wrapperStyle("108.202%")}>
              <div data-slot="aspect-ratio" style={absoluteInsetStyle} className="bg-muted-foreground">
                {/* <Image
                  alt=""
                  fill
                  className="block size-full object-cover object-top-left"
                  src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-5.svg"
                /> */}
              </div>
            </div>
          </div>

          {/* Image 2 — left-center */}
          <div className="absolute bottom-0 left-[14%] z-20 w-[32%] overflow-hidden shadow-xl">
            <div style={wrapperStyle("108.202%")}>
              <div data-slot="aspect-ratio" style={absoluteInsetStyle} className="bg-muted-foreground">
                {/* <Image
                  alt=""
                  fill
                  className="block size-full object-cover object-top-left"
                  src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-4.svg"
                /> */}
              </div>
            </div>
          </div>

          {/* Image 3 — center */}
          <div className="absolute bottom-0 left-1/2 z-30 w-[37%] -translate-x-1/2 overflow-hidden shadow-xl">
            <div style={wrapperStyle("108.202%")}>
              <div data-slot="aspect-ratio" style={absoluteInsetStyle} className="bg-muted-foreground">
                {/* <Image
                  alt=""
                  fill
                  className="block size-full object-cover object-top-left"
                  src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-3.svg"
                /> */}
              </div>
            </div>
          </div>

          {/* Image 4 — right-center */}
          <div className="absolute right-[14%] bottom-0 z-20 w-[32%] overflow-hidden shadow-xl">
            <div style={wrapperStyle("108.202%")}>
              <div data-slot="aspect-ratio" style={absoluteInsetStyle} className="bg-muted-foreground">
                {/* <Image
                  alt=""
                  fill
                  className="block size-full object-cover object-top-left"
                  src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-2.svg"
                /> */}
              </div>
            </div>
          </div>

          {/* Image 5 — far right */}
          <div className="absolute right-0 bottom-0 z-10 w-[27%] overflow-hidden">
            <div style={wrapperStyle("108.202%")}>
              <div data-slot="aspect-ratio" style={absoluteInsetStyle} className="bg-muted-foreground">
                {/* <Image
                  alt=""
                  fill
                  className="block size-full object-cover object-top-left"
                  src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-1.svg"
                /> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
