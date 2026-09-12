using System.Globalization;
using System.Text;
using FarmaciaEliseu.Api.DTOs;

namespace FarmaciaEliseu.Api.Services;

// Gera o cupom/recibo em ESC/POS (bytes crus, Base64) para impressoras
// térmicas de 40 colunas. Layout e regras de negocio portados do sistema
// antigo (CupomService de FarmaciaEliseu.Web) para os DTOs deste backend:
// venda fiada (DataPagamento nula) esconde os valores dos itens/subtotal e
// mostra "APRAZO" no lugar. Ainda nao esta ligado a nenhum endpoint/tela —
// so o gerador do modelo, os pontos de impressao entram depois.
public class CupomService
{
    // Largura típica de bobina 40 colunas
    private const int Cols = 40;

    public string GerarBase64Venda(MovimentoDetalheDto venda, int? codigoFichario = null)
    {
        var bytes = BuildReceipt(venda, codigoFichario);
        return Convert.ToBase64String(bytes);
    }

    private byte[] BuildReceipt(MovimentoDetalheDto venda, int? codigoFichario)
    {
        // Define se é venda FIADO (Marcar)
        // Se não tem data de pagamento, é Fiado.
        bool isFiado = venda.DataPagamento == null;

        // Comandos ESC/POS
        byte[] boldOn = new byte[] { 0x1B, 0x45, 0x01 };
        byte[] boldOff = new byte[] { 0x1B, 0x45, 0x00 };
        byte[] cutPaper = new byte[] { 0x1D, 0x56, 0x42, 0x00 }; // Guilhotina

        // --- Helpers Locais ---
        string Line(string s)
        {
            if (s.Length > Cols) s = s[..Cols];
            return s + "\r\n";
        }

        string Center(string s)
        {
            s ??= "";
            if (s.Length >= Cols) return s[..Cols];
            int left = (Cols - s.Length) / 2;
            return new string(' ', left) + s;
        }

        string Money(decimal v) => v.ToString("N2", new CultureInfo("pt-BR"));

        string FitLeft(string s, int width)
        {
            s ??= "";
            if (s.Length > width) return s[..width];
            return s.PadRight(width);
        }

        string FitRight(string s, int width)
        {
            s ??= "";
            if (s.Length > width) return s[^width..];
            return s.PadLeft(width);
        }

        string RightLine(string s)
        {
            s ??= "";
            if (s.Length > Cols) s = s[^Cols..];
            return new string(' ', Math.Max(0, Cols - s.Length)) + s;
        }
        // ----------------------

        var parts = new List<byte[]>();

        // 1. CABEÇALHO
        parts.Add(Encoding.ASCII.GetBytes(Line("")));

        parts.Add(boldOn);
        parts.Add(Encoding.ASCII.GetBytes(Line(Center(ToAscii("FARMACIA ELISEU")))));
        parts.Add(boldOff);

        parts.Add(Encoding.ASCII.GetBytes(Line(Center(ToAscii("Amaro Franco de Oliveira,560,Jardim Sol")))));
        parts.Add(Encoding.ASCII.GetBytes(Line(Center(ToAscii("(19) 98121-6227")))));
        parts.Add(Encoding.ASCII.GetBytes(Line(Center($"Data: {(venda.DataVenda ?? DateTime.Now):dd/MM/yy HH:mm:ss}"))));
        parts.Add(Encoding.ASCII.GetBytes(Line(new string('-', Cols))));

        // 2. DADOS DA VENDA

        // --- CLIENTE EM NEGRITO ---
        string nomeCliente = ToAscii(venda.ClientesNome ?? "CONSUMIDOR");
        parts.Add(boldOn);
        parts.Add(Encoding.ASCII.GetBytes(Line("")));
        parts.Add(Encoding.ASCII.GetBytes(Line("CLIENTE: ")));
        parts.Add(Encoding.ASCII.GetBytes(Line(nomeCliente)));
        parts.Add(Encoding.ASCII.GetBytes(Line("")));
        parts.Add(boldOff);

        // --- VENDEDOR ---
        parts.Add(Encoding.ASCII.GetBytes(Line("VENDEDOR: " + ToAscii(venda.FuncionariosNome ?? ""))));

        // --- FICHARIO (SE HOUVER) ---
        if (codigoFichario is > 0)
        {
            parts.Add(Encoding.ASCII.GetBytes(Line("FICHARIO: " + codigoFichario)));
        }

        parts.Add(Encoding.ASCII.GetBytes(Line(new string('-', Cols))));

        // 3. ITENS
        // Cabeçalho: QTD  DESCRICAO (Resumida) VALOR
        string header = string.Concat(
            FitLeft("QTD", 4), " ",
            FitLeft("ITEM", 26), " ",
            FitLeft("TOTAL", 8)
        );
        parts.Add(Encoding.ASCII.GetBytes(Line(header)));

        if (venda.Itens != null && venda.Itens.Any())
        {
            foreach (var item in venda.Itens)
            {
                string desc = ToAscii(item.ProdutosDescricao ?? "");
                if (desc.Length > 26) desc = desc[..26];

                // --- LÓGICA DE VALOR DOS ITENS ---
                string valorExibido;
                if (isFiado)
                {
                    valorExibido = "  APRAZO"; // Texto fixo se for fiado
                }
                else
                {
                    valorExibido = Money(item.PrecoTotalDiaVenda ?? 0); // Valor normal
                }

                string linha = string.Concat(
                    FitRight((item.Quantidade ?? 0).ToString(), 3), "  ",
                    FitLeft(desc, 26), " ",
                    FitRight(valorExibido, 8)
                );
                parts.Add(Encoding.ASCII.GetBytes(Line(linha)));
            }
        }
        else
        {
            parts.Add(Encoding.ASCII.GetBytes(Line("SEM ITENS REGISTRADOS")));
        }

        parts.Add(Encoding.ASCII.GetBytes(Line(new string('-', Cols))));

        // 4. TOTAIS
        var valorTotal = venda.ValorTotal ?? 0;
        var descontoTotal = venda.DescontoTotal ?? 0;

        // Se for Fiado, escondemos também o subtotal e o total numérico
        if (!isFiado && descontoTotal > 0)
        {
            parts.Add(Encoding.ASCII.GetBytes(Line(RightLine("SUBTOTAL: " + Money(valorTotal + descontoTotal)))));
            parts.Add(Encoding.ASCII.GetBytes(Line(RightLine("DESCONTO: -" + Money(descontoTotal)))));
        }

        // --- LÓGICA DO TOTAL FINAL ---
        string totalFinalTexto;
        if (isFiado)
        {
            totalFinalTexto = "APRAZO";
        }
        else
        {
            totalFinalTexto = Money(valorTotal);
        }

        parts.Add(boldOn);
        parts.Add(Encoding.ASCII.GetBytes(Line(RightLine("TOTAL A PAGAR: " + totalFinalTexto))));
        parts.Add(boldOff);

        // FORMA DE PAGAMENTO
        string formaPag = isFiado ? "MARCAR / FIADO" : "DINHEIRO / PAGO";
        parts.Add(Encoding.ASCII.GetBytes(Line("PAGAMENTO: " + ToAscii(formaPag))));

        // 5. RODAPÉ
        parts.Add(Encoding.ASCII.GetBytes(Line("")));
        parts.Add(Encoding.ASCII.GetBytes(Line("")));
        parts.Add(Encoding.ASCII.GetBytes(Line(Center("________________________________"))));
        parts.Add(Encoding.ASCII.GetBytes(Line(Center("ASSINATURA CLIENTE"))));
        parts.Add(Encoding.ASCII.GetBytes(Line("")));

        // --- DOC ---
        if (venda.CodigoMovimento is > 0)
            parts.Add(Encoding.ASCII.GetBytes(Line(Center($"DOC: {venda.CodigoMovimento}"))));
        // -----------

        parts.Add(Encoding.ASCII.GetBytes(Line(Center("OBRIGADO PELA PREFERENCIA!"))));

        // Espaço final e corte
        parts.Add(Encoding.ASCII.GetBytes("\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n"));
        parts.Add(cutPaper);

        // Junta tudo num único buffer
        int totalBytes = parts.Sum(p => p.Length);
        var buf = new byte[totalBytes];
        int pos = 0;
        foreach (var p in parts)
        {
            Buffer.BlockCopy(p, 0, buf, pos, p.Length);
            pos += p.Length;
        }

        return buf;
    }

    private static string ToAscii(string s)
    {
        s ??= "";
        string n = s.Normalize(NormalizationForm.FormD);
        var arr = n.Where(c => CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark).ToArray();
        var ascii = new string(arr);
        // Remove caracteres estranhos que a impressora pode não entender
        return new string(ascii.Select(c => c <= 0x7F ? c : '?').ToArray());
    }
}
