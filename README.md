# Mustang Farms — Farm-Fresh Storefront (Prototype)

A playful, responsive homestead website and pickup-order **front-end demonstration** for Ed Sperry in Meridian, Idaho.

## What this build includes

- Farm-fresh landing page with animated fruit and vegetables, micro-interactions, accessible reduced-motion support, and mobile layouts
- Ed's story: 22 years in the military, a new venture in farming, and learning the craft through YouTube
- A harvest catalog with categories, sample prices, sample stock, and one-tap add-to-basket buttons
- A basket with quantity controls, estimated total, and a **test pickup-request form**
- A simple Farmer's Desk with easy-to-read inventory, add/edit/remove products, stock +/- controls, and an order board
- Order stages: **New → Preparing → Ready for pickup → Completed**
- Placeholder logo, product art, farm illustration, sample produce, and sample pricing ready to replace with approved branding, photos, and actual inventory

## Important: this is not a live ordering site yet

**You asked to skip storage for now.** Everything lives in JavaScript memory in a single browser tab. Refreshing the page resets all products, cart items, and orders to their example starting state. Different visitors and browser tabs do **not** share inventory or orders.

- **No database or persistent storage:** No Supabase, cookies, localStorage, or backend.
- **No real login:** The Farmer's Desk entry is labeled as an openly accessible demo preview. Do not use it to manage real orders.
- **No live order delivery:** Test pickup requests are visible only on the same page. They are **not** sent by SMS, email, or to Ed.
- **No payment processing.**
- **Use sample information**, not actual customer contact information, while testing.
- The street address is intentionally not displayed publicly until pickup details are verified.
- Products, availability, prices, and pickup windows are **illustrative sample content**, not statements about the farm's actual stock.

## Preview locally

There are **no dependencies, build steps, accounts, or environment variables**. Clone/download the repository and open \`index.html\` in a browser, or serve the project folder using any static server. GitHub Pages or another static host can also host this demo once configured.

If you want to try a local server and have Python installed:

\`\`\`bash
python3 -m http.server 8000
\`\`\`

Then open \`http://localhost:8000\`.

## Try the complete demo workflow

1. On the website, add a few sample items using the **+** buttons.
2. Open **Basket**. Adjust the quantities.
3. Fill the pickup form with **test-only** details, then select **Place TEST pickup request**.
4. Open **Farmer's desk** in the header or footer and select **Open the demo dashboard**. This is a preview, not authentication.
5. Select **Customer orders**. The test order appears with a status of **New**.
6. Tap **Start preparing**, then **Mark ready for pickup**, then **Mark picked up**.
7. Go to **My produce** to change stock or add/edit a product, then return to the website to see it update immediately.
8. Refresh the page and notice that everything resets.

## Files

| File | Purpose |
| --- | --- |
| \`index.html\` | Storefront, cart, Farmer's Desk, and edit dialogs |
| \`styles.css\` | Responsive farm identity, transitions, animations, large admin controls |
| \`app.js\` | In-memory harvest, basket, fake pickup requests, and admin dashboard |

## Future phases (not built yet)

1. Review the visual direction with Ed; add farm photography, a real logo, actual produce, correct pricing, and approved pickup instructions.
2. Add real secure owner authentication and a persistence layer with strict access controls.
3. Replace test checkout with actual pickup-request processing and owner notifications.
4. Validate inventory reservation logic, customer privacy, cancellation/refund rules (if payments are added), spam defenses, and production accessibility.

**Safety before launch:** Do not invite real customers to place orders through this demo. Deploy it only as a labeled prototype until authentication, shared inventory, and order delivery are implemented.

## Added living homestead visuals

- The prior `assets/ed-sperry.webp` is retained but damaged and undecodable; the Meet Ed section now uses a clean monogram placeholder pending permission to publish the original portrait.
- A CSS/SVG vintage red Mustang Farms produce truck drives along the homestead road, alongside chickens, a barn, clouds, and animated sunshine.
- More chickens walk through the hero. Motion automatically stops for users with reduced-motion preferences.
- The storefront remains a same-tab, in-memory prototype with no persistence or authentication.


## Homestead market redesign

The original static storefront now has a cream, olive and terracotta identity, original SVG produce illustrations, a harvest basket hero, responsive product cards, illustrated chickens, and the existing red farm truck. The previous build's WebP portrait is damaged and undecodable. The existing file is retained, while a styled monogram placeholder avoids showing a broken image. Publishing the recovered original JPEG remains blocked pending explicit permission to publish Ed's photo to this public repository. No Library-sourced photograph is included in this change.

Shopping is nearer the top of the page, with search, category filters, in-stock filtering, availability labels, an accessible basket summary, and a pickup FAQ. Basket quantity edits preserve the test checkout details already entered. The Farmer's Desk has larger controls and text, order status filtering, and keyboard-accessible tabs. The basket traps focus and makes the background inert while open. Animation can be paused in the footer and respects reduced-motion settings.

Everything remains in memory. There are still no dependencies for running the website, no storage, no authentication, no payments, and no real orders or notifications.

### Developer verification

`tests/smoke.cjs` uses Playwright (a development-only tool). With Playwright and its Chromium browser installed in your development environment, run:

```sh
node tests/smoke.cjs
```

The script starts a temporary local server and verifies image decoding, layouts at 320/390/768/1440 pixels, search and category filters, basket totals, focus containment, checkout draft preservation, test-order creation and all order stages, inventory updates, adding produce, stock filtering, page-refresh reset, reduced motion, and browser runtime errors. `CHROMIUM_PATH` optionally selects an existing Chromium executable; `QA_SCREENSHOTS` optionally selects an existing directory for internal visual checks.

Additional files: `homestead.css` supplies the redesign, and `assets/*.svg` contains the small, local illustrations. No paid services or third-party image hosts were introduced.
