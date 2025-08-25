import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, CheckCircle, ArrowRight, ArrowLeft, Package, MapPin, Save, Download } from 'lucide-react';
import { collection, getDocs, writeBatch, doc, addDoc, serverTimestamp } from 'firebase/firestore';

const InteractiveMigration = ({ items, user, onClose, db }) => {
    const [currentItemIndex, setCurrentItemIndex] = useState(0);
    const [migrationData, setMigrationData] = useState({});
    const [isCompleted, setIsCompleted] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [migrationSummary, setMigrationSummary] = useState(null);
    const [showPreview, setShowPreview] = useState(false);

    // Filtrar items que necesitan migración: simplemente no migrados
    const itemsToMigrate = useMemo(() => {
        return items.filter(item => !item.migrated);
    }, [items]);
    
    const currentItem = itemsToMigrate[currentItemIndex];

    useEffect(() => {
        // Inicializar datos de migración
        const initialData = {};
        itemsToMigrate.forEach(item => {
            initialData[item.id] = {
                santiago: item.quantity, // Por defecto todo en Santiago
                valparaiso: 0,
                original: item.quantity
            };
        });
        setMigrationData(initialData);
    }, [itemsToMigrate]);

    const updateItemDistribution = (itemId, santiago, valparaiso) => {
        setMigrationData(prev => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                santiago: parseInt(santiago) || 0,
                valparaiso: parseInt(valparaiso) || 0
            }
        }));
    };

    const handleNext = () => {
        if (currentItemIndex < itemsToMigrate.length - 1) {
            setCurrentItemIndex(prev => prev + 1);
        } else {
            setIsCompleted(true);
            generateSummary();
        }
    };

    const handlePrevious = () => {
        if (currentItemIndex > 0) {
            setCurrentItemIndex(prev => prev - 1);
        }
    };

    const handleAutoDistribute = (distribution) => {
        const item = currentItem;
        const total = item.quantity;
        
        let santiago, valparaiso;
        
        switch (distribution) {
            case 'equal':
                santiago = Math.floor(total / 2);
                valparaiso = total - santiago;
                break;
            case 'santiago-major':
                santiago = Math.floor(total * 0.7);
                valparaiso = total - santiago;
                break;
            case 'valparaiso-major':
                valparaiso = Math.floor(total * 0.7);
                santiago = total - valparaiso;
                break;
            case 'santiago-only':
                santiago = total;
                valparaiso = 0;
                break;
            case 'valparaiso-only':
                santiago = 0;
                valparaiso = total;
                break;
            default:
                santiago = total;
                valparaiso = 0;
        }
        
        updateItemDistribution(item.id, santiago, valparaiso);
    };

    const validateDistribution = (itemId) => {
        const data = migrationData[itemId];
        if (!data) return false;
        
        const total = data.santiago + data.valparaiso;
        return total === data.original && data.santiago >= 0 && data.valparaiso >= 0;
    };

    const generateSummary = () => {
        const summary = {
            totalItems: itemsToMigrate.length,
            santiagoTotal: 0,
            valparaisoTotal: 0,
            itemsBySucursal: {
                santiago: [],
                valparaiso: [],
                both: []
            }
        };

        itemsToMigrate.forEach(item => {
            const data = migrationData[item.id];
            if (data.santiago > 0) {
                summary.santiagoTotal += data.santiago;
                summary.itemsBySucursal.santiago.push({...item, newQuantity: data.santiago});
            }
            if (data.valparaiso > 0) {
                summary.valparaisoTotal += data.valparaiso;
                summary.itemsBySucursal.valparaiso.push({...item, newQuantity: data.valparaiso});
            }
            if (data.santiago > 0 && data.valparaiso > 0) {
                summary.itemsBySucursal.both.push(item);
            }
        });

        setMigrationSummary(summary);
    };

    const executeMigration = async () => {
        setIsProcessing(true);
        
        try {
            const batch = writeBatch(db);
            let operationCount = 0;

            for (const item of itemsToMigrate) {
                const distribution = migrationData[item.id];
                
                // Crear item para Santiago si tiene cantidad > 0
                if (distribution.santiago > 0) {
                    const santiagoRef = doc(collection(db, 'items'));
                    batch.set(santiagoRef, {
                        ...item,
                        quantity: distribution.santiago,
                        branch: 'santiago',
                        migratedFrom: item.id,
                        migrationDate: serverTimestamp(),
                        migrationUser: user.email
                    });
                    operationCount++;
                }
                
                // Crear item para Valparaíso si tiene cantidad > 0
                if (distribution.valparaiso > 0) {
                    const valparaisoRef = doc(collection(db, 'items'));
                    batch.set(valparaisoRef, {
                        ...item,
                        quantity: distribution.valparaiso,
                        branch: 'valparaiso',
                        migratedFrom: item.id,
                        migrationDate: serverTimestamp(),
                        migrationUser: user.email
                    });
                    operationCount++;
                }
                
                // Marcar item original como migrado
                const originalRef = doc(db, 'items', item.id);
                batch.update(originalRef, {
                    migrated: true,
                    migrationDate: serverTimestamp(),
                    originalQuantity: item.quantity,
                    migrationUser: user.email
                });
                operationCount++;

                // Ejecutar batch cada 400 operaciones para no exceder el límite
                if (operationCount >= 400) {
                    await batch.commit();
                    operationCount = 0;
                }
            }

            // Ejecutar operaciones restantes
            if (operationCount > 0) {
                await batch.commit();
            }

            // Registrar en historial
            await addDoc(collection(db, 'history'), {
                type: 'migración_sucursales',
                itemsCount: itemsToMigrate.length,
                santiagoTotal: migrationSummary.santiagoTotal,
                valparaisoTotal: migrationSummary.valparaisoTotal,
                userEmail: user.email,
                timestamp: serverTimestamp(),
                details: 'Migración interactiva completada'
            });

            alert('¡Migración completada exitosamente!');
            onClose();
            
        } catch (error) {
            console.log('Error en migración:', error);
            alert('Error durante la migración: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const exportMigrationPlan = () => {
        const plan = {
            timestamp: new Date().toISOString(),
            user: user.email,
            items: itemsToMigrate.map(item => ({
                name: item.name,
                code: item.code,
                category: item.category,
                originalQuantity: item.quantity,
                distribution: migrationData[item.id]
            })),
            summary: migrationSummary
        };

        const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `plan-migracion-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    };

    if (itemsToMigrate.length === 0) {
        return (
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                <div className="text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        No hay items para migrar
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        {items.length === 0 
                            ? 'No hay items en el inventario.'
                            : items.filter(item => item.migrated).length > 0
                                ? 'Todos los items ya están migrados.'
                                : 'Todos los items ya están asignados a sucursales específicas.'
                        }
                    </p>
                    <div className="mt-4 text-sm text-gray-500">
                        <p>Items totales: {items.length}</p>
                        <p>Items migrados: {items.filter(item => item.migrated).length}</p>
                        <p>Items con sucursal: {items.filter(item => item.branch && item.branch !== 'santiago').length}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        );
    }

    if (isCompleted && !showPreview) {
        return (
            <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                <div className="text-center mb-6">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                        ¡Migración Planificada!
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Has configurado la distribución de {itemsToMigrate.length} items.
                    </p>
                </div>

                {migrationSummary && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Resumen Santiago */}
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="flex items-center mb-3">
                                <MapPin className="w-5 h-5 text-blue-600 mr-2" />
                                <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-300">
                                    Santiago
                                </h4>
                            </div>
                            <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                                {migrationSummary.santiagoTotal} unidades
                            </p>
                            <p className="text-sm text-blue-700 dark:text-blue-400">
                                {migrationSummary.itemsBySucursal.santiago.length} tipos de items
                            </p>
                        </div>

                        {/* Resumen Valparaíso */}
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div className="flex items-center mb-3">
                                <Package className="w-5 h-5 text-green-600 mr-2" />
                                <h4 className="text-lg font-semibold text-green-800 dark:text-green-300">
                                    Valparaíso
                                </h4>
                            </div>
                            <p className="text-2xl font-bold text-green-900 dark:text-green-200">
                                {migrationSummary.valparaisoTotal} unidades
                            </p>
                            <p className="text-sm text-green-700 dark:text-green-400">
                                {migrationSummary.itemsBySucursal.valparaiso.length} tipos de items
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => setShowPreview(true)}
                        className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center justify-center"
                    >
                        <Package className="w-5 h-5 mr-2" />
                        Ver Detalle
                    </button>
                    <button
                        onClick={exportMigrationPlan}
                        className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center justify-center"
                    >
                        <Download className="w-5 h-5 mr-2" />
                        Exportar Plan
                    </button>
                    <button
                        onClick={executeMigration}
                        disabled={isProcessing}
                        className="px-8 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
                    >
                        <Save className="w-5 h-5 mr-2" />
                        {isProcessing ? 'Ejecutando...' : 'Ejecutar Migración'}
                    </button>
                </div>

                <div className="mt-4 text-center">
                    <button
                        onClick={() => setIsCompleted(false)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                        ← Volver a revisar distribución
                    </button>
                </div>
            </div>
        );
    }

    if (showPreview) {
        return (
            <div className="max-w-6xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                        Vista Previa de Migración
                    </h3>
                    <button
                        onClick={() => setShowPreview(false)}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                        Volver
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Item
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Original
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Santiago
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Valparaíso
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estado
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {itemsToMigrate.map(item => {
                                const distribution = migrationData[item.id];
                                const isValid = validateDistribution(item.id);
                                
                                return (
                                    <tr key={item.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {item.name}
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    {item.code}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                            {item.quantity}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400">
                                            {distribution?.santiago || 0}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">
                                            {distribution?.valparaiso || 0}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {isValid ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    ✓ Válido
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    ✗ Error
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            {/* Header con progreso */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                        Migración de Inventario
                    </h3>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        {currentItemIndex + 1} de {itemsToMigrate.length}
                    </div>
                </div>
                
                {/* Barra de progreso */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((currentItemIndex + 1) / itemsToMigrate.length) * 100}%` }}
                    ></div>
                </div>
            </div>

            {/* Item actual */}
            <div className="mb-8">
                <div className="text-center mb-6">
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {currentItem.name}
                    </h4>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full mr-2">
                            {currentItem.code}
                        </span>
                        <span className="bg-blue-100 dark:bg-blue-900/50 px-3 py-1 rounded-full">
                            {currentItem.category}
                        </span>
                    </div>
                    <div className="mt-4">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                            {currentItem.quantity} unidades disponibles
                        </span>
                    </div>
                </div>

                {/* Botones de distribución automática */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6">
                    <button
                        onClick={() => handleAutoDistribute('equal')}
                        className="px-3 py-2 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                        50/50
                    </button>
                    <button
                        onClick={() => handleAutoDistribute('santiago-major')}
                        className="px-3 py-2 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/70"
                    >
                        70% Santiago
                    </button>
                    <button
                        onClick={() => handleAutoDistribute('valparaiso-major')}
                        className="px-3 py-2 text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-md hover:bg-green-200 dark:hover:bg-green-900/70"
                    >
                        70% Valparaíso
                    </button>
                    <button
                        onClick={() => handleAutoDistribute('santiago-only')}
                        className="px-3 py-2 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/70"
                    >
                        Todo Santiago
                    </button>
                    <button
                        onClick={() => handleAutoDistribute('valparaiso-only')}
                        className="px-3 py-2 text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-md hover:bg-green-200 dark:hover:bg-green-900/70"
                    >
                        Todo Valparaíso
                    </button>
                </div>

                {/* Distribución manual */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Santiago */}
                    <div className="p-4 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                        <div className="flex items-center mb-3">
                            <MapPin className="w-5 h-5 text-blue-600 mr-2" />
                            <h5 className="text-lg font-semibold text-blue-800 dark:text-blue-300">
                                Santiago
                            </h5>
                        </div>
                        <input
                            type="number"
                            min="0"
                            max={currentItem.quantity}
                            value={migrationData[currentItem.id]?.santiago || 0}
                            onChange={(e) => {
                                const santiago = parseInt(e.target.value) || 0;
                                const currentValparaiso = migrationData[currentItem.id]?.valparaiso || 0;
                                updateItemDistribution(currentItem.id, santiago, currentValparaiso);
                            }}
                            className="w-full px-4 py-3 text-xl font-bold text-center border border-blue-300 dark:border-blue-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="0"
                        />
                        <p className="text-sm text-blue-700 dark:text-blue-400 mt-2 text-center">
                            unidades en Santiago
                        </p>
                        <button
                            onClick={() => {
                                const currentValparaiso = migrationData[currentItem.id]?.valparaiso || 0;
                                const newSantiago = currentItem.quantity - currentValparaiso;
                                updateItemDistribution(currentItem.id, newSantiago, currentValparaiso);
                            }}
                            className="w-full mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                            Completar resto aquí
                        </button>
                    </div>

                    {/* Valparaíso */}
                    <div className="p-4 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/20">
                        <div className="flex items-center mb-3">
                            <Package className="w-5 h-5 text-green-600 mr-2" />
                            <h5 className="text-lg font-semibold text-green-800 dark:text-green-300">
                                Valparaíso
                            </h5>
                        </div>
                        <input
                            type="number"
                            min="0"
                            max={currentItem.quantity}
                            value={migrationData[currentItem.id]?.valparaiso || 0}
                            onChange={(e) => {
                                const valparaiso = parseInt(e.target.value) || 0;
                                const currentSantiago = migrationData[currentItem.id]?.santiago || 0;
                                updateItemDistribution(currentItem.id, currentSantiago, valparaiso);
                            }}
                            className="w-full px-4 py-3 text-xl font-bold text-center border border-green-300 dark:border-green-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="0"
                        />
                        <p className="text-sm text-green-700 dark:text-green-400 mt-2 text-center">
                            unidades en Valparaíso
                        </p>
                        <button
                            onClick={() => {
                                const currentSantiago = migrationData[currentItem.id]?.santiago || 0;
                                const newValparaiso = currentItem.quantity - currentSantiago;
                                updateItemDistribution(currentItem.id, currentSantiago, newValparaiso);
                            }}
                            className="w-full mt-2 text-xs text-green-600 hover:text-green-800 underline"
                        >
                            Completar resto aquí
                        </button>
                    </div>
                </div>

                {/* Validación */}
                <div className="mt-4 text-center">
                    {migrationData[currentItem.id] && (
                        <div className={`inline-flex items-center px-4 py-2 rounded-lg ${
                            validateDistribution(currentItem.id) 
                                ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
                                : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300'
                        }`}>
                            {validateDistribution(currentItem.id) ? (
                                <>
                                    <CheckCircle className="w-5 h-5 mr-2" />
                                    Distribución válida ({(migrationData[currentItem.id]?.santiago || 0) + (migrationData[currentItem.id]?.valparaiso || 0)} de {currentItem.quantity})
                                </>
                            ) : (
                                <>
                                    <AlertTriangle className="w-5 h-5 mr-2" />
                                    Total actual: {(migrationData[currentItem.id]?.santiago || 0) + (migrationData[currentItem.id]?.valparaiso || 0)} / {currentItem.quantity} unidades
                                    {(migrationData[currentItem.id]?.santiago || 0) + (migrationData[currentItem.id]?.valparaiso || 0) > currentItem.quantity 
                                        ? ' (excede el total)' 
                                        : ' (faltan unidades)'}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Botones de navegación */}
            <div className="flex justify-between">
                <button
                    onClick={handlePrevious}
                    disabled={currentItemIndex === 0}
                    className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Anterior
                </button>

                <button
                    onClick={handleNext}
                    disabled={!validateDistribution(currentItem.id)}
                    className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {currentItemIndex === itemsToMigrate.length - 1 ? 'Finalizar' : 'Siguiente'}
                    <ArrowRight className="w-5 h-5 ml-2" />
                </button>
            </div>
        </div>
    );
};

export default InteractiveMigration;
