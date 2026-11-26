interface OrderStatusEmailItem {
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface OrderStatusUpdateEmailOptions {
  customerName: string;
  orderId: string;
  orderStatus: string;
  items: OrderStatusEmailItem[];
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  paymentMethod: string;
}

const APP_NAME = "Dream Shop";
const APP_COLOR = "#2563eb";

// Escape dynamic values before inserting them into HTML.
const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });

const getStatusDescription = (status: string): string => {
  const descriptions: Record<string, string> = {
    pending: "Your order has been received and is awaiting confirmation.",
    confirmed: "Your order has been confirmed. We will prepare it for processing.",
    processing: "Your order is now being processed by our team.",
    shipped: "Your order has been shipped and is on its way to you.",
    delivered: "Your order has been delivered. We hope you enjoy your purchase.",
    cancelled: "Your order has been cancelled.",
  };

  return (
    descriptions[status] ??
    "There has been an update to your order."
  );
};

// ==========================================
// ORDER STATUS UPDATE EMAIL TEMPLATE
// ==========================================

export const orderStatusUpdateEmailTemplate = ({
  customerName,
  orderId,
  orderStatus,
  items,
  subtotal,
  shippingCost,
  totalAmount,
  paymentMethod,
}: OrderStatusUpdateEmailOptions): string => {
  const safeCustomerName = escapeHtml(customerName);
  const safeOrderId = escapeHtml(orderId);
  const safeOrderStatus = escapeHtml(orderStatus.toUpperCase());
  const safePaymentMethod = escapeHtml(paymentMethod);
  const statusDescription = escapeHtml(
    getStatusDescription(orderStatus)
  );

  const itemRows = items
    .map(
      (item) => `
        <tr>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; color: #374151;">
            ${escapeHtml(item.name)}
          </td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #374151;">
            ${item.quantity}
          </td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #374151;">
            ৳${item.price.toFixed(2)}
          </td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #374151;">
            ৳${item.subtotal.toFixed(2)}
          </td>
        </tr>
      `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Order Status Update - ${APP_NAME}</title>
      </head>

      <body style="
        margin: 0;
        padding: 0;
        background-color: #f4f7fb;
        font-family: Arial, Helvetica, sans-serif;
      ">
        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          role="presentation"
          style="padding: 35px 12px;"
        >
          <tr>
            <td align="center">
              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                role="presentation"
                style="
                  max-width: 650px;
                  background: #ffffff;
                  border-radius: 12px;
                  overflow: hidden;
                "
              >
                <tr>
                  <td style="
                    background: ${APP_COLOR};
                    padding: 28px 24px;
                    text-align: center;
                    color: #ffffff;
                  ">
                    <h1 style="margin: 0; font-size: 27px;">
                      ${APP_NAME}
                    </h1>
                    <p style="margin: 9px 0 0; font-size: 14px;">
                      Order Status Update
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 30px 24px; color: #374151;">
                    <h2 style="
                      margin: 0 0 14px;
                      color: #111827;
                      font-size: 22px;
                    ">
                      Hello ${safeCustomerName},
                    </h2>

                    <p style="font-size: 15px; line-height: 1.7;">
                      There is an update to your Dream Shop order.
                    </p>

                    <div style="
                      margin: 22px 0;
                      padding: 18px;
                      background: #eff6ff;
                      border-radius: 8px;
                      border-left: 4px solid ${APP_COLOR};
                    ">
                      <p style="
                        margin: 0 0 8px;
                        color: #1e40af;
                        font-size: 13px;
                        font-weight: bold;
                        letter-spacing: 0.4px;
                      ">
                        CURRENT ORDER STATUS
                      </p>
                      <p style="
                        margin: 0 0 9px;
                        color: #1d4ed8;
                        font-size: 21px;
                        font-weight: bold;
                      ">
                        ${safeOrderStatus}
                      </p>
                      <p style="
                        margin: 0;
                        color: #374151;
                        font-size: 14px;
                        line-height: 1.6;
                      ">
                        ${statusDescription}
                      </p>
                    </div>

                    <p style="font-size: 14px; line-height: 1.7;">
                      <strong>Order ID:</strong> ${safeOrderId}<br />
                      <strong>Payment Method:</strong> ${safePaymentMethod}
                    </p>

                    <h3 style="
                      margin: 28px 0 12px;
                      color: #111827;
                      font-size: 17px;
                    ">
                      Order Details
                    </h3>

                    <table
                      width="100%"
                      cellpadding="0"
                      cellspacing="0"
                      role="presentation"
                      style="border-collapse: collapse; font-size: 13px;"
                    >
                      <thead>
                        <tr style="background: #f9fafb;">
                          <th style="padding: 11px 8px; text-align: left; color: #4b5563;">Product</th>
                          <th style="padding: 11px 8px; text-align: center; color: #4b5563;">Qty</th>
                          <th style="padding: 11px 8px; text-align: right; color: #4b5563;">Price</th>
                          <th style="padding: 11px 8px; text-align: right; color: #4b5563;">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemRows}
                      </tbody>
                    </table>

                    <table
                      width="100%"
                      cellpadding="0"
                      cellspacing="0"
                      role="presentation"
                      style="margin-top: 18px; font-size: 14px;"
                    >
                      <tr>
                        <td style="padding: 6px 0; color: #6b7280;">Subtotal</td>
                        <td style="padding: 6px 0; text-align: right; color: #374151;">
                          ৳${subtotal.toFixed(2)}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #6b7280;">Shipping</td>
                        <td style="padding: 6px 0; text-align: right; color: #374151;">
                          ৳${shippingCost.toFixed(2)}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-top: 1px solid #e5e7eb; color: #111827; font-weight: bold;">
                          Total
                        </td>
                        <td style="padding: 12px 0; border-top: 1px solid #e5e7eb; text-align: right; color: #111827; font-size: 17px; font-weight: bold;">
                          ৳${totalAmount.toFixed(2)}
                        </td>
                      </tr>
                    </table>

                    <p style="
                      margin-top: 28px;
                      color: #6b7280;
                      font-size: 13px;
                      line-height: 1.6;
                    ">
                      Thank you for choosing ${APP_NAME}.<br />
                      <strong>${APP_NAME} Team</strong>
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="
                    padding: 18px;
                    background: #f4f7fb;
                    text-align: center;
                    color: #6b7280;
                    font-size: 12px;
                  ">
                    © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};
