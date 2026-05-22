import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';

interface ExportButtonProps {
    data: any[];
    filename: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({ data, filename }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleExport = (type: 'pdf' | 'excel') => {
        console.log(`Exportando ${data.length} registros para ${type}: ${filename}.${type}`);
        setIsOpen(false);
        // Aqui entraria a lógica com bibliotecas como jsPDF ou SheetJS
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg transition-all text-sm font-medium shadow-sm"
            >
                <Download size={16} />
                <span>Exportar</span>
                <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <button onClick={() => handleExport('excel')} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-green-50 hover:text-green-700 transition-colors border-b border-gray-50">
                        <FileSpreadsheet size={18} className="text-green-600" /> Excel (.xlsx)
                    </button>
                    <button onClick={() => handleExport('pdf')} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-red-50 hover:text-red-700 transition-colors">
                        <FileText size={18} className="text-red-600" /> PDF (.pdf)
                    </button>
                </div>
            )}
        </div>
    );
};

export default ExportButton;