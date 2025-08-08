import React, { useState, useMemo } from 'react';
import { FileText, Printer, Calendar, TrendingUp, TrendingDown, Package, AlertTriangle, BarChart3, Download } from 'lucide-react';

const ReportModule = ({ items, history, categories }) => {
    const [reportType, setReportType] = useState('complete');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [dateRange, setDateRange] = useState('30'); // días
    const [includeHistory, setIncludeHistory] = useState(true);
    const [includeStatistics, setIncludeStatistics] = useState(true);

    // Calcular estadísticas del inventario
    const inventoryStats = useMemo(() => {
        const stats = {
            totalItems: items.length,
            totalValue: 0,
            criticalItems: 0,
            lowStockItems: 0,
            sufficientStockItems: 0,
            categoriesCount: categories.length,
            byCategory: {},
            recentMovements: 0,
            lastUpdated: new Date()
        };

        // Filtrar por categoría si es necesario
        const filteredItems = selectedCategory === 'all' 
            ? items 
            : items.filter(item => item.category === selectedCategory);

        filteredItems.forEach(item => {
            // Conteo por estado de stock
            if (item.quantity <= item.criticalThreshold) {
                stats.criticalItems++;
            } else if (item.quantity <= item.criticalThreshold * 1.5) {
                stats.lowStockItems++;
            } else {
                stats.sufficientStockItems++;
            }

            // Estadísticas por categoría
            if (!stats.byCategory[item.category]) {
                stats.byCategory[item.category] = {
                    count: 0,
                    totalQuantity: 0,
                    criticalCount: 0,
                    lowStockCount: 0
                };
            }
            stats.byCategory[item.category].count++;
            stats.byCategory[item.category].totalQuantity += item.quantity;
            
            if (item.quantity <= item.criticalThreshold) {
                stats.byCategory[item.category].criticalCount++;
            } else if (item.quantity <= item.criticalThreshold * 1.5) {
                stats.byCategory[item.category].lowStockCount++;
            }
        });

        // Movimientos recientes (últimos X días)
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));
        
        stats.recentMovements = history.filter(entry => {
            const entryDate = entry.timestamp?.toDate ? entry.timestamp.toDate() : new Date(entry.timestamp);
            return entryDate >= daysAgo;
        }).length;

        return stats;
    }, [items, history, selectedCategory, dateRange, categories]);

    // Obtener historial filtrado
    const filteredHistory = useMemo(() => {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));
        
        return history
            .filter(entry => {
                const entryDate = entry.timestamp?.toDate ? entry.timestamp.toDate() : new Date(entry.timestamp);
                const isInDateRange = entryDate >= daysAgo;
                const isInCategory = selectedCategory === 'all' || entry.category === selectedCategory;
                return isInDateRange && isInCategory;
            })
            .sort((a, b) => {
                const dateA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
                const dateB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
                return dateB - dateA;
            })
            .slice(0, 50); // Limitar a últimos 50 movimientos para el reporte
    }, [history, dateRange, selectedCategory]);

    // Filtrar items según la categoría seleccionada
    const filteredItems = useMemo(() => {
        return selectedCategory === 'all' 
            ? items.sort((a, b) => a.name.localeCompare(b.name))
            : items.filter(item => item.category === selectedCategory).sort((a, b) => a.name.localeCompare(b.name));
    }, [items, selectedCategory]);

    const generateReport = () => {
        // Crear una nueva ventana con solo el contenido del reporte
        const printContent = document.querySelector('.report-print-area');
        const printWindow = window.open('', '_blank');
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Informe de Inventario</title>
                <style>
                    @page {
                        margin: 1.5cm;
                        size: A4;
                    }
                    
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        line-height: 1.6;
                        color: #000;
                        background: white;
                        padding: 20px;
                    }
                    
                    h1 {
                        font-size: 24px;
                        font-weight: bold;
                        margin-bottom: 8px;
                        color: #111;
                    }
                    
                    h2 {
                        font-size: 18px;
                        font-weight: bold;
                        margin: 20px 0 12px 0;
                        color: #111;
                    }
                    
                    h3 {
                        font-size: 16px;
                        font-weight: 600;
                        margin: 16px 0 8px 0;
                        color: #111;
                    }
                    
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 12px 0;
                        page-break-inside: auto;
                    }
                    
                    th, td {
                        border: 1px solid #333;
                        padding: 8px;
                        text-align: left;
                        font-size: 12px;
                    }
                    
                    th {
                        background-color: #f5f5f5;
                        font-weight: 600;
                        color: #111;
                    }
                    
                    tr:nth-child(even) {
                        background-color: #f9f9f9;
                    }
                    
                    .border-b-2 {
                        border-bottom: 2px solid #333;
                        padding-bottom: 16px;
                        margin-bottom: 16px;
                    }
                    
                    .grid {
                        display: grid;
                        gap: 16px;
                    }
                    
                    .grid-cols-2 {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    
                    .grid-cols-4 {
                        grid-template-columns: repeat(4, 1fr);
                    }
                    
                    .text-center {
                        text-align: center;
                    }
                    
                    .text-right {
                        text-align: right;
                    }
                    
                    .font-bold {
                        font-weight: bold;
                    }
                    
                    .font-semibold {
                        font-weight: 600;
                    }
                    
                    .text-sm {
                        font-size: 12px;
                    }
                    
                    .text-xs {
                        font-size: 10px;
                    }
                    
                    .text-red-600 {
                        color: #dc2626;
                        font-weight: bold;
                    }
                    
                    .text-yellow-600 {
                        color: #d97706;
                        font-weight: 600;
                    }
                    
                    .text-green-600 {
                        color: #16a34a;
                    }
                    
                    .text-blue-600 {
                        color: #2563eb;
                    }
                    
                    .text-gray-600 {
                        color: #4b5563;
                    }
                    
                    .text-gray-700 {
                        color: #374151;
                    }
                    
                    .text-gray-900 {
                        color: #111827;
                    }
                    
                    .bg-blue-50 {
                        background-color: #eff6ff;
                        border: 1px solid #dbeafe;
                        border-radius: 8px;
                        padding: 16px;
                    }
                    
                    .bg-red-50 {
                        background-color: #fef2f2;
                        border: 1px solid #fecaca;
                        border-radius: 8px;
                        padding: 16px;
                    }
                    
                    .bg-yellow-50 {
                        background-color: #fffbeb;
                        border: 1px solid #fed7aa;
                        border-radius: 8px;
                        padding: 16px;
                    }
                    
                    .bg-green-50 {
                        background-color: #f0fdf4;
                        border: 1px solid #bbf7d0;
                        border-radius: 8px;
                        padding: 16px;
                    }
                    
                    .bg-gray-50 {
                        background-color: #f9fafb;
                    }
                    
                    .border {
                        border: 1px solid #d1d5db;
                    }
                    
                    .border-gray-300 {
                        border-color: #d1d5db;
                    }
                    
                    .rounded-lg {
                        border-radius: 8px;
                    }
                    
                    .p-4 {
                        padding: 16px;
                    }
                    
                    .mb-4 {
                        margin-bottom: 16px;
                    }
                    
                    .mt-4 {
                        margin-top: 16px;
                    }
                    
                    .flex {
                        display: flex;
                    }
                    
                    .justify-between {
                        justify-content: space-between;
                    }
                    
                    .items-center {
                        align-items: center;
                    }
                    
                    .space-y-4 > * + * {
                        margin-top: 16px;
                    }
                    
                    .overflow-x-auto {
                        overflow-x: auto;
                    }
                    
                    @media print {
                        body { margin: 0; }
                        .page-break { page-break-before: always; }
                        table { page-break-inside: auto; }
                        tr { page-break-inside: avoid; page-break-after: auto; }
                        td { page-break-inside: avoid; page-break-after: auto; }
                        thead { display: table-header-group; }
                    }
                </style>
            </head>
            <body>
                ${printContent.innerHTML}
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    const getStockStatusText = (item) => {
        if (item.quantity <= item.criticalThreshold) {
            return 'CRÍTICO';
        }
        if (item.quantity <= item.criticalThreshold * 1.5) {
            return 'BAJO';
        }
        return 'SUFICIENTE';
    };

    const getStockStatusColor = (item) => {
        if (item.quantity <= item.criticalThreshold) {
            return 'text-red-600 font-bold';
        }
        if (item.quantity <= item.criticalThreshold * 1.5) {
            return 'text-yellow-600 font-semibold';
        }
        return 'text-green-600';
    };

    const currentDate = new Date().toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const currentTime = new Date().toLocaleTimeString('es-CL', {
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <div className="space-y-6">
            {/* Controles del reporte - Solo visible en pantalla */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 print:hidden">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
                    <FileText className="w-6 h-6 mr-2" />
                    Generador de Informes de Inventario
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Tipo de Reporte
                        </label>
                        <select
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="complete">Reporte Completo</option>
                            <option value="summary">Resumen Ejecutivo</option>
                            <option value="critical">Solo Ítems Críticos</option>
                            <option value="category">Por Categoría</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Categoría
                        </label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="all">Todas las Categorías</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Historial (días)
                        </label>
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="7">Últimos 7 días</option>
                            <option value="30">Últimos 30 días</option>
                            <option value="90">Últimos 90 días</option>
                            <option value="180">Últimos 6 meses</option>
                            <option value="365">Último año</option>
                        </select>
                    </div>

                    <div className="flex flex-col justify-end">
                        <button
                            onClick={generateReport}
                            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <Printer className="w-5 h-5 mr-2" />
                            Imprimir Reporte
                        </button>
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={includeHistory}
                            onChange={(e) => setIncludeHistory(e.target.checked)}
                            className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Incluir historial de movimientos</span>
                    </label>
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={includeStatistics}
                            onChange={(e) => setIncludeStatistics(e.target.checked)}
                            className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Incluir estadísticas detalladas</span>
                    </label>
                </div>
            </div>

            {/* Área de reporte imprimible */}
            <div className="bg-white print:bg-white print:shadow-none shadow-lg print:m-0 print:p-0">
                {/* Estilos específicos para impresión */}
                <style jsx global>{`
                    @media print {
                        * {
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                        }
                        
                        @page {
                            margin: 1.5cm;
                            size: A4;
                        }
                        
                        /* Ocultar todo excepto el reporte */
                        body * {
                            visibility: hidden !important;
                        }
                        
                        .report-container, .report-container * {
                            visibility: visible !important;
                        }
                        
                        /* Ocultar elementos no deseados */
                        .print\\:hidden,
                        nav,
                        aside,
                        .sidebar,
                        header,
                        footer,
                        .controls,
                        .hamburger-button,
                        button:not(.print-allowed),
                        [class*="sidebar"],
                        [class*="nav"],
                        [class*="menu"] {
                            display: none !important;
                            visibility: hidden !important;
                        }
                        
                        /* Posicionar el reporte correctamente */
                        .report-container {
                            position: absolute !important;
                            top: 0 !important;
                            left: 0 !important;
                            right: 0 !important;
                            width: 100% !important;
                            height: auto !important;
                            background: white !important;
                            box-shadow: none !important;
                            margin: 0 !important;
                            padding: 20px !important;
                            z-index: 9999 !important;
                        }
                        
                        /* Asegurar que solo el contenido del reporte sea visible */
                        .report-print-area {
                            background: white !important;
                            color: black !important;
                        }
                        
                        .print\\:break-before {
                            page-break-before: always;
                        }
                        
                        .print\\:break-after {
                            page-break-after: always;
                        }
                        
                        .print\\:break-inside-avoid {
                            page-break-inside: avoid;
                        }
                        
                        body {
                            background: white !important;
                            margin: 0 !important;
                            padding: 0 !important;
                        }
                        
                        table {
                            page-break-inside: auto;
                            border-collapse: collapse !important;
                            width: 100% !important;
                        }
                        
                        tr {
                            page-break-inside: avoid;
                            page-break-after: auto;
                        }
                        
                        thead {
                            display: table-header-group;
                        }
                        
                        tfoot {
                            display: table-footer-group;
                        }
                        
                        th, td {
                            border: 1px solid #000 !important;
                            padding: 8px !important;
                            text-align: left !important;
                        }
                        
                        /* Asegurar colores correctos en impresión */
                        .text-red-600, .text-red-800, .text-red-900 {
                            color: #dc2626 !important;
                        }
                        
                        .text-yellow-600, .text-yellow-800, .text-yellow-900 {
                            color: #d97706 !important;
                        }
                        
                        .text-green-600, .text-green-800, .text-green-900 {
                            color: #16a34a !important;
                        }
                        
                        .text-blue-600, .text-blue-800, .text-blue-900 {
                            color: #2563eb !important;
                        }
                        
                        .text-gray-600, .text-gray-700, .text-gray-800, .text-gray-900 {
                            color: #374151 !important;
                        }
                        
                        .bg-blue-50, .bg-red-50, .bg-yellow-50, .bg-green-50, .bg-gray-50 {
                            background-color: #f8fafc !important;
                            border: 1px solid #e2e8f0 !important;
                        }
                    }
                `}</style>

                <div className="report-container report-print-area p-8 print:p-0">
                    {/* Encabezado del reporte */}
                    <div className="border-b-2 border-gray-300 pb-6 mb-6 print:break-inside-avoid">
                        <div className="flex justify-between items-start">
                            <div>
                                <img 
                                    src="https://static.wixstatic.com/media/1831cb_2d8491304a02448cb1751c82852750ff~mv2.png/v1/fill/w_148,h_27,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Logotipo%20MisTatas%20blanco.png"
                                    alt="Mistatas Logo"
                                    className="h-12 w-auto mb-4 print:filter print:invert"
                                />
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                    INFORME DE INVENTARIO
                                </h1>
                                <p className="text-lg text-gray-600">
                                    {selectedCategory === 'all' ? 'Inventario Completo' : `Categoría: ${selectedCategory}`}
                                </p>
                            </div>
                            <div className="text-right text-sm text-gray-600">
                                <p><strong>Fecha:</strong> {currentDate}</p>
                                <p><strong>Hora:</strong> {currentTime}</p>
                                <p><strong>Período:</strong> Últimos {dateRange} días</p>
                                <p><strong>Total de ítems:</strong> {filteredItems.length}</p>
                            </div>
                        </div>
                    </div>

                    {/* Resumen ejecutivo */}
                    {includeStatistics && (
                        <div className="mb-8 print:break-inside-avoid">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <BarChart3 className="w-5 h-5 mr-2" />
                                Resumen Ejecutivo
                            </h2>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-blue-50 p-4 rounded-lg border">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-blue-600 text-sm font-medium">Total de Ítems</p>
                                            <p className="text-2xl font-bold text-blue-900">{inventoryStats.totalItems}</p>
                                        </div>
                                        <Package className="w-8 h-8 text-blue-600" />
                                    </div>
                                </div>
                                
                                <div className="bg-red-50 p-4 rounded-lg border">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-red-600 text-sm font-medium">Stock Crítico</p>
                                            <p className="text-2xl font-bold text-red-900">{inventoryStats.criticalItems}</p>
                                        </div>
                                        <AlertTriangle className="w-8 h-8 text-red-600" />
                                    </div>
                                </div>
                                
                                <div className="bg-yellow-50 p-4 rounded-lg border">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-yellow-600 text-sm font-medium">Stock Bajo</p>
                                            <p className="text-2xl font-bold text-yellow-900">{inventoryStats.lowStockItems}</p>
                                        </div>
                                        <TrendingDown className="w-8 h-8 text-yellow-600" />
                                    </div>
                                </div>
                                
                                <div className="bg-green-50 p-4 rounded-lg border">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-green-600 text-sm font-medium">Stock Suficiente</p>
                                            <p className="text-2xl font-bold text-green-900">{inventoryStats.sufficientStockItems}</p>
                                        </div>
                                        <TrendingUp className="w-8 h-8 text-green-600" />
                                    </div>
                                </div>
                            </div>

                            {/* Estadísticas por categoría */}
                            {selectedCategory === 'all' && (
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Distribución por Categoría</h3>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full border border-gray-300">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-2 border-b border-gray-300 text-left text-sm font-semibold text-gray-900">Categoría</th>
                                                    <th className="px-4 py-2 border-b border-gray-300 text-center text-sm font-semibold text-gray-900">Ítems</th>
                                                    <th className="px-4 py-2 border-b border-gray-300 text-center text-sm font-semibold text-gray-900">Cantidad Total</th>
                                                    <th className="px-4 py-2 border-b border-gray-300 text-center text-sm font-semibold text-gray-900">Críticos</th>
                                                    <th className="px-4 py-2 border-b border-gray-300 text-center text-sm font-semibold text-gray-900">Stock Bajo</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Object.entries(inventoryStats.byCategory).map(([category, stats]) => (
                                                    <tr key={category} className="border-b border-gray-200">
                                                        <td className="px-4 py-2 text-sm text-gray-900 font-medium">{category}</td>
                                                        <td className="px-4 py-2 text-sm text-gray-700 text-center">{stats.count}</td>
                                                        <td className="px-4 py-2 text-sm text-gray-700 text-center">{stats.totalQuantity}</td>
                                                        <td className="px-4 py-2 text-sm text-red-600 text-center font-medium">{stats.criticalCount}</td>
                                                        <td className="px-4 py-2 text-sm text-yellow-600 text-center font-medium">{stats.lowStockCount}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Listado detallado del inventario */}
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                            <Package className="w-5 h-5 mr-2" />
                            Inventario Detallado
                        </h2>
                        
                        <div className="overflow-x-auto">
                            <table className="min-w-full border border-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 border-b border-gray-300 text-left text-sm font-semibold text-gray-900">Código</th>
                                        <th className="px-3 py-2 border-b border-gray-300 text-left text-sm font-semibold text-gray-900">Nombre del Ítem</th>
                                        <th className="px-3 py-2 border-b border-gray-300 text-left text-sm font-semibold text-gray-900">Categoría</th>
                                        <th className="px-3 py-2 border-b border-gray-300 text-center text-sm font-semibold text-gray-900">Cantidad Actual</th>
                                        <th className="px-3 py-2 border-b border-gray-300 text-center text-sm font-semibold text-gray-900">Umbral Crítico</th>
                                        <th className="px-3 py-2 border-b border-gray-300 text-center text-sm font-semibold text-gray-900">Estado</th>
                                        <th className="px-3 py-2 border-b border-gray-300 text-left text-sm font-semibold text-gray-900">Descripción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredItems.map((item, index) => (
                                        <tr key={item.id} className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                            <td className="px-3 py-2 text-sm text-gray-700 font-mono">{item.code}</td>
                                            <td className="px-3 py-2 text-sm text-gray-900 font-medium">{item.name}</td>
                                            <td className="px-3 py-2 text-sm text-gray-700">{item.category}</td>
                                            <td className="px-3 py-2 text-sm text-gray-900 text-center font-semibold">{item.quantity}</td>
                                            <td className="px-3 py-2 text-sm text-gray-700 text-center">{item.criticalThreshold}</td>
                                            <td className={`px-3 py-2 text-sm text-center font-medium ${getStockStatusColor(item)}`}>
                                                {getStockStatusText(item)}
                                            </td>
                                            <td className="px-3 py-2 text-sm text-gray-600">{item.description || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Historial de movimientos recientes */}
                    {includeHistory && filteredHistory.length > 0 && (
                        <div className="print:break-before">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <Calendar className="w-5 h-5 mr-2" />
                                Historial de Movimientos Recientes ({dateRange} días)
                            </h2>
                            
                            <div className="overflow-x-auto">
                                <table className="min-w-full border border-gray-300">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-3 py-2 border-b border-gray-300 text-left text-sm font-semibold text-gray-900">Fecha</th>
                                            <th className="px-3 py-2 border-b border-gray-300 text-left text-sm font-semibold text-gray-900">Ítem</th>
                                            <th className="px-3 py-2 border-b border-gray-300 text-center text-sm font-semibold text-gray-900">Tipo</th>
                                            <th className="px-3 py-2 border-b border-gray-300 text-center text-sm font-semibold text-gray-900">Cantidad</th>
                                            <th className="px-3 py-2 border-b border-gray-300 text-left text-sm font-semibold text-gray-900">Motivo</th>
                                            <th className="px-3 py-2 border-b border-gray-300 text-left text-sm font-semibold text-gray-900">Usuario</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredHistory.map((entry, index) => {
                                            const entryDate = entry.timestamp?.toDate ? entry.timestamp.toDate() : new Date(entry.timestamp);
                                            const formattedDate = entryDate.toLocaleDateString('es-CL');
                                            const formattedTime = entryDate.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
                                            
                                            return (
                                                <tr key={entry.id || index} className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                                    <td className="px-3 py-2 text-sm text-gray-700">
                                                        {formattedDate}<br />
                                                        <span className="text-xs text-gray-500">{formattedTime}</span>
                                                    </td>
                                                    <td className="px-3 py-2 text-sm text-gray-900 font-medium">{entry.itemName}</td>
                                                    <td className="px-3 py-2 text-sm text-center">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                            entry.type === 'entrada' ? 'bg-green-100 text-green-800' :
                                                            entry.type === 'salida' ? 'bg-red-100 text-red-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {entry.type.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2 text-sm text-center">
                                                        <span className={entry.type === 'entrada' ? 'text-green-600' : entry.type === 'salida' ? 'text-red-600' : 'text-gray-600'}>
                                                            {entry.type === 'entrada' ? '+' : entry.type === 'salida' ? '-' : ''}{entry.quantityChanged || '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2 text-sm text-gray-600">{entry.motivo || '-'}</td>
                                                    <td className="px-3 py-2 text-sm text-gray-600">{entry.userEmail}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Pie del reporte */}
                    <div className="mt-8 pt-6 border-t border-gray-300 text-sm text-gray-600 print:break-inside-avoid">
                        <div className="flex justify-between items-center">
                            <div>
                                <p><strong>Reporte generado por:</strong> Sistema de Inventario Mistatas</p>
                                <p><strong>Fecha de generación:</strong> {currentDate} a las {currentTime}</p>
                            </div>
                            <div className="text-right">
                                <p><strong>Total de movimientos recientes:</strong> {inventoryStats.recentMovements}</p>
                                <p><strong>Ítems que requieren atención:</strong> {inventoryStats.criticalItems + inventoryStats.lowStockItems}</p>
                            </div>
                        </div>
                        
                        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded print:break-inside-avoid">
                            <h4 className="font-semibold text-gray-900 mb-2">Notas Importantes:</h4>
                            <ul className="text-xs text-gray-600 space-y-1">
                                <li>• Los ítems marcados como "CRÍTICO" requieren reposición inmediata.</li>
                                <li>• Los ítems con "STOCK BAJO" deben ser monitoreados para próxima reposición.</li>
                                <li>• Este reporte refleja el estado del inventario al momento de su generación.</li>
                                <li>• Para consultas o aclaraciones, contacte al administrador del sistema.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportModule;
