module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { cart } = req.body;
    if (!cart || !cart.length) return res.status(400).json({ error: "Cart is empty" });

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        payment_method_types: ["card"],
        line_items: cart.map(item => ({
          price_data: {
            currency: "usd",
            product_data: { name: item.name, description: item.description || "" },
            unit_amount: Math.round(item.price),
          },
          quantity: item.quantity,
        })),
        mode: "payment",
        success_url: "https://fusionputtercompany.com/success",
        cancel_url: "https://fusionputtercompany.com/cart",
      }),
    });

    const data = await stripeRes.json();
    if (!stripeRes.ok) return res.status(500).json({ error: data.error?.message || "Stripe error" });

    res.json({ url: data.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
