
const APP_NAME = "MiniMart";

const APP_COLOR = "#2563eb";

// ==========================================
// WELCOME EMAIL TEMPLATE
// ==========================================

export const welcomeEmailTemplate = (
  fullName: string
): string => {
  const safeName = fullName
    .replace(/[&<>"']/g, (character) => {
      const entities: Record<string, string> = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };

      return entities[character];
    });

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Welcome to ${APP_NAME}</title>
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
          style="padding: 40px 15px;"
        >
          <tr>
            <td align="center">

              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                style="
                  max-width: 600px;
                  background: #ffffff;
                  border-radius: 12px;
                  overflow: hidden;
                "
              >

                <tr>
                  <td style="
                    background: ${APP_COLOR};
                    padding: 30px;
                    text-align: center;
                    color: #ffffff;
                  ">
                    <h1 style="
                      margin: 0;
                      font-size: 28px;
                    ">
                      ${APP_NAME}
                    </h1>

                    <p style="
                      margin: 10px 0 0;
                      font-size: 14px;
                    ">
                      Your Shopping Destination
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="
                    padding: 35px 30px;
                    color: #333333;
                  ">
                    <h2 style="
                      color: #222222;
                      font-size: 24px;
                    ">
                      Welcome, ${safeName}! 🎉
                    </h2>

                    <p style="
                      font-size: 15px;
                      line-height: 1.7;
                    ">
                      Thank you for joining ${APP_NAME}.
                      We are excited to have you as a member
                      of our shopping community.
                    </p>

                    <p style="
                      font-size: 15px;
                      line-height: 1.7;
                    ">
                      Your account has been created successfully.
                      You can now explore our products and enjoy
                      a convenient shopping experience.
                    </p>

                    <p style="
                      font-size: 15px;
                      line-height: 1.7;
                    ">
                      Thank you for choosing ${APP_NAME}!
                    </p>

                    <p style="
                      margin-top: 30px;
                      font-size: 14px;
                      color: #666666;
                    ">
                      Best Regards,<br />
                      <strong>${APP_NAME} Team</strong>
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="
                    background: #f4f7fb;
                    padding: 20px;
                    text-align: center;
                    color: #777777;
                    font-size: 12px;
                  ">
                    © ${new Date().getFullYear()} ${APP_NAME}.
                    All rights reserved.
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
