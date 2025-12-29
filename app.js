// ============================================
// MatheMagic Book - JavaScript Frontend App
// ============================================

const UNIT_PRICE = 92; // Pre-order price in HKD cents (92.00 HKD = 9200 cents)
const REGULAR_PRICE = 115; // Regular price
const STRIPE_PUBLIC_KEY = 'pk_test_51SXfkkPQ4EySkFTOckjbrjtUrhwKnMyeiMLboj6bCPo6k9CvcFJ2Tq9X9uH5GcVl4SghyTAFot87WEkSWPah7wmO00crSmfMDQ';

// Shipping rates (in HKD cents)
const SHIPPING_RATES = {
    HK: {
        1: 2000,
        2: 2500,
        3: 5000,
        4: 5000,
        default: 7000
    },
    Mainland: {
        1: 2500,
        2: 4000,
        3: 7000,
        4: 7000,
        default: 10000
    },
    Taiwan: {
        1: 2500,
        2: 4000,
        3: 7000,
        4: 7000,
        default: 10000
    },
    Other: {
        1: 3000,
        2: 5000,
        3: 8000,
        4: 8000,
        default: 12000
    }
};

const PACKAGING_FEE = 1000; // HK$10 in cents

let stripe;
let demoMode = true; // Start in demo mode since no backend server

// Initialize Stripe (kept for future integration)
document.addEventListener('DOMContentLoaded', () => {
    stripe = Stripe(STRIPE_PUBLIC_KEY);
    
    // Get form elements
    const form = document.getElementById('payment-form');
    const quantityInput = document.getElementById('quantity');
    const countryInput = document.getElementById('country');
    const preorderCheckbox = document.getElementById('preorder');
    const emailInput = document.getElementById('email');
    const submitBtn = document.getElementById('submit-btn');
    const demoNotice = document.getElementById('demo-notice');

    // Show demo notice
    demoNotice.style.display = 'block';

    // Add event listeners
    quantityInput.addEventListener('change', updateBreakdown);
    countryInput.addEventListener('change', updateBreakdown);
    preorderCheckbox.addEventListener('change', updateBreakdown);
    form.addEventListener('submit', handleSubmit);
    emailInput.addEventListener('input', () => {
        document.getElementById('email-errors').textContent = '';
        emailInput.classList.remove('error');
    });

    // Initial breakdown
    updateBreakdown();
});

// Calculate shipping fee based on country and quantity
function calculateShipping(country, quantity) {
    const rates = SHIPPING_RATES[country] || SHIPPING_RATES.Other;
    
    if (quantity === 1) return rates[1];
    if (quantity === 2) return rates[2];
    if (quantity <= 4) return rates[3];
    
    return rates.default;
}

// Update breakdown display
function updateBreakdown() {
    const quantity = Math.max(1, Math.min(99, parseInt(document.getElementById('quantity').value) || 1));
    const country = document.getElementById('country').value || 'HK';
    const isPreorder = document.getElementById('preorder').checked;
    
    const unitPrice = isPreorder ? UNIT_PRICE : REGULAR_PRICE;
    const subtotal = unitPrice * quantity * 100; // Convert to cents
    const packagingFee = PACKAGING_FEE;
    const shippingFee = calculateShipping(country, quantity);
    const total = subtotal + packagingFee + shippingFee;

    // Update display values
    document.getElementById('price-display').textContent = `HK$${unitPrice}`;
    document.getElementById('qty-display').textContent = quantity;
    document.getElementById('country-display').textContent = country;
    
    document.getElementById('subtotal').textContent = (subtotal / 100).toFixed(2);
    document.getElementById('packaging').textContent = (packagingFee / 100).toFixed(2);
    document.getElementById('shipping').textContent = (shippingFee / 100).toFixed(2);
    document.getElementById('total').textContent = (total / 100).toFixed(2);
    
    document.getElementById('button-text').textContent = `Complete Order — HK$${(total / 100).toFixed(2)}`;
}

// Validate form
function validateForm() {
    const fullname = document.getElementById('fullname').value.trim();
    const address = document.getElementById('address').value.trim();
    const city = document.getElementById('city').value.trim();
    const country = document.getElementById('country').value;
    const email = document.getElementById('email').value.trim();
    
    const errors = [];
    
    if (!fullname) errors.push('Full name is required');
    if (!address) errors.push('Street address is required');
    if (!city) errors.push('City is required');
    if (!country) errors.push('Country is required');
    
    if (!email) {
        errors.push('Email is required');
        document.getElementById('email').classList.add('error');
    } else if (!isValidEmail(email)) {
        errors.push('Please enter a valid email address');
        document.getElementById('email').classList.add('error');
    }
    
    if (errors.length > 0) {
        showMessage(errors.join(', '), 'error');
        return false;
    }
    
    return true;
}

// Email validation helper
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Show message
function showMessage(text, type = 'error') {
    const messageEl = document.getElementById('payment-message');
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
}

// Handle form submission
async function handleSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
        return;
    }
    
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    
    try {
        // Collect order data
        const order = {
            id: generateOrderId(),
            fullname: document.getElementById('fullname').value.trim(),
            address: document.getElementById('address').value.trim(),
            city: document.getElementById('city').value.trim(),
            country: document.getElementById('country').value,
            email: document.getElementById('email').value.trim(),
            quantity: parseInt(document.getElementById('quantity').value),
            isPreorder: document.getElementById('preorder').checked,
            timestamp: new Date().toISOString(),
            demo: demoMode,
            status: 'Completed'
        };
        
        // Calculate totals
        const isPreorder = document.getElementById('preorder').checked;
        const unitPrice = isPreorder ? UNIT_PRICE : REGULAR_PRICE;
        const subtotal = unitPrice * order.quantity * 100;
        const packagingFee = PACKAGING_FEE;
        const shippingFee = calculateShipping(order.country, order.quantity);
        const total = subtotal + packagingFee + shippingFee;
        
        order.subtotal = subtotal;
        order.packagingFee = packagingFee;
        order.shippingFee = shippingFee;
        order.total = total;
        
        // Save to localStorage
        localStorage.setItem('lastOrder', JSON.stringify(order));
        
        // Add to order history
        const orderHistory = JSON.parse(localStorage.getItem('orderHistory') || '[]');
        orderHistory.push(order);
        localStorage.setItem('orderHistory', JSON.stringify(orderHistory));
        
        // Simulate success and redirect
        showMessage('✓ Order completed successfully! Redirecting...', 'success');
        
        setTimeout(() => {
            window.location.href = 'return.html';
        }, 1500);
        
    } catch (error) {
        showMessage('Error processing order: ' + error.message, 'error');
        submitBtn.disabled = false;
    }
}

// Generate unique order ID
function generateOrderId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `ORD-${timestamp}-${random}`;
}

// ============================================
// Future Stripe Integration Skeleton
// ============================================

// When backend is ready, call this to create a real PaymentIntent
async function createPaymentIntent(quantity, country, isPreorder) {
    try {
        // This would call your backend endpoint
        // const response = await fetch('/create-checkout-session', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ quantity, country, isPreorder })
        // });
        // const data = await response.json();
        // return data;
        
        console.log('createPaymentIntent stub - would connect to backend when available');
    } catch (error) {
        console.error('Error creating payment intent:', error);
    }
}
