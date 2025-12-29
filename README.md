# MatheMagic Book - GitHub Pages Website

A complete, JavaScript-only checkout and order management website for MatheMagic Book. No backend server required — works perfectly on GitHub Pages!

## Features

✅ **Complete Checkout Flow**
- Delivery address form (name, address, city, country)
- Dynamic quantity selector with real-time price updates
- Pre-order vs. regular price toggle (HK$92 vs HK$115)
- Professional order breakdown with shipping calculations

✅ **Shipping Calculation** (from original `main.py`)
- Dynamic rates based on country and quantity
- Hong Kong, Mainland China, Taiwan, and other destinations supported
- Packaging fee (HK$10) and variable shipping costs

✅ **Order Management**
- Orders saved to browser localStorage
- Order history tracking
- Printable order confirmation page
- Unique order IDs for each transaction

✅ **Responsive Design**
- Mobile-friendly checkout form
- Beautiful gradient background
- Smooth animations and transitions
- Works on all devices

✅ **Future Stripe Integration Ready**
- Stripe public key configured
- Stub functions ready for backend API when needed
- Demo mode toggle for testing

## Project Structure

```
├── index.html          # Main checkout page
├── return.html         # Order confirmation page
├── app.js              # All JavaScript logic (checkout, shipping calc, order storage)
└── README.md           # This file
```

## Getting Started

### Option 1: Run Locally

1. **Clone or download the files** to your computer
2. **Open in a local server** (required for localStorage to work properly):
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # OR using Node.js
   npx http-server
   ```
3. **Visit** `http://localhost:8000`
4. **Fill out the checkout form** and see orders saved to your browser

### Option 2: Deploy to GitHub Pages

1. **Create a new GitHub repository** named `mathemagic-book` (or any name)
2. **Push these files** to the `main` branch:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR-USERNAME/mathemagic-book.git
   git branch -M main
   git push -u origin main
   ```
3. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Select "Deploy from a branch"
   - Choose `main` branch and save
4. **Visit** `https://YOUR-USERNAME.github.io/mathemagic-book/`

## How It Works

### Shipping Calculation (JavaScript Implementation)

The app includes the same shipping logic from `main.py`:

- **Hong Kong**: HK$20 (qty 1), HK$25 (qty 2), HK$50 (qty 3-4), HK$70 (qty 5+)
- **Mainland China**: HK$25 (qty 1), HK$40 (qty 2), HK$70 (qty 3-4), HK$100 (qty 5+)
- **Taiwan**: Same as Mainland China
- **Other**: HK$30 (qty 1), HK$50 (qty 2), HK$80 (qty 3-4), HK$120 (qty 5+)
- **Packaging Fee**: HK$10 (fixed for all orders)

### Order Storage

Orders are stored in browser localStorage with:
- Order ID (unique timestamp + random)
- Customer details (name, address, city, country, email)
- Order summary (quantity, price, total, timestamp)
- Status ("Completed" in demo mode)

View order history in DevTools: 
```javascript
// In browser console:
JSON.parse(localStorage.getItem('orderHistory'))
```

## Using the App

1. **Fill Checkout Form**:
   - Enter delivery address
   - Select quantity (1-99)
   - Choose pre-order or regular price
   - Select destination country
   - Enter email

2. **See Live Pricing**:
   - Breakdown updates instantly as you change quantity or country
   - Total includes book price + packaging + shipping

3. **Complete Order**:
   - Click "Complete Order" button
   - Order is saved to localStorage
   - Redirected to confirmation page with full details
   - Print receipt or order another

## Adding Real Stripe Integration

When you're ready to accept real payments:

1. **Set up a backend server** (Node.js, Python Flask, etc.)
2. **Create these endpoints**:
   - `POST /create-checkout-session` — creates Stripe PaymentIntent
   - `POST /calculate-shipping` — returns shipping calculation
   - `GET /payment-status?payment_intent=...` — checks payment status

3. **Update `app.js`**:
   - Change `const demoMode = true` to `false`
   - Uncomment the `createPaymentIntent()` function skeleton
   - Point fetch calls to your backend domain

4. **Deploy backend** to your hosting (Heroku, Railway, AWS, etc.)

5. **Update CORS settings** in your backend to allow requests from GitHub Pages domain

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

## Notes

- **Demo Mode**: Currently simulates orders without actual payment processing
- **localStorage**: Orders persist in browser until cache is cleared
- **No Backend Required**: Everything runs client-side for GitHub Pages compatibility
- **Stripe Ready**: Stub functions in `app.js` prepared for future backend integration

## Development

To customize:

- **Prices**: Edit `UNIT_PRICE` and `REGULAR_PRICE` in `app.js`
- **Shipping Rates**: Modify `SHIPPING_RATES` object in `app.js`
- **Styling**: Edit CSS sections in `index.html` and `return.html`
- **Countries**: Add options to the `<select id="country">` in `index.html`

## License

This project is provided as-is for MatheMagic Book. Modify and deploy freely!

## Support

For questions or issues:
1. Check browser console (F12) for error messages
2. Verify localStorage is enabled in browser settings
3. Try clearing cache and reloading page

---

**Ready to deploy?** Push to GitHub and enable Pages in 2 minutes! 🚀
