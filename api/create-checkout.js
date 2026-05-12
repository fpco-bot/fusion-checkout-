module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { cart } = req.body;
    if (!cart || !cart.length) return res.status(400).json({ error: "Cart is empty" });

    const params = new URLSearchParams();
    params.append("mode", "payment");
    params.append("success_url", "https://fusionputtercompany.com/success");
    params.append("cancel_url", "https://fusionputtercompany.com/cart");

    cart.forEach((item, i) => {
      params.append(`line_items[${i}][price_data][currency]`, "usd");
      params.append(`line_items[${i}][price_data][product_data][name]`, item.name || "Fusion Putter");
      params.append(`line_items[${i}][price_data][unit_amount]`, String(Math.round(item.price)));
      params.append(`line_items[${i}][quantity]`, String(item.quantity || 1));
    });

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data = await stripeRes.json();
    if (!stripeRes.ok) return res.status(500).json({ error: data.error?.message || "Stripe error" });

    res.json({ url: data.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
