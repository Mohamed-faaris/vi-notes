declare module "html2pdf.js" {
  type Worker = {
    set(options: Record<string, unknown>): Worker;
    from(source: HTMLElement): Worker;
    save(): Promise<void>;
  };

  type Html2PdfFactory = () => Worker;

  const html2pdf: Html2PdfFactory;
  export default html2pdf;
}
