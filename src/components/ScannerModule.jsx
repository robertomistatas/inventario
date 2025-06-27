import React, { useState, useEffect } from 'react';
import { useScanner } from '../hooks/useScanner';
import { Scan, ScanLine, CheckCircle, XCircle, AlertTriangle, Plus, Minus, Edit2 } from 'lucide-react';
import { serverTimestamp } from 'firebase/firestore';

const ScannerModule = ({ items, onSave, onUpdateStock }) => {
    const [isActive, setIsActive] = useState(false);
    const [scanMode, setScanMode] = useState(null); // 'add', 'update', 'remove'
    const [scannedItem, setScannedItem] = useState(null);
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');
    const [notificationType, setNotificationType] = useState('info'); // 'success', 'error', 'info'

    const handleScan = (barcode) => {
        try {
            // Buscar el item por código
            const item = items.find(i => i.code === barcode);
        
            if (!scanMode) {
                setScannedItem(item);
                setScanMode('select'); // Mostrar opciones de modo
                showNotif(
                    item ? `Producto encontrado: ${item.name}` : 'Producto no encontrado. ¿Desea agregarlo?',
                    item ? 'success' : 'info'
                );
                return;
            }

            // Procesar según el modo seleccionado
            switch(scanMode) {
                case 'add':
                    if (item) {
                        showNotif('Este producto ya existe', 'error');
                        return;
                    }
                    setScannedItem({ code: barcode });
                    break;
                case 'update':
                case 'remove':
                    if (!item) {
                        showNotif('Producto no encontrado', 'error');
                        return;
                    }
                    setScannedItem(item);
                    break;
            }
        } catch (error) {
            console.error('Error al procesar el código:', error);
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
        showNotif(`Modo ${mode} activado. Escanee un producto.`, 'info');
    };

    const handleSaveItem = async (itemData) => {
        try {
            await onSave({
                ...itemData,
                lastScanned: serverTimestamp(),
                scannedBy: 'system'  // Changed to a default value since we don't have user context
            });
            showNotif('Producto guardado exitosamente', 'success');
            resetScanState();
        } catch (error) {
            showNotif('Error al guardar el producto', 'error');
        }
    };

    const handleUpdateStock = async (itemId, newQuantity, type, amount) => {
        try {
            await onUpdateStock(itemId, newQuantity, type, amount);
            showNotif('Stock actualizado exitosamente', 'success');
            resetScanState();
        } catch (error) {
            showNotif('Error al actualizar el stock', 'error');
        }
    };

    const resetScanState = () => {
        setScanMode(null);
        setScannedItem(null);
    };

    useEffect(() => {
        if (isActive) {
            startListening();
        } else {
            stopListening();
        }
    }, [isActive]);

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
                    {!scanMode && (
                        <div className="grid grid-cols-3 gap-4">
                            <button
                                onClick={() => handleModeSelect('add')}
                                className="flex items-center justify-center p-4 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-800/50"
                            >
                                <Plus className="w-6 h-6 mr-2" />
                                Agregar
                            </button>
                            <button
                                onClick={() => handleModeSelect('update')}
                                className="flex items-center justify-center p-4 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/50"
                            >
                                <Edit2 className="w-6 h-6 mr-2" />
                                Actualizar
                            </button>
                            <button
                                onClick={() => handleModeSelect('remove')}
                                className="flex items-center justify-center p-4 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800/50"
                            >
                                <Minus className="w-6 h-6 mr-2" />
                                Retirar
                            </button>
                        </div>
                    )}

                    {scanMode && (
                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                    Modo actual: {scanMode.charAt(0).toUpperCase() + scanMode.slice(1)}
                                </span>
                                <button
                                    onClick={resetScanState}
                                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                >
                                    Cambiar modo
                                </button>
                            </div>
                            {/* Aquí irá el formulario específico según el modo */}
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
