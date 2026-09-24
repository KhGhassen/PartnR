using PartnR.Application.Common;
using Xunit;

namespace PartnR.Api.Tests;

public class EmailTemplateTests
{
    [Fact]
    public void Render_EscapesHeadingCtaAndFootnote_ButTrustsTheBody()
    {
        var html = EmailTemplate.Render(
            "Bienvenue <script>",
            EmailTemplate.Paragraph("<strong>ok</strong>"),
            "Go & join", "https://partnr.test/verify?a=1&b=2",
            "Note <i>");

        Assert.Contains("Bienvenue &lt;script&gt;", html);
        Assert.DoesNotContain("<script>", html);
        Assert.Contains("<strong>ok</strong>", html);
        Assert.Contains("Go &amp; join", html);
        Assert.Contains("href=\"https://partnr.test/verify?a=1&amp;b=2\"", html);
        Assert.Contains("Note &lt;i&gt;", html);
    }

    [Fact]
    public void Render_OmitsTheButtonWithoutALink()
    {
        var html = EmailTemplate.Render("Titre", EmailTemplate.Paragraph("corps"));

        Assert.DoesNotContain("<a ", html);
        Assert.Contains("<h1", html);
        Assert.StartsWith("<!doctype html>", html.TrimStart());
    }

    [Fact]
    public void Escape_HandlesNull()
    {
        Assert.Equal("", EmailTemplate.Escape(null));
        Assert.Equal("l&#x27;apéro", EmailTemplate.Escape("l'apéro"));
    }
}
