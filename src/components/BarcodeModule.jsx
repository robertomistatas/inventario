import React from 'react';
import Barcode from 'react-barcode';

const BarcodeModule = ({ items }) => {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Códigos de Barras</h1>
            <button
                onClick={handlePrint}
                className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
                Imprimir Códigos
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {items.map((item) => (
                    <div key={item.code} className="p-4 border rounded shadow">
                        <h2 className="text-lg font-semibold mb-2">{item.name}</h2>
                        <Barcode value={item.code} />
                        <p className="mt-2 text-sm text-gray-600">Categoría: {item.category}</p>
                        <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BarcodeModule;
