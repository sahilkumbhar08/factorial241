
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Annotation, Point, Tool, TextAnnotation } from '../types';

interface PdfViewerProps {
  pdfDoc: any; // PDFDocumentProxy from pdf.js
  annotations: Annotation[];
  onAddAnnotation: (annotation: Annotation) => void;
  selectedTool: Tool;
  zoom: number;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ pdfDoc, annotations, onAddAnnotation, selectedTool, zoom }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentShape, setCurrentShape] = useState<React.ReactNode | null>(null);
  const [viewport, setViewport] = useState<any | null>(null);
  
  const [isPanning, setIsPanning] = useState(false);
  const panInfo = useRef({ startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0 });

  const renderPage = useCallback(async () => {
    if (!pdfDoc) return;
    const page = await pdfDoc.getPage(1); // Using first page
    const newViewport = page.getViewport({ scale: zoom });
    setViewport(newViewport);

    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext('2d');
      if (context) {
        canvas.height = newViewport.height;
        canvas.width = newViewport.width;
        
        const renderContext = {
          canvasContext: context,
          viewport: newViewport,
        };
        await page.render(renderContext).promise;
      }
    }
  }, [pdfDoc, zoom]);

  useEffect(() => {
    renderPage();
  }, [renderPage]);
  
  const getMousePosition = (e: React.MouseEvent): Point | null => {
    const container = containerRef.current;
    if (!container) return null;
    const rect = container.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const toPdfPoint = (viewPoint: Point): Point | null => {
    if (!viewport) return null;
    const pdfPoint = viewport.convertToPdfPoint(viewPoint.x, viewPoint.y);
    return { x: pdfPoint[0], y: pdfPoint[1] };
  };

  const fromPdfPoint = (pdfPoint: Point): Point | null => {
    if (!viewport) return null;
    const viewPoint = viewport.convertToViewportPoint(pdfPoint.x, pdfPoint.y);
    return { x: viewPoint[0], y: viewPoint[1] };
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getMousePosition(e);
    if (!pos) return;
    
    if (selectedTool === Tool.Pan) {
      if (containerRef.current) {
        setIsPanning(true);
        panInfo.current = {
          startX: e.pageX,
          startY: e.pageY,
          scrollLeft: containerRef.current.scrollLeft,
          scrollTop: containerRef.current.scrollTop,
        };
      }
      return;
    }

    if (selectedTool === Tool.Line || selectedTool === Tool.Circle) {
      setIsDrawing(true);
      setStartPoint(pos);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && containerRef.current) {
      const dx = e.pageX - panInfo.current.startX;
      const dy = e.pageY - panInfo.current.startY;
      containerRef.current.scrollLeft = panInfo.current.scrollLeft - dx;
      containerRef.current.scrollTop = panInfo.current.scrollTop - dy;
      return;
    }
      
    if (!isDrawing || !startPoint) return;
    const currentPos = getMousePosition(e);
    if (!currentPos) return;

    if (selectedTool === Tool.Line) {
      setCurrentShape(<line x1={startPoint.x} y1={startPoint.y} x2={currentPos.x} y2={currentPos.y} stroke="red" strokeWidth="2" />);
    } else if (selectedTool === Tool.Circle) {
      const radius = Math.sqrt(Math.pow(currentPos.x - startPoint.x, 2) + Math.pow(currentPos.y - startPoint.y, 2));
      setCurrentShape(<circle cx={startPoint.x} cy={startPoint.y} r={radius} stroke="red" strokeWidth="2" fill="none" />);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }
      
    if (!isDrawing || !startPoint) return;

    const endPoint = getMousePosition(e);
    if (!endPoint) return;

    const pdfStart = toPdfPoint(startPoint);
    const pdfEnd = toPdfPoint(endPoint);
    if (!pdfStart || !pdfEnd) return;

    let newAnnotation: Annotation | null = null;
    if (selectedTool === Tool.Line) {
      newAnnotation = { id: window.nanoid.nanoid(), type: Tool.Line, start: pdfStart, end: pdfEnd };
    } else if (selectedTool === Tool.Circle) {
      const radius = Math.sqrt(Math.pow(pdfEnd.x - pdfStart.x, 2) + Math.pow(pdfEnd.y - pdfStart.y, 2));
      newAnnotation = { id: window.nanoid.nanoid(), type: Tool.Circle, center: pdfStart, radius };
    }
    
    if (newAnnotation) onAddAnnotation(newAnnotation);
    
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentShape(null);
  };

  const handleMouseLeave = () => {
    if (isPanning) {
      setIsPanning(false);
    }
    if (isDrawing) {
      setIsDrawing(false);
      setStartPoint(null);
      setCurrentShape(null);
    }
  };
  
  const handleClick = (e: React.MouseEvent) => {
    if (isDrawing || isPanning) return;

    if(selectedTool === Tool.Text) {
      const pos = getMousePosition(e);
      if(!pos) return;

      const text = prompt("Enter annotation text:");
      if (text) {
        const pdfPoint = toPdfPoint(pos);
        if(!pdfPoint) return;
        
        // Font size in PDF points. 12pt is standard.
        const fontSize = 12 / zoom;
        
        onAddAnnotation({
          id: window.nanoid.nanoid(),
          type: Tool.Text,
          point: pdfPoint,
          text,
          fontSize: fontSize
        });
      }
    }
  }

  const renderAnnotation = (annotation: Annotation): React.ReactNode => {
    if (!viewport) return null;

    switch (annotation.type) {
      case Tool.Text: {
        const viewPoint = fromPdfPoint(annotation.point);
        if(!viewPoint) return null;
        return <text key={annotation.id} x={viewPoint.x} y={viewPoint.y} fill="red" fontSize={annotation.fontSize * zoom} fontFamily='Helvetica'>{annotation.text}</text>;
      }
      case Tool.Line: {
        const start = fromPdfPoint(annotation.start);
        const end = fromPdfPoint(annotation.end);
        if(!start || !end) return null;
        return <line key={annotation.id} x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="red" strokeWidth="2" />;
      }
      case Tool.Circle: {
        const center = fromPdfPoint(annotation.center);
        if(!center) return null;
        // Radius also needs to be scaled by zoom
        return <circle key={annotation.id} cx={center.x} cy={center.y} r={annotation.radius * zoom} stroke="red" strokeWidth="2" fill="none" />;
      }
      default:
        return null;
    }
  };

  return (
    <div 
        ref={containerRef}
        className="flex-1 bg-gray-700 overflow-auto" 
        style={{ cursor: selectedTool === Tool.Pan ? (isPanning ? 'grabbing' : 'grab') : 'crosshair' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
    >
      <div
        className="relative mx-auto my-4 shadow-lg"
        style={{ width: viewport?.width, height: viewport?.height }}
      >
        <canvas ref={canvasRef} />
        <svg 
            ref={svgRef}
            className="absolute top-0 left-0" 
            width={viewport?.width} 
            height={viewport?.height}
        >
          {annotations.map(renderAnnotation)}
          {isDrawing && currentShape}
        </svg>
      </div>
    </div>
  );
};
