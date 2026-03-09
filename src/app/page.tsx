import Navbar from "@/components/layout/navbar";
import Hero from "@/components/blocks/hero";
import Features from "@/components/blocks/features";
import HowItWorks from "@/components/blocks/how-it-works";
import Stats from "@/components/blocks/stats";
import Modules from "@/components/blocks/modules";
import Pricing from "@/components/blocks/pricing";
import Faq from "@/components/blocks/faq";
import Cta from "@/components/blocks/cta";
import Footer from "@/components/layout/footer";

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center">
      <Navbar />
      <main className="flex w-full flex-col items-center">
        <Hero />
        <Features />
        <HowItWorks />
        <Stats />
        <Modules />
        <Pricing />
        <Faq />
        <Cta />
      </main>
      <Footer />
    </div>
  );
}
