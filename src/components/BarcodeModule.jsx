import React, { useState, useEffect } from 'react';
import Barcode from 'react-barcode';


const BarcodeModule = ({ items, refreshItems }) => {
    const [filterCategory, setFilterCategory] = useState('Todos');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItems, setSelectedItems] = useState([]); // array de ids
    const [copies, setCopies] = useState({}); // {id: cantidad}
    const [selectAll, setSelectAll] = useState(false);

    // Filtrado por categoría y búsqueda
    const filteredItems = items.filter(item => {
        const matchesCategory = filterCategory === 'Todos' || (item.category && item.category.trim().toLowerCase() === filterCategory.trim().toLowerCase());
        const matchesSearch =
            item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.code?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    // Selección de items
    useEffect(() => {
        if (selectAll) {
            setSelectedItems(filteredItems.map(item => item.id));
        } else if (selectedItems.length > 0) {
            // Si se desmarca selectAll, mantener solo los seleccionados que aún están en el filtro
            setSelectedItems(selectedItems.filter(id => filteredItems.some(item => item.id === id)));
        }
        // eslint-disable-next-line
    }, [selectAll, filterCategory, searchTerm, items]);

    const handleRefresh = async () => {
        await refreshItems();
    };

    const handleFilterChange = (event) => {
        setFilterCategory(event.target.value);
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleSelectAll = (e) => {
        setSelectAll(e.target.checked);
    };

    const handleSelectItem = (id) => {
        setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleCopiesChange = (id, value) => {
        setCopies(prev => ({ ...prev, [id]: Math.max(1, parseInt(value) || 1) }));
    };

    // Imprimir solo el área de códigos seleccionados y con la cantidad de copias
    const handlePrint = () => {
        const printContents = document.getElementById('print-area').innerHTML;
        const originalContents = document.body.innerHTML;
        document.body.innerHTML = printContents;
        window.print();
        document.body.innerHTML = originalContents;
        window.location.reload();
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Códigos de Barras</h1>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-4 mb-4 print:hidden">
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
                <input
                    type="text"
                    placeholder="Buscar por nombre o código..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="px-4 py-2 border rounded-md w-full sm:w-64"
                />
                <button
                    onClick={handlePrint}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    disabled={selectedItems.length === 0}
                >
                    Imprimir Selección
                </button>
                <button
                    onClick={handleRefresh}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                    Refrescar Códigos
                </button>
            </div>
            <div className="mb-2 print:hidden flex items-center gap-2">
                <input type="checkbox" checked={selectAll} onChange={handleSelectAll} id="selectAllBarcodes" />
                <label htmlFor="selectAllBarcodes" className="text-sm">Seleccionar todos</label>
            </div>
            <div className="mb-4 print:hidden grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredItems.map(item => (
                    <div key={item.id} className="p-4 border rounded shadow flex flex-col gap-2">
                        <div className="flex items-center gap-2 mb-2">
                            <input
                                type="checkbox"
                                checked={selectedItems.includes(item.id)}
                                onChange={() => handleSelectItem(item.id)}
                                id={`select-barcode-${item.id}`}
                            />
                            <label htmlFor={`select-barcode-${item.id}`} className="font-semibold text-base">{item.name}</label>
                        </div>
                        <Barcode value={item.code || 'N/A'} />
                        <p className="text-sm text-gray-600">Código: {item.code}</p>
                        <p className="text-sm text-gray-600">Categoría: {item.category || 'Sin categoría'}</p>
                        <div className="flex items-center gap-2 mt-2">
                            <label htmlFor={`copies-${item.id}`} className="text-xs">Copias:</label>
                            <input
                                id={`copies-${item.id}`}
                                type="number"
                                min={1}
                                value={copies[item.id] || 1}
                                onChange={e => handleCopiesChange(item.id, e.target.value)}
                                className="w-16 px-2 py-1 border rounded"
                            />
                        </div>
                    </div>
                ))}
            </div>
            {/* Área de impresión */}
            <div id="print-area">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {items.filter(item => selectedItems.includes(item.id)).flatMap(item =>
                        Array.from({ length: copies[item.id] || 1 }).map((_, idx) => (
                            <div key={item.id + '-copy-' + idx} className="p-4 border rounded shadow break-inside-avoid">
                                <h2 className="text-lg font-semibold mb-2">{item.name}</h2>
                                <Barcode value={item.code || 'N/A'} />
                                <p className="mt-2 text-sm text-gray-600">Categoría: {item.category || 'Sin categoría'}</p>
                                <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                            </div>
                        ))
                    )}
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
