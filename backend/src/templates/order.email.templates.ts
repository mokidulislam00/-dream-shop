// ==========================================
// ORDER CONFIRMATION EMAIL TEMPLATE
// ==========================================

export interface OrderConfirmationEmailItem {
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface OrderConfirmationEmailData {
  customerName: string;
  orderId: string;
  items: OrderConfirmationEmailItem[];
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  paymentMethod: string;
  orderStatus: string;
}

const escapeHtml = (value: string): string => {
  const entities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };

  return value.replace(/[&<>"']/g, (character) => entities[character]);
};

const formatBDT = (amount: number): string => {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const orderConfirmationEmailTemplate = (
  data: OrderConfirmationEmailData
): string => {
  const safeCustomerName = escapeHtml(data.customerName);
  const safeOrderId = escapeHtml(data.orderId);
  const safeOrderStatus = escapeHtml(data.orderStatus);

  const paymentMethodLabel =
    data.paymentMethod === "cod"
      ? "Cash on Delivery"
      : "Online Payment";

  const itemsHtml = data.items
    .map(
      (item) => `
        <tr>
          <td style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb; color: #374151;">
            ${escapeHtml(item.name)}
          </td>
          <td align="center" style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb; color: #374151;">
            ${item.quantity}
          </td>
          <td align="right" style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb; color: #374151;">
            ${formatBDT(item.price)}
          </td>
          <td align="right" style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb; color: #374151;">
            ${formatBDT(item.subtotal)}
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
        <title>Order Confirmation - MiniMart</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f7fb; font-family: Arial, Helvetica, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding: 32px 12px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 680px; background: #ffffff; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="background: #2563eb; padding: 28px 24px; text-align: center; color: #ffffff;">
                    <h1 style="margin: 0; font-size: 28px;">MiniMart</h1>
                    <p style="margin: 8px 0 0; font-size: 14px;">Order Confirmation</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 30px 24px; color: #374151;">
                    <h2 style="margin: 0 0 14px; color: #111827; font-size: 22px;">Thank you for your order, ${safeCustomerName}!</h2>
                    <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6;">Your order has been placed successfully. Here is your order summary.</p>

                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 22px; background: #f9fafb; border-radius: 8px;">
                      <tr>
                        <td style="padding: 14px; font-size: 14px; color: #6b7280;">Order ID</td>
                        <td align="right" style="padding: 14px; font-size: 14px; font-weight: bold; color: #111827;">#${safeOrderId}</td>
                      </tr>
                      <tr>
                        <td style="padding: 0 14px 14px; font-size: 14px; color: #6b7280;">Order Status</td>
                        <td align="right" style="padding: 0 14px 14px; font-size: 14px; font-weight: bold; color: #111827;">${safeOrderStatus}</td>
                      </tr>
                      <tr>
                        <td style="padding: 0 14px 14px; font-size: 14px; color: #6b7280;">Payment Method</td>
                        <td align="right" style="padding: 0 14px 14px; font-size: 14px; color: #111827;">${paymentMethodLabel}</td>
                      </tr>
                    </table>

                    <h3 style="margin: 0 0 10px; color: #111827; font-size: 17px;">Order Items</h3>
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; font-size: 13px;">
                      <thead>
                        <tr style="background: #f3f4f6;">
                          <th align="left" style="padding: 11px 10px; color: #4b5563;">Product</th>
                          <th align="center" style="padding: 11px 10px; color: #4b5563;">Qty</th>
                          <th align="right" style="padding: 11px 10px; color: #4b5563;">Price</th>
                          <th align="right" style="padding: 11px 10px; color: #4b5563;">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>${itemsHtml}</tbody>
                    </table>

                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 18px;">
                      <tr>
                        <td style="padding: 7px 0; color: #6b7280; font-size: 14px;">Subtotal</td>
                        <td align="right" style="padding: 7px 0; color: #374151; font-size: 14px;">${formatBDT(data.subtotal)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 7px 0; color: #6b7280; font-size: 14px;">Shipping</td>
                        <td align="right" style="padding: 7px 0; color: #374151; font-size: 14px;">${formatBDT(data.shippingCost)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-top: 1px solid #e5e7eb; color: #111827; font-size: 16px; font-weight: bold;">Total</td>
                        <td align="right" style="padding: 12px 0; border-top: 1px solid #e5e7eb; color: #2563eb; font-size: 17px; font-weight: bold;">${formatBDT(data.totalAmount)}</td>
                      </tr>
                    </table>

                    <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">We will keep you informed as your order progresses.</p>
                    <p style="margin: 22px 0 0; font-size: 14px; color: #6b7280;">Thank you for choosing <strong>MiniMart</strong>!<br />MiniMart Team</p>
                  </td>
                </tr>
                <tr>
                  <td style="background: #f4f7fb; padding: 18px; text-align: center; color: #777777; font-size: 12px;">
                    &copy; ${new Date().getFullYear()} MiniMart. All rights reserved.
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
