using System.Runtime.InteropServices;
using System.Text;

namespace FarmaciaEliseu.PrintAgent;

// Envia bytes crus (ESC/POS) direto para uma impressora instalada no Windows,
// sem passar pelo driver/rasterizador de texto comum. Baseado no padrao
// classico da Microsoft para impressao RAW via winspool.drv (KB322091).
public static class RawPrinterHelper
{
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
    private class DocInfoA
    {
        [MarshalAs(UnmanagedType.LPStr)] public string pDocName = "Cupom Farmacia Eliseu";
        [MarshalAs(UnmanagedType.LPStr)] public string? pOutputFile = null;
        [MarshalAs(UnmanagedType.LPStr)] public string pDataType = "RAW";
    }

    [DllImport("winspool.drv", EntryPoint = "OpenPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true)]
    private static extern bool OpenPrinter(string szPrinter, out IntPtr hPrinter, IntPtr pd);

    [DllImport("winspool.drv", EntryPoint = "ClosePrinter", SetLastError = true)]
    private static extern bool ClosePrinter(IntPtr hPrinter);

    [DllImport("winspool.drv", EntryPoint = "StartDocPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true)]
    private static extern bool StartDocPrinter(IntPtr hPrinter, int level, DocInfoA di);

    [DllImport("winspool.drv", EntryPoint = "EndDocPrinter", SetLastError = true)]
    private static extern bool EndDocPrinter(IntPtr hPrinter);

    [DllImport("winspool.drv", EntryPoint = "StartPagePrinter", SetLastError = true)]
    private static extern bool StartPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.drv", EntryPoint = "EndPagePrinter", SetLastError = true)]
    private static extern bool EndPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.drv", EntryPoint = "WritePrinter", SetLastError = true)]
    private static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);

    [DllImport("winspool.drv", EntryPoint = "GetDefaultPrinterW", SetLastError = true, CharSet = CharSet.Unicode)]
    private static extern bool GetDefaultPrinter(StringBuilder pszBuffer, ref int pcchBuffer);

    public static string? ObterImpressoraPadrao()
    {
        int tamanho = 256;
        var buffer = new StringBuilder(tamanho);
        return GetDefaultPrinter(buffer, ref tamanho) ? buffer.ToString() : null;
    }

    public static void SendBytesToPrinter(string printerName, byte[] bytes)
    {
        if (!OpenPrinter(printerName, out var hPrinter, IntPtr.Zero))
        {
            throw new InvalidOperationException(
                $"Não foi possível abrir a impressora '{printerName}' (erro {Marshal.GetLastWin32Error()}).");
        }

        try
        {
            var docInfo = new DocInfoA();
            if (!StartDocPrinter(hPrinter, 1, docInfo))
            {
                throw new InvalidOperationException(
                    $"Não foi possível iniciar o documento de impressão (erro {Marshal.GetLastWin32Error()}).");
            }

            try
            {
                if (!StartPagePrinter(hPrinter))
                {
                    throw new InvalidOperationException(
                        $"Não foi possível iniciar a página de impressão (erro {Marshal.GetLastWin32Error()}).");
                }

                var ponteiroNaoGerenciado = Marshal.AllocCoTaskMem(bytes.Length);
                try
                {
                    Marshal.Copy(bytes, 0, ponteiroNaoGerenciado, bytes.Length);
                    if (!WritePrinter(hPrinter, ponteiroNaoGerenciado, bytes.Length, out _))
                    {
                        throw new InvalidOperationException(
                            $"Falha ao enviar os dados para a impressora (erro {Marshal.GetLastWin32Error()}).");
                    }
                }
                finally
                {
                    Marshal.FreeCoTaskMem(ponteiroNaoGerenciado);
                }

                EndPagePrinter(hPrinter);
            }
            finally
            {
                EndDocPrinter(hPrinter);
            }
        }
        finally
        {
            ClosePrinter(hPrinter);
        }
    }
}
