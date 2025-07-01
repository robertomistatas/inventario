import React, { useRef, useState } from 'react';
import Barcode from 'react-barcode';

const BarcodeDocument = ({ items }) => {
    const printRef = useRef();
    const [filteredItems, setFilteredItems] = useState(items);
    const [filterCategory, setFilterCategory] = useState('Todos');

    const handlePrint = () => {
        const printContent = printRef.current;
        const printWindow = window.open('', '_blank');
        printWindow.document.write('<html><head><title>Imprimir Códigos</title><style>@media print { body { margin: 20mm; } .barcode-item { page-break-inside: avoid; margin-bottom: 20mm; text-align: center; } .print-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10mm; } }</style></head><body>');
        printWindow.document.write(printContent.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
    };

    const handleFilterChange = (event) => {
        const category = event.target.value;
        setFilterCategory(category);
        if (category === 'Todos') {
            setFilteredItems(items);
        } else {
            setFilteredItems(items.filter(item => item.category === category));
        }
    };

    return (
        <div className="p-8 space-y-8">
            <div className="text-right mb-4">
                <select 
                    value={filterCategory} 
                    onChange={handleFilterChange} 
                    className="px-4 py-2 border rounded-md"
                >
                    <option value="Todos">Todos</option>
                    <option value="Dispositivos Inteligentes">Dispositivos Inteligentes</option>
                    <option value="Materiales de instalación">Materiales de instalación</option>
                    <option value="Consumibles">Consumibles</option>
                    <option value="Manuales / Recordatorios">Manuales / Recordatorios</option>
                </select>
                <button 
                    onClick={handlePrint}
                    className="ml-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 print:hidden"
                >
                    Imprimir Códigos
                </button>
            </div>
            <div ref={printRef} className="print-grid">
                {filteredItems.map((item) => (
                    <div 
                        key={item.code} 
                        className="barcode-item p-4 border border-gray-200 rounded-lg flex flex-col items-center justify-center break-inside-avoid"
                    >
                        <h3 className="text-sm font-medium text-center mb-2">{item.name}</h3>
                        <Barcode 
                            value={item.code || 'N/A'} 
                            width={1.5}
                            height={40}
                            fontSize={12}
                            margin={5}
                            displayValue={true}
                        />
                        <p className="text-xs text-gray-600 mt-2">Categoría: {item.category}</p>
                        <p className="text-xs text-gray-600">Cantidad: {item.quantity}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BarcodeDocument;
