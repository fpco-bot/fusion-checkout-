export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { cart } = req.body;
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: cart.map(item => ({
      price_data: {
        currency: "usd",
        product_data: { name: item.name, description: item.description },
        unit_amount: Math.round(item.price),
      },
      quantity: item.quantity,
    })),
    mode: "payment",
    success_url: "https://fusionputtercompany.com/success",
    cancel_url: "https://fusionputtercompany.com/cart",
  });

  res.json({ url: session.url });
}
