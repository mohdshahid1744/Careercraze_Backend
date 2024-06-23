// types/pdf-parse.d.ts
declare module 'pdf-parse' {
    interface PDFInfo {
      [key: string]: any;
    }
  
    interface PDFText {
      [key: string]: any;
    }
  
    interface PDFMetadata {
      [key: string]: any;
    }
  
    interface PDFVersion {
      [key: string]: any;
    }
  
    interface PDF {
      numpages: number;
      numrender: number;
      info: PDFInfo;
      metadata: PDFMetadata;
      text: PDFText;
      version: PDFVersion;
    }
  
    function pdf(dataBuffer: Buffer): Promise<PDF>;
  
    export = pdf;
  }
  