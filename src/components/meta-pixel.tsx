"use client";

import Script from "next/script";
import { Suspense, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { META_PIXEL_ID, trackMetaPixel } from "@/lib/meta-pixel";

// Solo se instrumenta el embudo público de captación (landing + registro),
// no el uso interno del CRM ya logueado.
function EventosMetaPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const leadDisparado = useRef(false);
  const registroDisparado = useRef(false);

  useEffect(() => {
    if (pathname === "/" || pathname.startsWith("/signup")) {
      trackMetaPixel("PageView");
    }
    if (pathname.startsWith("/signup") && !leadDisparado.current) {
      leadDisparado.current = true;
      trackMetaPixel("Lead");
    }
  }, [pathname]);

  useEffect(() => {
    if (registroDisparado.current) return;
    const bienvenida = searchParams.get("bienvenida") === "1";
    const pagoExito = searchParams.get("pago") === "exito";
    if (!bienvenida && !pagoExito) return;

    registroDisparado.current = true;
    trackMetaPixel("CompleteRegistration");

    if (bienvenida) {
      const params = new URLSearchParams(searchParams);
      params.delete("bienvenida");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    }
  }, [searchParams, pathname, router]);

  return null;
}

export function MetaPixel() {
  if (!META_PIXEL_ID) return null;

  return (
    <>
      <Script id="meta-pixel-base" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
          n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
          document,'script','https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${META_PIXEL_ID}');
        `}
      </Script>
      <Suspense fallback={null}>
        <EventosMetaPixel />
      </Suspense>
    </>
  );
}
