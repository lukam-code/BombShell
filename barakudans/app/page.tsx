import { BookingLazy } from '@/components/booking/BookingLazy';
import { About } from '@/components/sections/About';
import { Contact } from '@/components/sections/Contact';
import { Events } from '@/components/sections/Events';
import { Footer } from '@/components/sections/Footer';
import { Gallery } from '@/components/sections/Gallery';
import { Hero } from '@/components/sections/Hero';
import { Menu } from '@/components/sections/Menu';
import { Nav } from '@/components/sections/Nav';
import { barJsonLd } from '@/lib/jsonld';

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <About />
        <Menu />
        <Gallery />
        <Events />
        <BookingLazy />
        <Contact />
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(barJsonLd()) }} />
    </>
  );
}
