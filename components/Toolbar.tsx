
import React from 'react';
import { Tool } from '../types';
import { MousePointerIcon, HandIcon, TypeIcon, LineIcon, CircleIcon, ZoomInIcon, ZoomOutIcon, SaveIcon } from './Icons';

interface ToolbarProps {
  selectedTool: Tool;
  onToolChange: (tool: Tool) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onSave: () => void;
  isSaving: boolean;
  hasPdf: boolean;
  fileName: string;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const ToolButton = ({
  icon,
  label,
  isSelected,
  onClick,
  disabled = false
}: ToolButtonProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex flex-col items-center p-2 rounded-lg transition-colors duration-200 ${
      isSelected ? 'bg-blue-600 text-white' : 'hover:bg-gray-600'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    aria-label={label}
  >
    {icon}
    <span className="text-xs mt-1">{label}</span>
  </button>
);


export const Toolbar: React.FC<ToolbarProps> = ({
  selectedTool,
  onToolChange,
  onZoomIn,
  onZoomOut,
  onSave,
  isSaving,
  hasPdf,
  fileName,
  onFileChange,
}) => {
  const tools = [
    { id: Tool.Select, icon: <MousePointerIcon />, label: 'Select' },
    { id: Tool.Pan, icon: <HandIcon />, label: 'Pan' },
    { id: Tool.Text, icon: <TypeIcon />, label: 'Text' },
    { id: Tool.Line, icon: <LineIcon />, label: 'Line' },
    { id: Tool.Circle, icon: <CircleIcon />, label: 'Circle' },
  ];

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col p-4 space-y-6">
      <div className="flex-grow">
        <h1 className="text-xl font-bold mb-4">PDF Annotator</h1>
        
        <div>
          <label htmlFor="file-upload" className="w-full inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded cursor-pointer text-center">
            {fileName ? 'Change PDF' : 'Upload PDF'}
          </label>
          <input id="file-upload" type="file" accept=".pdf" onChange={onFileChange} className="hidden" />
          {fileName && <p className="text-xs mt-2 text-gray-400 truncate">Loaded: {fileName}</p>}
        </div>

        <div className="mt-6">
          <h2 className="text-sm font-semibold text-gray-400 mb-2">Tools</h2>
          <div className="grid grid-cols-2 gap-2">
            {tools.map((tool) => (
              <ToolButton
                key={tool.id}
                icon={tool.icon}
                label={tool.label}
                isSelected={selectedTool === tool.id}
                onClick={() => onToolChange(tool.id)}
                disabled={!hasPdf}
              />
            ))}
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-sm font-semibold text-gray-400 mb-2">View</h2>
          <div className="flex space-x-2">
            <button onClick={onZoomIn} disabled={!hasPdf} className="flex-1 bg-gray-700 hover:bg-gray-600 p-2 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"><ZoomInIcon/></button>
            <button onClick={onZoomOut} disabled={!hasPdf} className="flex-1 bg-gray-700 hover:bg-gray-600 p-2 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"><ZoomOutIcon/></button>
          </div>
        </div>
      </div>

      <div className="flex-shrink-0">
        <button
          onClick={onSave}
          disabled={!hasPdf || isSaving}
          className="w-full flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SaveIcon className="mr-2"/>
          {isSaving ? 'Saving...' : 'Save & Download'}
        </button>
      </div>
    </div>
  );
};