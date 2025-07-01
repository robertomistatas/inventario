import React from 'react';
import Barcode from 'react-barcode';

const BarcodeDocument = ({ items }) => {
    return (
        <div className="p-8 space-y-8">
            <div className="text-right mb-4">
                <button 
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 print:hidden"
                >
                    Imprimir Códigos
                </button>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 print:grid-cols-3">
                {items.map((item) => (
                    <div 
                        key={item.code} 
                        className="p-4 border border-gray-200 rounded-lg flex flex-col items-center justify-center break-inside-avoid"
                    >
                        <h3 className="text-sm font-medium text-center mb-2">{item.name}</h3>
                        <Barcode 
                            value={item.code}
                            width={1.5}
                            height={40}
                            fontSize={12}
                            margin={5}
                            displayValue={true}
                        />
                        <p className="text-xs text-gray-500 mt-1">{item.category}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BarcodeDocument;
