import React, { useState, useEffect } from 'react';
import { useScanner } from '../hooks/useScanner';
import { Scan, ScanLine, CheckCircle, XCircle, AlertTriangle, Plus, Minus, Edit2 } from 'lucide-react';
import { serverTimestamp } from 'firebase/firestore';

const ScannerModule = ({ items, onSave, onUpdateStock }) => {
    const [isActive, setIsActive] = useState(false);
    const [scanMode, setScanMode] = useState(null); // 'add', 'remove'
    const [scannedItem, setScannedItem] = useState(null);
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');
    const [notificationType, setNotificationType] = useState('info');
    const [quantity, setQuantity] = useState(1);
    const [step, setStep] = useState('select-mode'); // 'select-mode', 'scan-item', 'enter-quantity', 'confirm'

    const handleScan = (barcode) => {
        try {
            if (step !== 'scan-item') {
                showNotif('Por favor, seleccione primero una operación', 'info');
                return;
            }

            // Normalizar el código escaneado
            const normalizedBarcode = barcode.replace(/'/g, '-').trim();

            // Buscar el item por código
            const item = items.find(i => i.code === normalizedBarcode);

            if (!item) {
                showNotif(`Producto no encontrado en el inventario. Código escaneado: ${normalizedBarcode}`, 'error');
                return;
            }

            setScannedItem(item);
            setStep('enter-quantity');
            showNotif(`Producto encontrado: ${item.name}. Ingrese la cantidad.`, 'success');

        } catch (error) {
            console.log('Error al procesar el código:', error);
            showNotif('Error al procesar el código de barras', 'error');
        }
    };

    const { startListening, stopListening, isListening } = useScanner(handleScan);

    const showNotif = (message, type) => {
        setNotificationMessage(message);
        setNotificationType(type);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
    };

    const handleModeSelect = (mode) => {
        setScanMode(mode);
        setStep('scan-item');
        showNotif(`Modo ${mode === 'add' ? 'agregar' : 'retirar'} activado. Escanee el producto.`, 'info');
    };

    const handleQuantitySubmit = async () => {
        if (!scannedItem || !scanMode) return;

        try {
            const newQuantity = scanMode === 'add' 
                ? scannedItem.quantity + quantity
                : scannedItem.quantity - quantity;

            if (newQuantity < 0) {
                showNotif('No hay suficiente stock para retirar esa cantidad', 'error');
                return;
            }

            await onUpdateStock(scannedItem.id, newQuantity, scanMode, quantity);
            showNotif(`Stock ${scanMode === 'add' ? 'agregado' : 'retirado'} exitosamente`, 'success');
            resetScanState();
        } catch (error) {
            showNotif('Error al actualizar el stock', 'error');
        }
    };

    const resetScanState = () => {
        setScanMode(null);
        setScannedItem(null);
        setQuantity(1);
        setStep('select-mode');
    };

    useEffect(() => {
        if (isActive) {
            startListening();
        } else {
            stopListening();
            resetScanState();
        }
    }, [isActive, startListening, stopListening]);

    return (
        <div className="p-6 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Módulo de Escaneo</h2>
                <button
                    onClick={() => setIsActive(!isActive)}
                    className={`flex items-center px-4 py-2 rounded-md ${
                        isActive 
                            ? 'bg-red-600 hover:bg-red-700 text-white' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                    } transition-colors duration-200`}
                >
                    <Scan className="w-5 h-5 mr-2" />
                    {isActive ? 'Detener Escaneo' : 'Iniciar Escaneo'}
                </button>
            </div>

            {isActive && (
                <div className="space-y-4">
                    {step === 'select-mode' && (
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => handleModeSelect('add')}
                                className="flex items-center justify-center p-4 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-800/50"
                            >
                                <Plus className="w-6 h-6 mr-2" />
                                Agregar Productos
                            </button>
                            <button
                                onClick={() => handleModeSelect('remove')}
                                className="flex items-center justify-center p-4 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800/50"
                            >
                                <Minus className="w-6 h-6 mr-2" />
                                Retirar Productos
                            </button>
                        </div>
                    )}

                    {step === 'scan-item' && (
                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="text-center">
                                <Scan className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                                <p className="text-lg font-medium text-gray-900 dark:text-white">
                                    Escanee el código de barras del producto
                                </p>
                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                    Modo: {scanMode === 'add' ? 'Agregar' : 'Retirar'} productos
                                </p>
                            </div>
                            <button
                                onClick={resetScanState}
                                className="mt-4 w-full py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            >
                                Cambiar modo
                            </button>
                        </div>
                    )}

                    {step === 'enter-quantity' && scannedItem && (
                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                        {scannedItem.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Stock actual: {scannedItem.quantity}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Cantidad a {scanMode === 'add' ? 'agregar' : 'retirar'}
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={quantity}
                                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                                        className="mt-1 block w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                                    />
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={handleQuantitySubmit}
                                        className="flex-1 py-2 px-4 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                                    >
                                        Confirmar
                                    </button>
                                    <button
                                        onClick={resetScanState}
                                        className="flex-1 py-2 px-4 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Notificación */}
            {showNotification && (
                <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
                    notificationType === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' :
                    notificationType === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' :
                    'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                } transition-all duration-300`}>
                    <div className="flex items-center">
                        {notificationType === 'success' ? <CheckCircle className="w-5 h-5 mr-2" /> :
                         notificationType === 'error' ? <XCircle className="w-5 h-5 mr-2" /> :
                         <AlertTriangle className="w-5 h-5 mr-2" />}
                        <p>{notificationMessage}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScannerModule;
