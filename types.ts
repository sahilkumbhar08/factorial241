
declare global {
  interface Window {
    pdfjsLib: any;
    PDFLib: any;
    nanoid: {
      nanoid: () => string;
    };
  }
}

export enum Tool {
  Select = 'SELECT',
  Pan = 'PAN',
  Text = 'TEXT',
  Line = 'LINE',
  Circle = 'CIRCLE',
}

export interface Point {
  x: number;
  y: number;
}

interface BaseAnnotation {
  id: string;
  type: Tool;
}

export interface TextAnnotation extends BaseAnnotation {
  type: Tool.Text;
  point: Point;
  text: string;
  fontSize: number;
}

export interface LineAnnotation extends BaseAnnotation {
  type: Tool.Line;
  start: Point;
  end: Point;
}

export interface CircleAnnotation extends BaseAnnotation {
  type: Tool.Circle;
  center: Point;
  radius: number;
}

export type Annotation = TextAnnotation | LineAnnotation | CircleAnnotation;
