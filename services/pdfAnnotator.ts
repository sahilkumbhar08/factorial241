
import { Annotation, Tool, Point, TextAnnotation, LineAnnotation, CircleAnnotation } from '../types';

// Helper function to convert viewer coordinates to PDF coordinates
const toPdfCoords = (point: Point, page: any): Point => {
  const { width, height } = page.getSize();
  // For standard rotation, PDF origin is bottom-left
  return { x: point.x, y: height - point.y };
};

export const addAnnotationsToPdf = async (
  originalPdfBytes: ArrayBuffer,
  annotations: Annotation[]
): Promise<Uint8Array> => {
  const { PDFDocument, rgb, StandardFonts } = window.PDFLib;

  const pdfDoc = await PDFDocument.load(originalPdfBytes);
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const page = pdfDoc.getPages()[0]; // Work on the first page
  const { width, height } = page.getSize();

  annotations.forEach(annotation => {
    switch (annotation.type) {
      case Tool.Text: {
        const textAnnotation = annotation as TextAnnotation;
        const { x, y } = toPdfCoords(textAnnotation.point, page);
        page.drawText(textAnnotation.text, {
          x: x,
          y: y,
          font: helveticaFont,
          size: textAnnotation.fontSize, // Use stored font size
          color: rgb(0.95, 0.1, 0.1),
        });
        break;
      }
      case Tool.Line: {
        const lineAnnotation = annotation as LineAnnotation;
        const start = toPdfCoords(lineAnnotation.start, page);
        const end = toPdfCoords(lineAnnotation.end, page);
        page.drawLine({
          start,
          end,
          thickness: 2,
          color: rgb(0.95, 0.1, 0.1),
        });
        break;
      }
      case Tool.Circle: {
        const circleAnnotation = annotation as CircleAnnotation;
        const center = toPdfCoords(circleAnnotation.center, page);
        page.drawCircle({
          x: center.x,
          y: center.y,
          radius: circleAnnotation.radius,
          borderWidth: 2,
          borderColor: rgb(0.95, 0.1, 0.1),
        });
        break;
      }
      default:
        break;
    }
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
};
