using System.Text.Encodings.Web;
using System.Text.Unicode;

namespace PartnR.Application.Common;

// One layout for every email PartnR sends. Table-based and inline-styled on
// purpose: that is what mail clients render. Every value that comes from a
// user (first name, event title) goes through Escape — an event called
// "<img src=x onerror=…>" must not become markup in someone's inbox.
public static class EmailTemplate
{
    // UnicodeRanges.All: "é" stays "é" (the document is UTF-8); only the five
    // markup characters are encoded.
    private static readonly HtmlEncoder Encoder = HtmlEncoder.Create(UnicodeRanges.All);

    public static string Escape(string? value) => Encoder.Encode(value ?? string.Empty);

    public static string Paragraph(string html) => $"<p style=\"margin:0 0 12px\">{html}</p>";

    /// <param name="heading">Plain text, escaped here.</param>
    /// <param name="bodyHtml">Already-safe HTML (build it with Paragraph + Escape).</param>
    public static string Render(string heading, string bodyHtml, string? ctaLabel = null, string? ctaUrl = null, string? footnote = null)
    {
        var cta = ctaLabel is not null && ctaUrl is not null
            ? $"<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin-top:24px\"><tr><td style=\"background:#c2451c;border-radius:999px\">" +
              $"<a href=\"{Escape(ctaUrl)}\" style=\"display:inline-block;padding:13px 26px;color:#ffffff;font-weight:700;text-decoration:none;font-size:15px\">{Escape(ctaLabel)}</a>" +
              "</td></tr></table>"
            : string.Empty;
        var note = footnote is not null ? $"<p style=\"margin:0 0 8px\">{Escape(footnote)}</p>" : string.Empty;

        return $$"""
            <!doctype html>
            <html lang="fr">
            <head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>{{Escape(heading)}}</title></head>
            <body style="margin:0;padding:0;background:#f7f4ee;font-family:Inter,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1c1a16">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f4ee;padding:32px 16px">
              <tr><td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e4ded2;border-radius:20px;overflow:hidden">
                  <tr><td style="background:#221d18;padding:22px 28px">
                    <span style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.02em">PartnR</span>
                    <span style="font-size:13px;color:#cfc6b8;padding-left:10px">Ne faites plus rien seul·e</span>
                  </td></tr>
                  <tr><td style="padding:28px 28px 32px">
                    <h1 style="margin:0 0 14px;font-size:22px;line-height:1.25;font-weight:800;color:#1c1a16">{{Escape(heading)}}</h1>
                    <div style="font-size:15px;line-height:1.55;color:#565043">{{bodyHtml}}</div>
                    {{cta}}
                  </td></tr>
                  <tr><td style="padding:16px 28px 24px;border-top:1px solid #e4ded2;font-size:12px;line-height:1.5;color:#6e6656">
                    {{note}}
                    <p style="margin:0">Vous recevez cet email parce que vous avez un compte PartnR.</p>
                  </td></tr>
                </table>
              </td></tr>
            </table>
            </body>
            </html>
            """;
    }
}
