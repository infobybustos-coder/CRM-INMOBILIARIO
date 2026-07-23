import "server-only";
import { stripe } from "@/lib/stripe";

// Un mismo plan (mismo producto de Stripe) se puede cobrar en euros o en
// dólares según el país del visitante — mismo importe numérico, solo
// cambia la divisa — sin tener que crear un Price ID distinto por
// moneda en el Dashboard de Stripe: se genera el precio al vuelo con
// price_data, reutilizando el producto del Price ID ya configurado.
export async function lineItemMultimoneda(priceIdBase: string, moneda: "EUR" | "USD", importe: number) {
  const precioBase = await stripe.prices.retrieve(priceIdBase);
  const productId = typeof precioBase.product === "string" ? precioBase.product : precioBase.product.id;

  return {
    price_data: {
      currency: moneda.toLowerCase(),
      product: productId,
      unit_amount: Math.round(importe * 100),
      recurring: { interval: "month" as const },
    },
    quantity: 1,
  };
}
