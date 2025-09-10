import React, { useState, useMemo } from 'react';
import { FileText, Printer, Calendar, TrendingUp, TrendingDown, Package, AlertTriangle, BarChart3, Download } from 'lucide-react';

const ReportModule = ({ items, history, categories, branches }) => {
    const [selectedBranch, setSelectedBranch] = useState('all');
    const [dateRange, setDateRange] = useState('30');
    const [includeHistory, setIncludeHistory] = useState(true);
    const [includeStatistics, setIncludeStatistics] = useState(true);

    // Orden de prioridad de categorías (Dispositivos Inteligentes siempre primero)
    const categoryPriority = [
        'DISPOSITIVOS INTELIGENTES',
        'CONSUMIBLES', 
        'MANUALES / RECORDATORIOS',
        'MATERIALES DE INSTALACIÓN'
    ];

    // Organizar items por categorías con el orden de prioridad
    const itemsByCategory = useMemo(() => {
        let filteredItems = items;
        
        if (selectedBranch !== 'all') {
            filteredItems = filteredItems.filter(item => item.branch === selectedBranch);
        }

        const categorized = {};
        
        // Inicializar categorías en el orden correcto
        categoryPriority.forEach(category => {
            categorized[category] = [];
        });

        // Agrupar items por categoría
        filteredItems.forEach(item => {
            const category = item.category || 'SIN CATEGORÍA';
            if (!categorized[category]) {
                categorized[category] = [];
            }
            categorized[category].push(item);
        });

        // Ordenar items dentro de cada categoría por nombre
        Object.keys(categorized).forEach(category => {
            categorized[category].sort((a, b) => a.name.localeCompare(b.name));
        });

        return categorized;
    }, [items, selectedBranch]);

    // Calcular estadísticas del inventario por categoría
    const categoryStats = useMemo(() => {
        const stats = {};
        
        Object.keys(itemsByCategory).forEach(category => {
            const categoryItems = itemsByCategory[category];
            stats[category] = {
                totalItems: categoryItems.length,
                totalQuantity: categoryItems.reduce((sum, item) => sum + item.quantity, 0),
                criticalItems: categoryItems.filter(item => item.quantity <= item.criticalThreshold).length,
                lowStockItems: categoryItems.filter(item => 
                    item.quantity > item.criticalThreshold && 
                    item.quantity <= item.criticalThreshold * 1.5
                ).length,
                sufficientItems: categoryItems.filter(item => item.quantity > item.criticalThreshold * 1.5).length
            };
        });

        return stats;
    }, [itemsByCategory]);

    // Estadísticas generales del inventario
    const generalStats = useMemo(() => {
        let filteredItems = items;
        
        if (selectedBranch !== 'all') {
            filteredItems = filteredItems.filter(item => item.branch === selectedBranch);
        }

        const stats = {
            totalItems: filteredItems.length,
            totalQuantity: filteredItems.reduce((sum, item) => sum + item.quantity, 0),
            criticalItems: filteredItems.filter(item => item.quantity <= item.criticalThreshold).length,
            lowStockItems: filteredItems.filter(item => 
                item.quantity > item.criticalThreshold && 
                item.quantity <= item.criticalThreshold * 1.5
            ).length,
            sufficientItems: filteredItems.filter(item => item.quantity > item.criticalThreshold * 1.5).length,
            categoriesCount: Object.keys(itemsByCategory).filter(cat => itemsByCategory[cat].length > 0).length,
            lastUpdated: new Date()
        };

        return stats;
    }, [items, selectedBranch, itemsByCategory]);

    // Obtener historial filtrado
    const filteredHistory = useMemo(() => {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));
        
        return history
            .filter(entry => {
                const entryDate = entry.timestamp?.toDate ? entry.timestamp.toDate() : new Date(entry.timestamp);
                const isInDateRange = entryDate >= daysAgo;
                const isInBranch = selectedBranch === 'all' || entry.branch === selectedBranch;
                return isInDateRange && isInBranch;
            })
            .sort((a, b) => {
                const dateA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
                const dateB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
                return dateB - dateA;
            })
            .slice(0, 20);
    }, [history, dateRange, selectedBranch]);

    const getStockStatusColor = (item) => {
        if (item.quantity <= item.criticalThreshold) return 'text-red-600 bg-red-50';
        if (item.quantity <= item.criticalThreshold * 1.5) return 'text-yellow-600 bg-yellow-50';
        return 'text-green-600 bg-green-50';
    };

    const getStockStatusText = (item) => {
        if (item.quantity <= item.criticalThreshold) return 'CRÍTICO';
        if (item.quantity <= item.criticalThreshold * 1.5) return 'BAJO';
        return 'SUFICIENTE';
    };

    const generateReport = () => {
        const printContent = document.querySelector('.report-print-area');
        const printWindow = window.open('', '_blank');
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Informe Profesional de Inventario - Mistatas</title>
                <style>
                    @page {
                        margin: 2cm;
                        size: A4;
                    }
                    
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.6;
                        color: #2d3748;
                        background: white;
                        padding: 20px;
                    }
                    
                    .header {
                        text-align: center;
                        border-bottom: 3px solid #4299e1;
                        padding-bottom: 20px;
                        margin-bottom: 30px;
                    }
                    
                    .header h1 {
                        font-size: 28px;
                        color: #2b6cb0;
                        margin-bottom: 5px;
                    }
                    
                    .header h2 {
                        font-size: 18px;
                        color: #4a5568;
                        font-weight: normal;
                    }
                    
                    .category-section {
                        margin-bottom: 40px;
                        page-break-inside: avoid;
                    }
                    
                    .category-header {
                        background: #4299e1;
                        color: white;
                        padding: 12px 20px;
                        font-size: 16px;
                        font-weight: bold;
                        margin-bottom: 15px;
                        border-radius: 6px;
                    }
                    
                    .stats-summary {
                        background: #f7fafc;
                        border: 1px solid #e2e8f0;
                        border-radius: 6px;
                        padding: 15px;
                        margin-bottom: 20px;
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 15px;
                    }
                    
                    .stat-item {
                        text-align: center;
                    }
                    
                    .stat-number {
                        font-size: 20px;
                        font-weight: bold;
                        color: #2b6cb0;
                    }
                    
                    .stat-label {
                        font-size: 12px;
                        color: #718096;
                        margin-top: 4px;
                    }
                    
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 25px;
                        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                    }
                    
                    th {
                        background: #edf2f7;
                        padding: 12px 8px;
                        text-align: left;
                        font-weight: 600;
                        font-size: 12px;
                        color: #4a5568;
                        border-bottom: 2px solid #cbd5e0;
                    }
                    
                    td {
                        padding: 10px 8px;
                        border-bottom: 1px solid #e2e8f0;
                        font-size: 11px;
                    }
                    
                    tr:nth-child(even) {
                        background: #f8f9fa;
                    }
                    
                    .status-badge {
                        display: inline-block;
                        padding: 4px 8px;
                        border-radius: 12px;
                        font-size: 10px;
                        font-weight: 600;
                        text-align: center;
                    }
                    
                    .status-critical {
                        background: #fed7d7;
                        color: #c53030;
                    }
                    
                    .status-low {
                        background: #fefcbf;
                        color: #d69e2e;
                    }
                    
                    .status-sufficient {
                        background: #c6f6d5;
                        color: #38a169;
                    }
                    
                    .footer {
                        margin-top: 40px;
                        padding-top: 20px;
                        border-top: 2px solid #e2e8f0;
                        font-size: 11px;
                        color: #718096;
                    }
                    
                    .no-print {
                        display: none;
                    }
                </style>
            </head>
            <body>
        `);
        printWindow.document.write(printContent.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
    };

    const currentDate = new Date().toLocaleDateString('es-CL');
    const currentTime = new Date().toLocaleTimeString('es-CL');
    const branchName = selectedBranch === 'all' ? 'Todas las Sucursales' : 
                      branches.find(b => b.id === selectedBranch)?.name || selectedBranch;

    return (
        <div className="p-6 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            {/* Controles del Reporte */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    <FileText className="inline w-6 h-6 mr-2" />
                    Informes Profesionales
                </h2>
                <button
                    onClick={generateReport}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Printer className="w-4 h-4 mr-2" />
                    Generar Informe
                </button>
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Sucursal
                    </label>
                    <select
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                    >
                        <option value="all">Todas las Sucursales</option>
                        {branches.map(branch => (
                            <option key={branch.id} value={branch.id}>{branch.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Período Historial
                    </label>
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                    >
                        <option value="7">Últimos 7 días</option>
                        <option value="30">Últimos 30 días</option>
                        <option value="90">Últimos 90 días</option>
                    </select>
                </div>

                <div className="flex items-end">
                    <div className="space-y-2">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={includeStatistics}
                                onChange={(e) => setIncludeStatistics(e.target.checked)}
                                className="mr-2"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Incluir estadísticas</span>
                        </label>
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={includeHistory}
                                onChange={(e) => setIncludeHistory(e.target.checked)}
                                className="mr-2"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Incluir historial</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Área de Impresión del Reporte */}
            <div className="report-print-area">
                {/* Encabezado del Reporte */}
                <div className="header text-center border-b-4 border-blue-500 pb-6 mb-8">
                    <h1 className="text-3xl font-bold text-blue-700 mb-2">
                        INFORME DE INVENTARIO
                    </h1>
                    <h2 className="text-xl text-gray-600">
                        Sistema de Gestión Mistatas
                    </h2>
                    <div className="mt-4 text-sm text-gray-600">
                        <p><strong>Sucursal:</strong> {branchName}</p>
                        <p><strong>Fecha:</strong> {currentDate} - {currentTime}</p>
                    </div>
                </div>

                {/* Estadísticas Generales */}
                {includeStatistics && (
                    <div className="mb-8">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                            <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                            Resumen Ejecutivo
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-blue-600">{generalStats.totalItems}</div>
                                <div className="text-sm text-gray-600">Total Items</div>
                            </div>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-green-600">{generalStats.sufficientItems}</div>
                                <div className="text-sm text-gray-600">Stock Suficiente</div>
                            </div>
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-yellow-600">{generalStats.lowStockItems}</div>
                                <div className="text-sm text-gray-600">Stock Bajo</div>
                            </div>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-red-600">{generalStats.criticalItems}</div>
                                <div className="text-sm text-gray-600">Stock Crítico</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Inventario por Categorías */}
                <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                        <Package className="w-5 h-5 mr-2 text-blue-600" />
                        Inventario Detallado por Categorías
                    </h3>

                    {categoryPriority.map(category => {
                        const categoryItems = itemsByCategory[category] || [];
                        const stats = categoryStats[category];
                        
                        if (categoryItems.length === 0) return null;

                        return (
                            <div key={category} className="mb-8 category-section">
                                <div className="category-header bg-blue-600 text-white p-3 rounded-t-lg">
                                    <h4 className="text-lg font-semibold">{category}</h4>
                                </div>

                                {/* Estadísticas de la categoría */}
                                {includeStatistics && stats && (
                                    <div className="bg-gray-50 border-x border-gray-200 p-4">
                                        <div className="grid grid-cols-4 gap-4 text-center">
                                            <div>
                                                <div className="text-lg font-bold text-blue-600">{stats.totalItems}</div>
                                                <div className="text-xs text-gray-600">Items</div>
                                            </div>
                                            <div>
                                                <div className="text-lg font-bold text-green-600">{stats.sufficientItems}</div>
                                                <div className="text-xs text-gray-600">Suficiente</div>
                                            </div>
                                            <div>
                                                <div className="text-lg font-bold text-yellow-600">{stats.lowStockItems}</div>
                                                <div className="text-xs text-gray-600">Bajo</div>
                                            </div>
                                            <div>
                                                <div className="text-lg font-bold text-red-600">{stats.criticalItems}</div>
                                                <div className="text-xs text-gray-600">Crítico</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Tabla de items de la categoría */}
                                <div className="overflow-x-auto">
                                    <table className="w-full border border-gray-200 rounded-b-lg">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Código</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Nombre</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Cantidad</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Mín. Crítico</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {categoryItems.map((item, index) => (
                                                <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                    <td className="px-4 py-3 text-sm font-mono text-gray-900">{item.code}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-900">{item.name}</td>
                                                    <td className="px-4 py-3 text-sm text-center font-semibold">
                                                        <span className={item.quantity <= item.criticalThreshold ? 'text-red-600' : 
                                                                       item.quantity <= item.criticalThreshold * 1.5 ? 'text-yellow-600' : 'text-green-600'}>
                                                            {item.quantity}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-center text-gray-600">{item.criticalThreshold}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStockStatusColor(item)}`}>
                                                            {getStockStatusText(item)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Historial de Movimientos */}
                {includeHistory && filteredHistory.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                            <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                            Movimientos Recientes ({dateRange} días)
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full border border-gray-200 rounded-lg">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Fecha</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Item</th>
                                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase">Tipo</th>
                                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase">Cantidad</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Motivo</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredHistory.map((entry, index) => {
                                        const entryDate = entry.timestamp?.toDate ? entry.timestamp.toDate() : new Date(entry.timestamp);
                                        return (
                                            <tr key={entry.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                <td className="px-3 py-2 text-xs text-gray-600">
                                                    {entryDate.toLocaleDateString('es-CL')}
                                                </td>
                                                <td className="px-3 py-2 text-xs text-gray-900 font-medium">{entry.itemName}</td>
                                                <td className="px-3 py-2 text-center">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        entry.type === 'entrada' ? 'bg-green-100 text-green-800' :
                                                        entry.type === 'salida' ? 'bg-red-100 text-red-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {entry.type?.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-xs text-center">
                                                    <span className={entry.type === 'entrada' ? 'text-green-600' : entry.type === 'salida' ? 'text-red-600' : 'text-gray-600'}>
                                                        {entry.type === 'entrada' ? '+' : entry.type === 'salida' ? '-' : ''}{entry.quantityChanged || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-xs text-gray-600">{entry.motivo || '-'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Pie del reporte */}
                <div className="footer mt-8 pt-6 border-t-2 border-gray-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                            <p><strong>Reporte generado por:</strong> Sistema de Inventario Mistatas</p>
                            <p><strong>Fecha de generación:</strong> {currentDate} a las {currentTime}</p>
                        </div>
                        <div className="text-right">
                            <p><strong>Items que requieren atención:</strong> {generalStats.criticalItems + generalStats.lowStockItems}</p>
                            <p><strong>Cobertura del reporte:</strong> {branchName}</p>
                        </div>
                    </div>
                    
                    <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded">
                        <h4 className="font-semibold text-gray-900 mb-2">Notas Importantes:</h4>
                        <ul className="text-xs text-gray-600 space-y-1">
                            <li>• Los ítems marcados como "CRÍTICO" requieren reposición inmediata.</li>
                            <li>• Los ítems con "STOCK BAJO" deben ser monitoreados para próxima reposición.</li>
                            <li>• Este reporte refleja el estado del inventario al momento de su generación.</li>
                            <li>• Los DISPOSITIVOS INTELIGENTES tienen prioridad máxima en gestión de stock.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportModule;
