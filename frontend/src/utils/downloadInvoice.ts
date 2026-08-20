import api from "../api/client";

export async function openInvoicePdf(saleId: number, invoiceNumber?: string | null): Promise<void> {
  const res = await api.get(`/sales/${saleId}/invoice/`, { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.download = `${invoiceNumber || saleId}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => window.URL.revokeObjectURL(url), 10000);
}
