
import React, { useState, useCallback, useEffect } from 'react';
import { Toolbar } from './components/Toolbar';
import { PdfViewer } from './components/PdfViewer';
import { Annotation, Tool } from './types';
import { addAnnotationsToPdf } from './services/pdfAnnotator';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [pdfDoc, setPdfDoc] = useState<any | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedTool, setSelectedTool] = useState<Tool>(Tool.Pan);
  const [zoom, setZoom] =useState(1.0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!file) return;

    const loadPdf = async () => {
      const fileReader = new FileReader();
      fileReader.onload = async (e) => {
        if (e.target?.result) {
          const typedarray = new Uint8Array(e.target.result as ArrayBuffer);
          const loadingTask = window.pdfjsLib.getDocument({ data: typedarray });
          const doc = await loadingTask.promise;
          setPdfDoc(doc);
          setAnnotations([]); // Clear annotations for new PDF
          setZoom(1.0);
        }
      };
      fileReader.readAsArrayBuffer(file);
    };

    loadPdf();
  }, [file]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    } else {
      alert('Please select a valid PDF file.');
    }
  };

  const handleAddAnnotation = useCallback((annotation: Annotation) => {
    setAnnotations((prev) => [...prev, annotation]);
  }, []);

  const handleSave = async () => {
    if (!file || !pdfDoc) return;

    setIsSaving(true);
    try {
      const originalPdfBytes = await file.arrayBuffer();
      const annotatedPdfBytes = await addAnnotationsToPdf(originalPdfBytes, annotations);
      
      const blob = new Blob([annotatedPdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `annotated_${fileName || 'document.pdf'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

    } catch (error) {
      console.error('Error saving PDF:', error);
      alert('Failed to save PDF. See console for details.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-gray-800">
      <Toolbar
        selectedTool={selectedTool}
        onToolChange={setSelectedTool}
        onZoomIn={() => setZoom(z => Math.min(z * 1.2, 5))}
        onZoomOut={() => setZoom(z => Math.max(z / 1.2, 0.2))}
        onSave={handleSave}
        isSaving={isSaving}
        hasPdf={!!pdfDoc}
        fileName={fileName}
        onFileChange={handleFileChange}
      />
      <main className="flex-1 flex flex-col items-center justify-center">
        {pdfDoc ? (
          <PdfViewer
            pdfDoc={pdfDoc}
            annotations={annotations}
            onAddAnnotation={handleAddAnnotation}
            selectedTool={selectedTool}
            zoom={zoom}
          />
        ) : (
          <div className="text-center text-gray-400">
            <h2 className="text-2xl font-semibold">Welcome to the PDF Annotation Studio</h2>
            <p className="mt-2">Please upload a PDF file using the panel on the left to begin.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
