const stripe = Stripe("pk_test_51SXfkkPQ4EySkFTOckjbrjtUrhwKnMyeiMLboj6bCPo6k9CvcFJ2Tq9X9uH5GcVl4SghyTAFot87WEkSWPah7wmO00crSmfMDQ");

let elements;
let clientSecret;
let paymentElement;

const fullnameInput = document.getElementById("fullname");
const addressInput = document.getElementById("address");
const cityInput = document.getElementById("city");
const countryInput = document.getElementById("country");
const emailInput = document.getElementById("email");
const emailErrors = document.getElementById("email-errors");
const quantityInput = document.getElementById("quantity");

const validateAddress = () => {
  const errors = [];
  
  if (!fullnameInput.value.trim()) {
    errors.push("Full name is required");
  }
  if (!addressInput.value.trim()) {
    errors.push("Street address is required");
  }
  if (!cityInput.value.trim()) {
    errors.push("City is required");
  }
  if (!countryInput.value) {
    errors.push("Country is required");
  }
  
  return {
    isValid: errors.length === 0,
    message: errors.join(", ")
  };
};


function updateBreakdown(data) {
  if (!data) return;
  
  document.getElementById("breakdown-qty").textContent = data.quantity || 1;
  document.getElementById("breakdown-subtotal").textContent = ((data.subtotal || 0) / 100).toFixed(2);
  document.getElementById("breakdown-packaging").textContent = ((data.packaging_fee || 0) / 100).toFixed(2);
  document.getElementById("breakdown-shipping").textContent = ((data.shipping_fee || 0) / 100).toFixed(2);
  document.getElementById("breakdown-total").textContent = ((data.total || 0) / 100).toFixed(2);
  
  const countryName = countryInput.value;
  document.getElementById("breakdown-country").textContent = countryName;
}

async function updateBreakdownOnly(quantity, country) {
  try {
    const sendData = JSON.stringify({ quantity, country });
    const response = await fetch("/calculate-shipping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: sendData
    });
    const data = await response.json();

    if (data.error) {
      console.error("Error calculating breakdown:", data.error);
      return;
    }

    updateBreakdown(data);

    if (data.total) {
      document.querySelector("#button-text").textContent = `Pay HK$${(data.total / 100).toFixed(2)}`;
    }
  } catch (error) {
    console.error("Error updating breakdown:", error);
  }
}

async function createIntentAndMount(quantity, country) {
  try {
    const sendData = JSON.stringify({ quantity, country });
    const response = await fetch("/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: sendData
    });
    const data = await response.json();

    if (data.error) {
      showMessage("Error: " + data.error);
      if (setLoading) setLoading(false);
      return;
    }

    clientSecret = data.clientSecret;

    updateBreakdown(data);

    if (paymentElement) {
      try { paymentElement.unmount(); } catch (e) { /* ignore */ }
      paymentElement = null;
      elements = null;
    }

    elements = stripe.elements({ clientSecret });
    paymentElement = elements.create("payment");
    paymentElement.mount("#payment-element");

    if (data.amount_total) {
      document.querySelector("#button-text").textContent = `Pay HK$${(data.amount_total / 100).toFixed(2)}`;
    }
  } catch (error) {
    console.error("Error during payment initialization:", error);
    showMessage("Error initializing payment form");
    if (setLoading) setLoading(false);
  }
}

emailInput.addEventListener("input", () => {
  emailErrors.textContent = "";
  emailInput.classList.remove("error");
});

document.querySelector("#payment-form").addEventListener("submit", handleSubmit);

countryInput.addEventListener("change", () => {
  let q = parseInt(quantityInput.value) || 1;
  if (q < 1) q = 1;
  if (q > 10) q = 10;
  quantityInput.value = q;
  let c = countryInput.value;
  if (c) {
    createIntentAndMount(q, c);
  }
});

quantityInput.addEventListener("change", () => {
  let q = parseInt(quantityInput.value) || 1;
  if (q < 1) q = 1;
  if (q > 10) q = 10;
  quantityInput.value = q;
  let c = countryInput.value;
  if (c) {
    createIntentAndMount(q, c);
  }
});

async function handleSubmit(e) {
  e.preventDefault();
  setLoading(true);

  const addressValidation = validateAddress();
  if (!addressValidation.isValid) {
    showMessage(addressValidation.message);
    setLoading(false);
    return;
  }

  if (!emailInput.value) {
    emailInput.classList.add("error");
    emailErrors.textContent = "Email is required";
    showMessage("Email is required");
    setLoading(false);
    return;
  }

  const { error, paymentIntent } = await stripe.confirmPayment({
    elements,
    confirmParams: {
      // Use the current origin so redirects work locally and when deployed (Render/GitHub Pages, etc.)
      return_url: `${window.location.origin}/return`,
      receipt_email: emailInput.value,
    }
  });

  if (error) {
    showMessage(error.message);
    setLoading(false);
  } else if (paymentIntent && paymentIntent.status === "succeeded") {
    showMessage("Payment successful!");
  }
}

function showMessage(messageText) {
  const messageContainer = document.querySelector("#payment-message");

  messageContainer.classList.remove("hidden");
  messageContainer.textContent = messageText;

  setTimeout(function () {
    messageContainer.classList.add("hidden");
    messageContainer.textContent = "";
  }, 4000);
}

function setLoading(isLoading) {
  if (isLoading) {
    document.querySelector("#submit").disabled = true;
    document.querySelector("#spinner").classList.remove("hidden");
    document.querySelector("#button-text").classList.add("hidden");
  } else {
    document.querySelector("#submit").disabled = false;
    document.querySelector("#spinner").classList.add("hidden");
    document.querySelector("#button-text").classList.remove("hidden");
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const initialQty = parseInt(quantityInput.value) || 1;
  const initialCountry = countryInput.value || 'HK';
  createIntentAndMount(initialQty, initialCountry);
});
