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

        // Ordenar items dentro de cada categoría con TERMINALES INTELIGENTES primero
        Object.keys(categorized).forEach(category => {
            categorized[category].sort((a, b) => {
                // Si es la categoría DISPOSITIVOS INTELIGENTES, TERMINALES INTELIGENTES va primero
                if (category === 'DISPOSITIVOS INTELIGENTES') {
                    if (a.name === 'TERMINALES INTELIGENTES') return -1;
                    if (b.name === 'TERMINALES INTELIGENTES') return 1;
                }
                // Para el resto, orden alfabético normal
                return a.name.localeCompare(b.name);
            });
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
                <meta charset="UTF-8">
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
                        font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Roboto', 'Arial', sans-serif;
                        line-height: 1.5;
                        color: #1a202c;
                        background: white;
                        font-size: 12px;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    
                    /* Encabezado elegante con logo */
                    .header {
                        text-align: center;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 25px 30px;
                        margin: -20px -20px 30px -20px;
                        border-radius: 0 0 20px 20px;
                        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                        position: relative;
                    }
                    
                    .header-logo {
                        position: absolute;
                        top: 15px;
                        left: 30px;
                        background: white;
                        padding: 8px 15px;
                        border-radius: 8px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                    }
                    
                    .header-logo-text {
                        font-size: 16px;
                        font-weight: 700;
                        color: #667eea;
                        letter-spacing: 1px;
                    }
                    
                    .header h1 {
                        font-size: 32px;
                        font-weight: 700;
                        margin-bottom: 8px;
                        text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                        letter-spacing: 1px;
                    }
                    
                    .header h2 {
                        font-size: 18px;
                        font-weight: 300;
                        opacity: 0.95;
                        margin-bottom: 15px;
                    }
                    
                    .header-info {
                        display: flex;
                        justify-content: space-between;
                        margin-top: 15px;
                        font-size: 13px;
                        background: rgba(255,255,255,0.1);
                        padding: 10px 20px;
                        border-radius: 8px;
                        backdrop-filter: blur(10px);
                    }
                    
                    /* Resumen ejecutivo elegante */
                    .executive-summary {
                        background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
                        border: 2px solid #e2e8f0;
                        border-radius: 15px;
                        padding: 25px;
                        margin-bottom: 35px;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.08);
                    }
                    
                    .executive-summary h3 {
                        color: #2d3748;
                        font-size: 20px;
                        font-weight: 600;
                        margin-bottom: 20px;
                        display: flex;
                        align-items: center;
                        border-bottom: 2px solid #4299e1;
                        padding-bottom: 10px;
                    }
                    
                    .stats-grid {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 20px;
                        margin-bottom: 20px;
                    }
                    
                    .stat-card {
                        background: white;
                        border: 2px solid #e2e8f0;
                        border-radius: 12px;
                        padding: 20px;
                        text-align: center;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
                    }
                    
                    .stat-card.blue { border-color: #4299e1; background: linear-gradient(135deg, #ebf8ff 0%, #bee3f8 100%); }
                    .stat-card.green { border-color: #38a169; background: linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%); }
                    .stat-card.yellow { border-color: #d69e2e; background: linear-gradient(135deg, #fffbeb 0%, #fef5e7 100%); }
                    .stat-card.red { border-color: #e53e3e; background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%); }
                    
                    .stat-number {
                        font-size: 28px;
                        font-weight: 700;
                        margin-bottom: 5px;
                        color: #2d3748;
                    }
                    
                    .stat-label {
                        font-size: 12px;
                        color: #4a5568;
                        font-weight: 500;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    
                    /* Secciones de categoría elegantes */
                    .category-section {
                        margin-bottom: 35px;
                        page-break-inside: avoid;
                        background: white;
                        border-radius: 15px;
                        overflow: hidden;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.08);
                        border: 1px solid #e2e8f0;
                    }
                    
                    .category-header {
                        background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
                        color: white;
                        padding: 18px 25px;
                        font-size: 18px;
                        font-weight: 600;
                        position: relative;
                        box-shadow: 0 2px 10px rgba(66, 153, 225, 0.3);
                    }
                    
                    .category-header::after {
                        content: '';
                        position: absolute;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        height: 3px;
                        background: linear-gradient(90deg, #ffffff40, transparent);
                    }
                    
                    /* Estadísticas de categoría */
                    .category-stats {
                        background: linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%);
                        padding: 18px 25px;
                        border-bottom: 1px solid #e2e8f0;
                    }
                    
                    .category-stats-grid {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 20px;
                        text-align: center;
                    }
                    
                    .category-stat-item {
                        background: white;
                        padding: 12px;
                        border-radius: 8px;
                        border: 1px solid #e2e8f0;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                    }
                    
                    .category-stat-number {
                        font-size: 20px;
                        font-weight: 700;
                        margin-bottom: 4px;
                    }
                    
                    .category-stat-label {
                        font-size: 10px;
                        color: #718096;
                        font-weight: 500;
                        text-transform: uppercase;
                    }
                    
                    /* Tablas elegantes */
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        background: white;
                        font-size: 11px;
                    }
                    
                    thead {
                        background: linear-gradient(135deg, #edf2f7 0%, #e2e8f0 100%);
                    }
                    
                    th {
                        padding: 15px 12px;
                        text-align: left;
                        font-weight: 600;
                        font-size: 11px;
                        color: #2d3748;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        border-bottom: 2px solid #cbd5e0;
                        position: relative;
                    }
                    
                    th::after {
                        content: '';
                        position: absolute;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        height: 2px;
                        background: linear-gradient(90deg, #4299e1, #3182ce);
                    }
                    
                    td {
                        padding: 12px;
                        border-bottom: 1px solid #f1f5f9;
                        font-size: 11px;
                        vertical-align: middle;
                    }
                    
                    tr:nth-child(even) {
                        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                    }
                    
                    /* Badges de estado sofisticados */
                    .status-badge {
                        display: inline-flex;
                        align-items: center;
                        padding: 6px 12px;
                        border-radius: 20px;
                        font-size: 10px;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        border: 1px solid;
                    }
                    
                    .status-critical {
                        background: linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%);
                        color: #742a2a;
                        border-color: #fc8181;
                    }
                    
                    .status-low {
                        background: linear-gradient(135deg, #fefcbf 0%, #faf089 100%);
                        color: #744210;
                        border-color: #f6e05e;
                    }
                    
                    .status-sufficient {
                        background: linear-gradient(135deg, #c6f6d5 0%, #9ae6b4 100%);
                        color: #22543d;
                        border-color: #68d391;
                    }
                    
                    /* Código de item estilizado */
                    .item-code {
                        font-family: 'Courier New', monospace;
                        background: linear-gradient(135deg, #edf2f7 0%, #e2e8f0 100%);
                        padding: 4px 8px;
                        border-radius: 6px;
                        font-weight: 600;
                        color: #2d3748;
                        border: 1px solid #cbd5e0;
                        font-size: 10px;
                    }
                    
                    /* Cantidades con colores */
                    .quantity-critical { color: #e53e3e; font-weight: 700; }
                    .quantity-low { color: #d69e2e; font-weight: 600; }
                    .quantity-sufficient { color: #38a169; font-weight: 600; }
                    
                    /* Historial elegante */
                    .history-section {
                        background: white;
                        border-radius: 15px;
                        overflow: hidden;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.08);
                        border: 1px solid #e2e8f0;
                        margin-bottom: 30px;
                    }
                    
                    .history-header {
                        background: linear-gradient(135deg, #38a169 0%, #2f855a 100%);
                        color: white;
                        padding: 18px 25px;
                        font-size: 18px;
                        font-weight: 600;
                    }
                    
                    /* Movimientos */
                    .movement-entrada {
                        background: linear-gradient(135deg, #c6f6d5 0%, #9ae6b4 100%);
                        color: #22543d;
                        border-color: #68d391;
                    }
                    
                    .movement-salida {
                        background: linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%);
                        color: #742a2a;
                        border-color: #fc8181;
                    }
                    
                    /* Pie de página elegante */
                    .footer {
                        margin-top: 40px;
                        padding: 25px;
                        background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
                        border-radius: 15px;
                        border: 2px solid #e2e8f0;
                        font-size: 11px;
                        color: #4a5568;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.05);
                    }
                    
                    .footer-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 30px;
                        margin-bottom: 20px;
                    }
                    
                    .footer h4 {
                        color: #2d3748;
                        font-size: 14px;
                        font-weight: 600;
                        margin-bottom: 15px;
                        border-bottom: 2px solid #4299e1;
                        padding-bottom: 5px;
                    }
                    
                    .notes-box {
                        background: white;
                        border: 2px solid #e2e8f0;
                        border-radius: 10px;
                        padding: 20px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                    }
                    
                    .notes-box ul {
                        list-style: none;
                        padding-left: 0;
                    }
                    
                    .notes-box li {
                        margin-bottom: 8px;
                        padding-left: 20px;
                        position: relative;
                    }
                    
                    .notes-box li::before {
                        content: '✓';
                        position: absolute;
                        left: 0;
                        color: #38a169;
                        font-weight: bold;
                    }
                    
                    /* Responsive para diferentes tamaños */
                    @media (max-width: 800px) {
                        .stats-grid, .category-stats-grid {
                            grid-template-columns: repeat(2, 1fr);
                        }
                        
                        .footer-grid {
                            grid-template-columns: 1fr;
                        }
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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
            <div className="p-6 space-y-6">
                {/* Encabezado con Logo y Controles */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center space-x-4">
                            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-bold text-lg shadow-lg">
                                MISTATAS
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                                    <FileText className="w-8 h-8 mr-3 text-blue-600" />
                                    Informes Profesionales
                                </h2>
                                <p className="text-gray-500 dark:text-gray-400 mt-1">Sistema de Gestión de Inventario</p>
                            </div>
                        </div>
                        <button
                            onClick={generateReport}
                            className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                            <Printer className="w-5 h-5 mr-2" />
                            Generar Informe
                        </button>
                    </div>

                    {/* Filtros */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 rounded-lg">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <Package className="inline w-4 h-4 mr-1" />
                                Sucursal
                            </label>
                            <select
                                value={selectedBranch}
                                onChange={(e) => setSelectedBranch(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white transition-all"
                            >
                                <option value="all">Todas las Sucursales</option>
                                {branches.map(branch => (
                                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <Calendar className="inline w-4 h-4 mr-1" />
                                Período Historial
                            </label>
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white transition-all"
                            >
                                <option value="7">Últimos 7 días</option>
                                <option value="30">Últimos 30 días</option>
                                <option value="90">Últimos 90 días</option>
                            </select>
                        </div>

                        <div className="flex items-end">
                            <div className="space-y-3">
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={includeStatistics}
                                        onChange={(e) => setIncludeStatistics(e.target.checked)}
                                        className="mr-3 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center">
                                        <BarChart3 className="w-4 h-4 mr-1" />
                                        Incluir estadísticas
                                    </span>
                                </label>
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={includeHistory}
                                        onChange={(e) => setIncludeHistory(e.target.checked)}
                                        className="mr-3 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center">
                                        <Calendar className="w-4 h-4 mr-1" />
                                        Incluir historial
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Vista Previa del Reporte en la Interfaz Web */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                    {/* Encabezado de Previsualización */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="bg-white text-blue-600 px-3 py-1 rounded-lg font-bold text-sm">
                                    MISTATAS
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold">INFORME DE INVENTARIO</h3>
                                    <p className="text-blue-100">Sistema de Gestión Mistatas</p>
                                </div>
                            </div>
                            <div className="text-right text-sm">
                                <div><strong>Sucursal:</strong> {branchName}</div>
                                <div><strong>Fecha:</strong> {currentDate} - {currentTime}</div>
                            </div>
                        </div>
                    </div>

                    {/* Estadísticas Generales en la Web */}
                    {includeStatistics && (
                        <div className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-gray-600">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
                                <BarChart3 className="w-6 h-6 mr-2 text-blue-600" />
                                📊 Resumen Ejecutivo
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="bg-blue-100 border-l-4 border-blue-500 p-4 rounded-lg shadow-md">
                                    <div className="text-3xl font-bold text-blue-600">{generalStats.totalItems}</div>
                                    <div className="text-sm text-blue-700 font-medium">Total Items</div>
                                </div>
                                <div className="bg-green-100 border-l-4 border-green-500 p-4 rounded-lg shadow-md">
                                    <div className="text-3xl font-bold text-green-600">{generalStats.sufficientItems}</div>
                                    <div className="text-sm text-green-700 font-medium">Stock Suficiente</div>
                                </div>
                                <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded-lg shadow-md">
                                    <div className="text-3xl font-bold text-yellow-600">{generalStats.lowStockItems}</div>
                                    <div className="text-sm text-yellow-700 font-medium">Stock Bajo</div>
                                </div>
                                <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded-lg shadow-md">
                                    <div className="text-3xl font-bold text-red-600">{generalStats.criticalItems}</div>
                                    <div className="text-sm text-red-700 font-medium">Stock Crítico</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Inventario por Categorías en la Web */}
                    <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
                            <Package className="w-6 h-6 mr-2 text-blue-600" />
                            📦 Inventario Detallado por Categorías
                        </h3>

                        <div className="space-y-6">
                            {categoryPriority.map(category => {
                                const categoryItems = itemsByCategory[category] || [];
                                const stats = categoryStats[category];
                                
                                if (categoryItems.length === 0) return null;

                                return (
                                    <div key={category} className="bg-white dark:bg-gray-700 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                                        {/* Encabezado de Categoría */}
                                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
                                            <h4 className="text-lg font-bold">{category}</h4>
                                        </div>

                                        {/* Estadísticas de la categoría */}
                                        {includeStatistics && stats && (
                                            <div className="bg-gray-50 dark:bg-gray-600 p-4 border-b">
                                                <div className="grid grid-cols-4 gap-4 text-center">
                                                    <div className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow">
                                                        <div className="text-2xl font-bold text-blue-600">{stats.totalItems}</div>
                                                        <div className="text-xs text-gray-600 dark:text-gray-300 font-medium">ITEMS</div>
                                                    </div>
                                                    <div className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow">
                                                        <div className="text-2xl font-bold text-green-600">{stats.sufficientItems}</div>
                                                        <div className="text-xs text-gray-600 dark:text-gray-300 font-medium">SUFICIENTE</div>
                                                    </div>
                                                    <div className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow">
                                                        <div className="text-2xl font-bold text-yellow-600">{stats.lowStockItems}</div>
                                                        <div className="text-xs text-gray-600 dark:text-gray-300 font-medium">BAJO</div>
                                                    </div>
                                                    <div className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow">
                                                        <div className="text-2xl font-bold text-red-600">{stats.criticalItems}</div>
                                                        <div className="text-xs text-gray-600 dark:text-gray-300 font-medium">CRÍTICO</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Tabla de items de la categoría */}
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-gray-100 dark:bg-gray-600">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Código</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nombre</th>
                                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cantidad</th>
                                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Mín. Crítico</th>
                                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                                                    {categoryItems.map((item, index) => (
                                                        <tr key={item.id} className={index % 2 === 0 ? 'bg-white dark:bg-gray-700' : 'bg-gray-50 dark:bg-gray-600'}>
                                                            <td className="px-4 py-3 whitespace-nowrap">
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                                    {item.code}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{item.name}</td>
                                                            <td className="px-4 py-3 text-center">
                                                                <span className={`text-sm font-semibold ${
                                                                    item.quantity <= item.criticalThreshold ? 'text-red-600' : 
                                                                    item.quantity <= item.criticalThreshold * 1.5 ? 'text-yellow-600' : 'text-green-600'
                                                                }`}>
                                                                    {item.quantity}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-300">{item.criticalThreshold}</td>
                                                            <td className="px-4 py-3 text-center">
                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStockStatusColor(item)}`}>
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
                    </div>

                    {/* Historial de Movimientos en la Web */}
                    {includeHistory && filteredHistory.length > 0 && (
                        <div className="p-6 border-t bg-gray-50 dark:bg-gray-700">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
                                <Calendar className="w-6 h-6 mr-2 text-green-600" />
                                📅 Movimientos Recientes ({dateRange} días)
                            </h3>
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-green-100 dark:bg-green-800">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-green-700 dark:text-green-300 uppercase tracking-wider">Fecha</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-green-700 dark:text-green-300 uppercase tracking-wider">Item</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-green-700 dark:text-green-300 uppercase tracking-wider">Tipo</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-green-700 dark:text-green-300 uppercase tracking-wider">Cantidad</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-green-700 dark:text-green-300 uppercase tracking-wider">Motivo</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                                            {filteredHistory.map((entry, index) => {
                                                const entryDate = entry.timestamp?.toDate ? entry.timestamp.toDate() : new Date(entry.timestamp);
                                                return (
                                                    <tr key={entry.id} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                                            {entryDate.toLocaleDateString('es-CL')}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{entry.itemName}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                entry.type === 'entrada' ? 'bg-green-100 text-green-800' :
                                                                entry.type === 'salida' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                                            }`}>
                                                                {entry.type?.toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className={`text-sm font-semibold ${
                                                                entry.type === 'entrada' ? 'text-green-600' : 
                                                                entry.type === 'salida' ? 'text-red-600' : 'text-gray-600'
                                                            }`}>
                                                                {entry.type === 'entrada' ? '+' : entry.type === 'salida' ? '-' : ''}{entry.quantityChanged || '-'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-300">{entry.motivo || '-'}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Área de Impresión del Reporte (Oculta en la interfaz) */}
                <div className="report-print-area" style={{ display: 'none' }}>
                    {/* Encabezado del Reporte PDF */}
                    <div className="header">
                        <div className="header-logo">
                            <div className="header-logo-text">MISTATAS</div>
                        </div>
                        <h1>INFORME DE INVENTARIO</h1>
                        <h2>Sistema de Gestión Mistatas</h2>
                        <div className="header-info">
                            <div><strong>Sucursal:</strong> {branchName}</div>
                            <div><strong>Fecha:</strong> {currentDate} - {currentTime}</div>
                        </div>
                    </div>

                    {/* Estadísticas Generales PDF */}
                    {includeStatistics && (
                        <div className="executive-summary">
                            <h3>📊 Resumen Ejecutivo</h3>
                            <div className="stats-grid">
                                <div className="stat-card blue">
                                    <div className="stat-number">{generalStats.totalItems}</div>
                                    <div className="stat-label">Total Items</div>
                                </div>
                                <div className="stat-card green">
                                    <div className="stat-number">{generalStats.sufficientItems}</div>
                                    <div className="stat-label">Stock Suficiente</div>
                                </div>
                                <div className="stat-card yellow">
                                    <div className="stat-number">{generalStats.lowStockItems}</div>
                                    <div className="stat-label">Stock Bajo</div>
                                </div>
                                <div className="stat-card red">
                                    <div className="stat-number">{generalStats.criticalItems}</div>
                                    <div className="stat-label">Stock Crítico</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Inventario por Categorías PDF */}
                    <div className="mb-8">
                        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                            📦 Inventario Detallado por Categorías
                        </h3>

                        {categoryPriority.map(category => {
                            const categoryItems = itemsByCategory[category] || [];
                            const stats = categoryStats[category];
                            
                            if (categoryItems.length === 0) return null;

                            return (
                                <div key={category} className="category-section">
                                    <div className="category-header">
                                        {category}
                                    </div>

                                    {/* Estadísticas de la categoría PDF */}
                                    {includeStatistics && stats && (
                                        <div className="category-stats">
                                            <div className="category-stats-grid">
                                                <div className="category-stat-item">
                                                    <div className="category-stat-number" style={{color: '#4299e1'}}>{stats.totalItems}</div>
                                                    <div className="category-stat-label">Items</div>
                                                </div>
                                                <div className="category-stat-item">
                                                    <div className="category-stat-number" style={{color: '#38a169'}}>{stats.sufficientItems}</div>
                                                    <div className="category-stat-label">Suficiente</div>
                                                </div>
                                                <div className="category-stat-item">
                                                    <div className="category-stat-number" style={{color: '#d69e2e'}}>{stats.lowStockItems}</div>
                                                    <div className="category-stat-label">Bajo</div>
                                                </div>
                                                <div className="category-stat-item">
                                                    <div className="category-stat-number" style={{color: '#e53e3e'}}>{stats.criticalItems}</div>
                                                    <div className="category-stat-label">Crítico</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Tabla de items de la categoría PDF */}
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Código</th>
                                                <th>Nombre</th>
                                                <th style={{textAlign: 'center'}}>Cantidad</th>
                                                <th style={{textAlign: 'center'}}>Mín. Crítico</th>
                                                <th style={{textAlign: 'center'}}>Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {categoryItems.map((item, index) => (
                                                <tr key={item.id}>
                                                    <td><span className="item-code">{item.code}</span></td>
                                                    <td>{item.name}</td>
                                                    <td style={{textAlign: 'center'}}>
                                                        <span className={
                                                            item.quantity <= item.criticalThreshold ? 'quantity-critical' : 
                                                            item.quantity <= item.criticalThreshold * 1.5 ? 'quantity-low' : 'quantity-sufficient'
                                                        }>
                                                            {item.quantity}
                                                        </span>
                                                    </td>
                                                    <td style={{textAlign: 'center'}}>{item.criticalThreshold}</td>
                                                    <td style={{textAlign: 'center'}}>
                                                        <span className={`status-badge ${
                                                            item.quantity <= item.criticalThreshold ? 'status-critical' : 
                                                            item.quantity <= item.criticalThreshold * 1.5 ? 'status-low' : 'status-sufficient'
                                                        }`}>
                                                            {getStockStatusText(item)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            );
                        })}
                    </div>

                    {/* Historial de Movimientos PDF */}
                    {includeHistory && filteredHistory.length > 0 && (
                        <div className="history-section">
                            <div className="history-header">
                                📅 Movimientos Recientes ({dateRange} días)
                            </div>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Item</th>
                                        <th style={{textAlign: 'center'}}>Tipo</th>
                                        <th style={{textAlign: 'center'}}>Cantidad</th>
                                        <th>Motivo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredHistory.map((entry, index) => {
                                        const entryDate = entry.timestamp?.toDate ? entry.timestamp.toDate() : new Date(entry.timestamp);
                                        return (
                                            <tr key={entry.id}>
                                                <td>{entryDate.toLocaleDateString('es-CL')}</td>
                                                <td>{entry.itemName}</td>
                                                <td style={{textAlign: 'center'}}>
                                                    <span className={`status-badge ${
                                                        entry.type === 'entrada' ? 'movement-entrada' :
                                                        entry.type === 'salida' ? 'movement-salida' : 'status-sufficient'
                                                    }`}>
                                                        {entry.type?.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td style={{textAlign: 'center'}}>
                                                    <span className={entry.type === 'entrada' ? 'quantity-sufficient' : entry.type === 'salida' ? 'quantity-critical' : 'quantity-low'}>
                                                        {entry.type === 'entrada' ? '+' : entry.type === 'salida' ? '-' : ''}{entry.quantityChanged || '-'}
                                                    </span>
                                                </td>
                                                <td>{entry.motivo || '-'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pie del reporte PDF */}
                    <div className="footer">
                        <div className="footer-grid">
                            <div>
                                <h4>Información del Reporte</h4>
                                <p><strong>Reporte generado por:</strong> Sistema de Inventario Mistatas</p>
                                <p><strong>Fecha de generación:</strong> {currentDate} a las {currentTime}</p>
                            </div>
                            <div>
                                <h4>Resumen de Estado</h4>
                                <p><strong>Items que requieren atención:</strong> {generalStats.criticalItems + generalStats.lowStockItems}</p>
                                <p><strong>Cobertura del reporte:</strong> {branchName}</p>
                            </div>
                        </div>
                        
                        <div className="notes-box">
                            <h4>Notas Importantes</h4>
                            <ul>
                                <li>Los ítems marcados como "CRÍTICO" requieren reposición inmediata.</li>
                                <li>Los ítems con "STOCK BAJO" deben ser monitoreados para próxima reposición.</li>
                                <li>Este reporte refleja el estado del inventario al momento de su generación.</li>
                                <li>Los DISPOSITIVOS INTELIGENTES tienen prioridad máxima en gestión de stock.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportModule;
