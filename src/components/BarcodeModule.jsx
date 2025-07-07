import React, { useState, useEffect } from 'react';
import Barcode from 'react-barcode';

const BarcodeModule = ({ items, refreshItems }) => {
    const [localItems, setLocalItems] = useState(items);
    const [filterCategory, setFilterCategory] = useState('Todos');

    useEffect(() => {
        if (filterCategory === 'Todos') {
            setLocalItems(items);
        } else {
            setLocalItems(items.filter(item => {
                const itemCategory = item.category ? item.category.trim().toLowerCase() : '';
                const selectedCategory = filterCategory.trim().toLowerCase();
                return itemCategory === selectedCategory;
            }));
        }
    }, [items, filterCategory]);

    const handleRefresh = async () => {
        const updatedItems = await refreshItems(); // Llama a la función para obtener los nuevos productos
        setLocalItems(updatedItems);
    };

    const handleFilterChange = (event) => {
        setFilterCategory(event.target.value);
    };


    // Imprimir solo el área de códigos
    const handlePrint = () => {
        const printContents = document.getElementById('print-area').innerHTML;
        const originalContents = document.body.innerHTML;
        document.body.innerHTML = printContents;
        window.print();
        document.body.innerHTML = originalContents;
        window.location.reload(); // Para recargar el JS y restaurar el estado
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Códigos de Barras</h1>
            <div className="flex gap-4 mb-4 print:hidden">
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
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Imprimir Códigos
                </button>
                <button
                    onClick={handleRefresh}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                    Refrescar Códigos
                </button>
            </div>
            {/* Área de impresión */}
            <div id="print-area">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {localItems.map((item) => (
                        <div key={item.code} className="p-4 border rounded shadow break-inside-avoid">
                            <h2 className="text-lg font-semibold mb-2">{item.name}</h2>
                            <Barcode value={item.code || 'N/A'} />
                            <p className="mt-2 text-sm text-gray-600">Categoría: {item.category || 'Sin categoría'}</p>
                            <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                        </div>
                    ))}
                </div>
            </div>
            {/* Estilos para impresión */}
            <style>{`
                @media print {
                    body { background: white !important; }
                    .print\:hidden { display: none !important; }
                    #print-area { display: block; }
                    #print-area .grid { display: grid !important; grid-template-columns: repeat(3, 1fr) !important; gap: 1rem !important; }
                    #print-area .break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
                    #print-area .border, #print-area .shadow { box-shadow: none !important; border: 1px solid #ccc !important; }
                    #print-area { margin: 0 !important; padding: 0 !important; }
                }
            `}</style>
        </div>
    );
};

export default BarcodeModule;
