import { Home } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main id="sadrzaj" className="relative flex min-h-[80vh] items-center overflow-hidden pt-20">
        <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-rose-light blur-3xl" aria-hidden />
        <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-rose/30 blur-3xl" aria-hidden />
        <div className="container-page relative text-center">
          <p className="font-serif text-8xl text-rose sm:text-9xl">404</p>
          <div className="mx-auto mt-4 gold-line w-24" aria-hidden />
          <h1 className="mt-6 text-3xl font-medium sm:text-4xl">Ova stranica ne postoji</h1>
          <p className="mx-auto mt-4 max-w-md text-ink-soft">
            Možda je link zastareo ili je stranica premeštena. Vratite se na početnu i pronađite ono što tražite.
          </p>
          <ButtonLink href="/" size="lg" className="mt-9">
            <Home className="h-5 w-5" aria-hidden /> Nazad na početnu
          </ButtonLink>
        </div>
      </main>
      <Footer />
    </>
  );
}
