const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get("session_id");
let paymentIntentId = urlParams.get("payment_intent");
const piClientSecret = urlParams.get("payment_intent_client_secret");
if (!paymentIntentId && piClientSecret) {
  paymentIntentId = piClientSecret.split('_secret_')[0];
}

function renderResult(obj) {
  if (!obj) {
    document.getElementById("status-header").textContent = "Error";
    document.getElementById("status-message").textContent = "No session or payment info found";
    return;
  }

  const status = obj.status;
  if (status === "succeeded" || status === "complete") {
    document.getElementById("status-header").textContent = "Payment Successful!";
    document.getElementById("status-message").textContent =
      "Thank you for your order.";

    const amount = obj.amount_total ? (obj.amount_total / 100).toFixed(2) : '0.00';

    const detailsHtml = `
      <table>
        <tbody>
          <tr>
            <td class="TableLabel">Order ID</td>
            <td class="TableContent">${obj.id}</td>
          </tr>
          <tr>
            <td class="TableLabel">Amount</td>
            <td class="TableContent">HK$${amount}</td>
          </tr>
        </tbody>
      </table>
    `;
    document.getElementById("details-table").innerHTML = detailsHtml;
  } else if (status === "requires_payment_method" || status === "requires_action" || status === "open") {
    document.getElementById("status-header").textContent = "Payment Incomplete";
    document.getElementById("status-message").textContent =
      "The payment was not completed. Please try again.";
  } else {
    document.getElementById("status-header").textContent = "Payment Failed";
    document.getElementById("status-message").textContent =
      "The payment was unsuccessful. Please try again or contact support.";
  }
}

if (paymentIntentId) {
  fetch(`/payment-status?payment_intent=${encodeURIComponent(paymentIntentId)}`)
    .then((res) => res.json())
    .then((data) => {
      if (data.error) throw new Error(data.error);
      renderResult(data);
    })
    .catch((error) => {
      console.error("Error:", error);
      document.getElementById("status-header").textContent = "Error";
      document.getElementById("status-message").textContent =
        "An error occurred while checking the payment status.";
    });
} else if (sessionId) {
  fetch(`/session-status?session_id=${sessionId}`)
    .then((res) => res.json())
    .then((session) => {
      if (session.error) throw new Error(session.error);
      renderResult(session);
    })
    .catch((error) => {
      console.error("Error:", error);
      document.getElementById("status-header").textContent = "Error";
      document.getElementById("status-message").textContent =
        "An error occurred while checking the payment status.";
    });
} else {
  document.getElementById("status-header").textContent = "Error";
  document.getElementById("status-message").textContent = "No session or payment id found in the URL";
}
