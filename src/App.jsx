import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, getDocs, onSnapshot, addDoc, doc, updateDoc, deleteDoc, query, where, writeBatch, serverTimestamp, setDoc } from 'firebase/firestore';
import { ChevronDown, ChevronUp, Search, PlusCircle, Edit, Trash2, Box, AlertTriangle, CheckCircle, Package, History, LogOut, Moon, Sun, X } from 'lucide-react';

// --- CONFIGURACIÓN DE FIREBASE ---
// Configuración actualizada con tus credenciales
const firebaseConfig = {
  apiKey: "AIzaSyBRPqli1tfmspsBJb7wRvVsHRCDlxUQGkA",
  authDomain: "inventario-b096f.firebaseapp.com",
  projectId: "inventario-b096f",
  storageBucket: "inventario-b096f.appspot.com",
  messagingSenderId: "161464002849",
  appId: "1:161464002849:web:79eca28579dfb74b733660",
  measurementId: "G-CV2948G2MQ"
};


// --- INICIALIZACIÓN DE FIREBASE ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- DATOS INICIALES PARA PRECARGAR ---
const initialData = {
  categories: [
    "DISPOSITIVOS INTELIGENTES",
    "CONSUMIBLES",
    "MANUALES / RECORDATORIOS",
    "MATERIALES DE INSTALACIÓN"
  ],
  items: [
    { name: "TERMINALES INTELIGENTES", category: "DISPOSITIVOS INTELIGENTES", quantity: 20, criticalThreshold: 5 },
    { name: "TERMINALES RED TELEFONICA", category: "DISPOSITIVOS INTELIGENTES", quantity: 15, criticalThreshold: 5 },
    { name: "DETECTOR DE CAIDAS", category: "DISPOSITIVOS INTELIGENTES", quantity: 25, criticalThreshold: 5 },
    { name: "SENSOR PUERTAS Y VENTANAS", category: "DISPOSITIVOS INTELIGENTES", quantity: 50, criticalThreshold: 10 },
    { name: "LLAVEROS DE INTRUSION", category: "DISPOSITIVOS INTELIGENTES", quantity: 30, criticalThreshold: 10 },
    { name: "SENSOR DETEC. MOVIMIENTO", category: "DISPOSITIVOS INTELIGENTES", quantity: 40, criticalThreshold: 10 },
    { name: "ACTUADOR CORTE DE GAS", category: "DISPOSITIVOS INTELIGENTES", quantity: 10, criticalThreshold: 3 },
    { name: "DETECTOR DE GAS", category: "DISPOSITIVOS INTELIGENTES", quantity: 15, criticalThreshold: 5 },
    { name: "DETECTOR DE HUMO", category: "DISPOSITIVOS INTELIGENTES", quantity: 18, criticalThreshold: 5 },
    { name: "BOTON S.O.S FIJO", category: "DISPOSITIVOS INTELIGENTES", quantity: 22, criticalThreshold: 8 },
    { name: "DISPOSITIVO S.O.S MOVIL", category: "DISPOSITIVOS INTELIGENTES", quantity: 12, criticalThreshold: 4 },
    { name: "GPS Colgante EV-04", category: "DISPOSITIVOS INTELIGENTES", quantity: 8, criticalThreshold: 3 },
    { name: "GPS Reloj EV-05", category: "DISPOSITIVOS INTELIGENTES", quantity: 9, criticalThreshold: 3 },
    { name: "SIMCARDS", category: "CONSUMIBLES", quantity: 200, criticalThreshold: 50 },
    { name: "CARGADORES CONSOLAS Y DET. GAS", category: "CONSUMIBLES", quantity: 30, criticalThreshold: 10 },
    { name: "BATERIA DE LITTIO 3V CR2032", category: "CONSUMIBLES", quantity: 150, criticalThreshold: 40 },
    { name: "MICRO BATERIA LITTIO 3V CR2450", category: "CONSUMIBLES", quantity: 100, criticalThreshold: 30 },
    { name: "PILA AA", category: "CONSUMIBLES", quantity: 300, criticalThreshold: 100 },
    { name: "BATERIA 27A", category: "CONSUMIBLES", quantity: 80, criticalThreshold: 20 },
    { name: "BATERIA 23A", category: "CONSUMIBLES", quantity: 80, criticalThreshold: 20 },
    { name: "MANUAL PLAN FULL PROTECCION", category: "MANUALES / RECORDATORIOS", quantity: 50, criticalThreshold: 15 },
    { name: "MANUAL PLAN STARTER + CAIDA", category: "MANUALES / RECORDATORIOS", quantity: 50, criticalThreshold: 15 },
    { name: "MANUAL PLAN MAYOR", category: "MANUALES / RECORDATORIOS", quantity: 50, criticalThreshold: 15 },
    { name: "MANUAL DE USO", category: "MANUALES / RECORDATORIOS", quantity: 100, criticalThreshold: 25 },
    { name: "RECORDATORIO SI SU SENSOR...", category: "MANUALES / RECORDATORIOS", quantity: 100, criticalThreshold: 25 },
    { name: "NIPLE", category: "MATERIALES DE INSTALACIÓN", quantity: 70, criticalThreshold: 20 },
    { name: "CODO HI HE", category: "MATERIALES DE INSTALACIÓN", quantity: 70, criticalThreshold: 20 },
    { name: "FLEXIBLE 1/2 A 1/2", category: "MATERIALES DE INSTALACIÓN", quantity: 40, criticalThreshold: 15 },
    { name: "REGULADOR DE GAS", category: "MATERIALES DE INSTALACIÓN", quantity: 20, criticalThreshold: 5 },
    { name: "TEFLON DE GAS", category: "MATERIALES DE INSTALACIÓN", quantity: 30, criticalThreshold: 10 },
    { name: "CANALETAS", category: "MATERIALES DE INSTALACIÓN", quantity: 100, criticalThreshold: 30 },
    { name: "ABRAZADERAS METÁLICAS", category: "MATERIALES DE INSTALACIÓN", quantity: 200, criticalThreshold: 50 },
    { name: "SOPLETES GAS BUTANO", category: "MATERIALES DE INSTALACIÓN", quantity: 5, criticalThreshold: 2 },
  ],
};


// --- FUNCIÓN PARA GENERAR CÓDIGO DE ITEM ---
const generateItemCode = (category, name, count) => {
    const categoryAbbr = category.substring(0, 3).toUpperCase();
    const nameAbbr = name.replace(/[^A-Z0-9]/ig, "").substring(0, 3).toUpperCase();
    const number = (count + 1).toString().padStart(3, '0');
    return `${categoryAbbr}-${nameAbbr}-${number}`;
};

// --- FUNCIÓN PARA PRECARGAR DATOS INICIALES ---
const seedDatabase = async () => {
    console.log("Verificando si la base de datos necesita ser inicializada...");
    const itemsCollection = collection(db, 'items');
    const itemsSnapshot = await getDocs(itemsCollection);
    if (itemsSnapshot.empty) {
        console.log("Base de datos vacía. Inicializando con datos de ejemplo...");
        const batch = writeBatch(db);

        // Añadir categorías
        initialData.categories.forEach(categoryName => {
            const categoryRef = doc(collection(db, 'categories'));
            batch.set(categoryRef, { name: categoryName });
        });

        // Añadir items
        let itemCounter = 0;
        for (const itemData of initialData.items) {
            const code = generateItemCode(itemData.category, itemData.name, itemCounter);
            const itemRef = doc(collection(db, 'items'));
            batch.set(itemRef, {
                ...itemData,
                code: code,
                lastModified: serverTimestamp()
            });
            itemCounter++;
        }
        
        await batch.commit();
        console.log("¡Datos iniciales cargados con éxito!");
    } else {
        console.log("La base de datos ya contiene datos. No se requiere inicialización.");
    }
};


// --- COMPONENTES DE LA UI ---

const Login = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            onLoginSuccess();
        } catch (err) {
            setError('Error de autenticación. Verifica tus credenciales.');
            console.error("Error de login:", err);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Función para login de demostración
    const handleDemoLogin = async () => {
        setIsLoading(true);
        setError('');
        try {
            // Utiliza credenciales de un usuario de prueba que debes crear en tu Firebase
            await signInWithEmailAndPassword(auth, 'test@mistatas.com', '123456');
            onLoginSuccess();
        } catch (err) {
            setError('No se pudo iniciar sesión con el usuario de demostración. Asegúrate de que el usuario "test@mistatas.com" exista en Firebase Authentication.');
            console.error("Error de login de demo:", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-md mx-auto">
                <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 bg-white rounded-xl shadow-lg dark:bg-gray-800">
                    <div className="text-center">
                        <img 
                            src="https://static.wixstatic.com/media/1831cb_2d8491304a02448cb1751c82852750ff~mv2.png/v1/fill/w_148,h_27,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Logotipo%20MisTatas%20blanco.png"
                            alt="Mistatas Logo"
                            className="h-6 sm:h-8 w-auto mx-auto mb-3 sm:mb-4"
                        />
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Sistema de Inventario</h1>
                        <p className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">Gestión inteligente de dispositivos</p>
                    </div>
                    <form className="space-y-4 sm:space-y-6" onSubmit={handleLogin}>
                        <div>
                            <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                            <input
                                type="email"
                                required
                                className="w-full px-3 py-2 mt-1 text-sm sm:text-base text-gray-900 bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                placeholder="usuario@mistatas.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña</label>
                            <input
                                type="password"
                                required
                                className="w-full px-3 py-2 mt-1 text-sm sm:text-base text-gray-900 bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        {error && <p className="text-xs sm:text-sm text-center text-red-500">{error}</p>}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {isLoading ? 'Ingresando...' : 'Ingresar'}
                        </button>
                    </form>
                    <div className="text-center">
                        <button
                            onClick={handleDemoLogin}
                            disabled={isLoading}
                            className="w-full py-2 text-sm sm:text-base font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                        >
                            Entrar como Invitado
                        </button>
                        <p className="mt-2 text-2xs sm:text-xs text-gray-500 dark:text-gray-400">Usa "test@mistatas.com" y "123456" para ingresar.</p>                    </div>
                </div>
            </div>
        </div>
    );
};

const DashboardCard = ({ title, value, icon, color, items = [], showDetails = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const modalRef = useRef(null);

    const colorClasses = {
        green: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        red: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    };

    const handleCardClick = () => {
        if (showDetails && items.length > 0) {
            setIsOpen(true);
        }
    };

    return (
        <>
            <div                onClick={handleCardClick}
                className={`p-3 sm:p-6 rounded-xl shadow-md flex items-center space-x-2 sm:space-x-4 ${colorClasses[color]} 
                    ${showDetails && items.length > 0 ? 'cursor-pointer transform transition-transform hover:scale-105 hover:shadow-lg' : ''}`}
            >
                <div className="flex-shrink-0">
                    {React.cloneElement(icon, { className: "w-6 h-6 sm:w-10 sm:h-10" })}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium truncate">{title}</p>
                    <p className="text-lg sm:text-2xl font-bold">{value}</p>
                    {showDetails && items.length > 0 && (
                        <p className="text-xs mt-1 opacity-75">Click para ver detalles</p>
                    )}
                </div>
            </div>

            {/* Modal con animación */}
            {isOpen && (
                <div 
                    className="fixed inset-0 z-50 overflow-y-auto"
                    aria-labelledby="modal-title"
                    role="dialog"
                    aria-modal="true"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setIsOpen(false);
                    }}
                >
                    <div className="flex items-end sm:items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div 
                            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                            aria-hidden="true"
                        ></div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div 
                            ref={modalRef}
                            className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6
                                animate-in fade-in zoom-in-95 duration-300"
                        >
                            <div className="absolute top-0 right-0 pt-4 pr-4">
                                <button
                                    type="button"
                                    className="bg-white dark:bg-gray-800 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <span className="sr-only">Cerrar</span>
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="mt-3 text-center sm:mt-0 sm:text-left">
                                <h3 
                                    className="text-lg leading-6 font-medium text-gray-900 dark:text-white"
                                    id="modal-title"
                                >
                                    {title}
                                </h3>
                                <div className="mt-4 max-h-[60vh] overflow-y-auto">
                                    <div className="space-y-3">
                                        {items.map((item, index) => (
                                            <div 
                                                key={item.id || index}
                                                className={`p-4 rounded-lg ${colorClasses[color]} bg-opacity-50 
                                                    animate-in slide-in-from-bottom-5 duration-300
                                                    ${index > 0 ? 'fade-in' : ''}`}
                                                style={{ animationDelay: `${index * 50}ms` }}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <h4 className="font-semibold">{item.name}</h4>
                                                        <p className="text-sm opacity-75">Código: {item.code}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-lg font-bold">{item.quantity}</p>
                                                        <p className="text-xs opacity-75">Umbral: {item.criticalThreshold}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

const Dashboard = ({ items, onNavigate }) => {
    const summary = useMemo(() => {
        const totalItems = items.length;
        const lowStockItems = items.filter(item => item.quantity > item.criticalThreshold && item.quantity <= item.criticalThreshold * 1.5);
        const criticalStockItems = items.filter(item => item.quantity <= item.criticalThreshold);
        const lowStock = lowStockItems.length;
        const criticalStock = criticalStockItems.length;
        const sufficientStock = totalItems - lowStock - criticalStock;

        // Obtener información de dispositivos fundamentales
        const terminalesInteligentes = items.find(item => item.name === "TERMINALES INTELIGENTES") || { quantity: 0, criticalThreshold: 5 };
        const gpsDevices = items.filter(item => item.name.includes("GPS")).reduce((total, item) => total + item.quantity, 0);
        const gpsTotal = {
            quantity: gpsDevices,
            criticalThreshold: 6 // Umbral combinado para GPS
        };
        const simCards = items.find(item => item.name === "SIMCARDS") || { quantity: 0, criticalThreshold: 50 };

        return { 
            totalItems, 
            lowStock,
            lowStockItems,
            criticalStock,
            criticalStockItems,            sufficientStock,
            terminalesInteligentes,
            gpsTotal,
            simCards
        };
    }, [items]);

    const getStatusColor = (item) => {
        if (item.quantity <= item.criticalThreshold) return "red";
        if (item.quantity <= item.criticalThreshold * 1.5) return "yellow";
        return "green";
    };

    return (
        <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Dashboard</h2>
            
            {/* Dispositivos Fundamentales */}            <div className="p-2 sm:p-4 bg-white rounded-xl shadow-md dark:bg-gray-800">
                <h3 className="mb-2 sm:mb-4 text-base sm:text-xl font-semibold text-gray-800 dark:text-white">Dispositivos Fundamentales</h3>
                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                    <DashboardCard 
                        title="Terminales Inteligentes" 
                        value={summary.terminalesInteligentes.quantity} 
                        icon={<Box />} 
                        color={getStatusColor(summary.terminalesInteligentes)}
                    />
                    <DashboardCard 
                        title="GPS (Total)" 
                        value={summary.gpsTotal.quantity} 
                        icon={<Box />} 
                        color={getStatusColor(summary.gpsTotal)}
                    />
                    <DashboardCard 
                        title="SIMCARDS" 
                        value={summary.simCards.quantity} 
                        icon={<Box />} 
                        color={getStatusColor(summary.simCards)}
                    />
                </div>
            </div>

            {/* Resumen General */}            <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-6">
                <DashboardCard 
                    title="Stock Suficiente" 
                    value={summary.sufficientStock} 
                    icon={<CheckCircle />} 
                    color="green" 
                />
                <DashboardCard 
                    title="Stock Bajo" 
                    value={summary.lowStock} 
                    icon={<AlertTriangle />} 
                    color="yellow"
                    items={summary.lowStockItems}
                    showDetails={true}
                />
                <DashboardCard 
                    title="Stock Crítico" 
                    value={summary.criticalStock} 
                    icon={<AlertTriangle />} 
                    color="red"
                    items={summary.criticalStockItems}
                    showDetails={true}
                />
                <DashboardCard 
                    title="Total Ítems" 
                    value={summary.totalItems} 
                    icon={<Box />} 
                    color="blue" 
                />
            </div>

            <div className="mt-6 sm:mt-8">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-gray-300">Accesos Rápidos</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mt-3 sm:mt-4">
                    <button onClick={() => onNavigate('inventory')} 
                            className="flex items-center justify-center p-4 sm:p-6 space-x-2 sm:space-x-3 text-base sm:text-lg font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600">
                        <Box className="w-5 h-5 sm:w-6 sm:h-6"/>
                        <span>Ver Inventario</span>
                    </button>
                    <button onClick={() => onNavigate('history')} 
                            className="flex items-center justify-center p-4 sm:p-6 space-x-2 sm:space-x-3 text-base sm:text-lg font-semibold text-gray-700 bg-gray-200 rounded-lg shadow-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
                        <History className="w-5 h-5 sm:w-6 sm:h-6"/>
                        <span>Historial</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const ItemModal = ({ item, categories, onSave, onClose, itemsCount }) => {
    const [formData, setFormData] = useState(
        item || { name: '', category: categories[0] || '', quantity: 0, criticalThreshold: 5, description: '' }
    );
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value) : value }));
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = "El nombre es obligatorio.";
        if (formData.quantity < 0) newErrors.quantity = "La cantidad no puede ser negativa.";
        if (formData.criticalThreshold <= 0) newErrors.criticalThreshold = "El umbral debe ser positivo.";
        if (formData.quantity < formData.criticalThreshold) newErrors.criticalThreshold = "El umbral crítico no puede ser mayor que la cantidad inicial.";
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        
        let itemToSave = { ...formData };
        if (!item) { // Si es un item nuevo, generamos código
            const code = generateItemCode(formData.category, formData.name, itemsCount);
            itemToSave.code = code;
        }

        onSave(itemToSave, item?.id);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-lg p-6 bg-white rounded-lg shadow-xl dark:bg-gray-800">
                <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{item ? 'Editar Ítem' : 'Agregar Ítem'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del Ítem</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-3 py-2 mt-1 text-gray-900 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600" />
                        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoría</label>
                        <select name="category" value={formData.category} onChange={handleChange} className="w-full px-3 py-2 mt-1 text-gray-900 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600">
                           {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cantidad</label>
                            <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} required min="0" className="w-full px-3 py-2 mt-1 text-gray-900 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600" />
                             {errors.quantity && <p className="mt-1 text-xs text-red-500">{errors.quantity}</p>}
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Umbral Crítico</label>
                           <input type="number" name="criticalThreshold" value={formData.criticalThreshold} onChange={handleChange} required min="1" className="w-full px-3 py-2 mt-1 text-gray-900 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600" />
                           {errors.criticalThreshold && <p className="mt-1 text-xs text-red-500">{errors.criticalThreshold}</p>}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción (Opcional)</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} rows="3" className="w-full px-3 py-2 mt-1 text-gray-900 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600" />
                    </div>
                    <div className="flex justify-end pt-4 space-x-3 border-t border-gray-200 dark:border-gray-700">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancelar</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">{item ? 'Guardar Cambios' : 'Crear Ítem'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const EditStockModal = ({ item, onSave, onClose }) => {
    const [change, setChange] = useState(0);
    const [movementType, setMovementType] = useState('salida');
    const [motivo, setMotivo] = useState('');

    const handleSave = () => {
        const newQuantity = movementType === 'salida' 
            ? item.quantity - change
            : item.quantity + change;
            
        if (newQuantity < 0) {
            alert("La cantidad no puede ser negativa.");
            return;
        }

        if (movementType === 'salida' && !motivo.trim()) {
            alert("Por favor, ingrese el motivo del retiro. Este campo es obligatorio para todas las salidas de inventario.");
            return;
        }
        
        if (change <= 0) {
            alert("La cantidad debe ser mayor a 0.");
            return;
        }
        
        onSave(item.id, newQuantity, movementType, change, motivo);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-sm p-6 bg-white rounded-lg shadow-xl dark:bg-gray-800">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Editar Stock: {item.name}</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Stock actual: {item.quantity}</p>
                <div className="mt-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Movimiento</label>
                        <select value={movementType} onChange={(e) => setMovementType(e.target.value)} className="w-full px-3 py-2 mt-1 text-gray-900 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600">
                            <option value="salida">Salida</option>
                            <option value="entrada">Entrada</option>
                        </select>
                    </div>                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cantidad a modificar</label>
                        <input type="number" value={change} onChange={(e) => setChange(Math.abs(parseInt(e.target.value) || 0))} min="0" className="w-full px-3 py-2 mt-1 text-gray-900 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600" />
                    </div>
                    {movementType === 'salida' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Motivo del retiro</label>
                            <textarea 
                                value={motivo} 
                                onChange={(e) => setMotivo(e.target.value)}
                                placeholder="Ejemplo: Instalación en Ñuñoa"
                                className="w-full px-3 py-2 mt-1 text-gray-900 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                rows="2"
                            />
                        </div>
                    )}
                </div>
                <div className="flex justify-end pt-4 mt-4 space-x-3 border-t border-gray-200 dark:border-gray-700">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancelar</button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Actualizar Stock</button>
                </div>
            </div>
        </div>
    );
};


const CriticalStockAlert = ({ items, onClose }) => {
    if (items.length === 0) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="w-full max-w-md p-6 mx-4 bg-white rounded-lg shadow-2xl dark:bg-gray-800 animate-pulse-once">
                 <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full dark:bg-red-900/50">
                            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-red-800 dark:text-red-300">Alerta de Stock Crítico</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Algunos ítems necesitan reposición urgente.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                    {items.map(item => (
                        <div key={item.id} className="p-3 bg-red-50 rounded-md dark:bg-red-900/30">
                            <p className="font-semibold text-gray-800 dark:text-gray-200">{item.name}</p>
                            <p className="text-sm text-red-700 dark:text-red-400">
                                Cantidad actual: <span className="font-bold">{item.quantity}</span> (Umbral: {item.criticalThreshold})
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Sugerencia: Reponer al menos {item.criticalThreshold * 2 - item.quantity} unidades.</p>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                    <button onClick={onClose} className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
};

const InventoryList = ({ items, categories, onSave, onDelete, onUpdateStock, itemsCount }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterStock, setFilterStock] = useState('all');
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [stockEditModal, setStockEditModal] = useState(null);
    const [showFilters, setShowFilters] = useState(false);

    const itemsPerPage = 10;

    // Función para renderizar los controles de filtro
    const FilterControls = () => (        <div className={`space-y-3 sm:space-y-0 sm:flex sm:items-center sm:space-x-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm transition-colors duration-200 ${showFilters ? 'block' : 'hidden sm:flex'}`}>
            <div className="flex-1">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar ítem..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors duration-200"
                    />
                </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white bg-white dark:bg-gray-700 transition-colors duration-200"
                >
                    <option value="all">Todas las categorías</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                </select>
                <select
                    value={filterStock}
                    onChange={(e) => setFilterStock(e.target.value)}
                    className="px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white bg-white dark:bg-gray-700 transition-colors duration-200"
                >
                    <option value="all">Todo el stock</option>
                    <option value="critical">Stock crítico</option>
                    <option value="low">Stock bajo</option>
                    <option value="sufficient">Stock suficiente</option>
                </select>
            </div>
        </div>
    );

    const filteredAndSortedItems = useMemo(() => {
        let sortedItems = [...items];

        // Filtrado
        sortedItems = sortedItems.filter(item => {
            const searchMatch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.code.toLowerCase().includes(searchTerm.toLowerCase());
            const categoryMatch = filterCategory === 'all' || item.category === filterCategory;
            const stockMatch = filterStock === 'all' || 
                (filterStock === 'sufficient' && item.quantity > item.criticalThreshold * 1.5) ||
                (filterStock === 'low' && item.quantity > item.criticalThreshold && item.quantity <= item.criticalThreshold * 1.5) ||
                (filterStock === 'critical' && item.quantity <= item.criticalThreshold);
            return searchMatch && categoryMatch && stockMatch;
        });

        // Ordenamiento
        sortedItems.sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];

            if (typeof aValue === 'string') {
              aValue = aValue.toLowerCase();
              bValue = bValue.toLowerCase();
            }
            
            if (aValue < bValue) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });

        return sortedItems;
    }, [items, searchTerm, filterCategory, filterStock, sortConfig]);

    const totalPages = Math.ceil(filteredAndSortedItems.length / itemsPerPage);
    const paginatedItems = filteredAndSortedItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getStockStatus = (item) => {
        if (item.quantity <= item.criticalThreshold) {
            return { text: 'Crítico', color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' };
        }
        if (item.quantity <= item.criticalThreshold * 1.5) {
            return { text: 'Bajo', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' };
        }
        return { text: 'Suficiente', color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' };
    };

    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return null;
        return sortConfig.direction === 'ascending' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
    };    return (
        <div className="space-y-4 bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Inventario</h2>
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-md border shadow-sm hover:bg-gray-50 sm:hidden dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    >
                        {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <span className="flex items-center justify-center">
                            <PlusCircle className="w-5 h-5 mr-2" />
                            Agregar Ítem
                        </span>
                    </button>
                </div>
            </div>

            <FilterControls />        <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow-md transition-colors duration-200">
                <div className="inline-block min-w-full align-middle">
                    <div className="overflow-hidden border border-gray-200 rounded-lg dark:border-gray-700">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800 transition-colors duration-200">                            <thead className="bg-gray-50 dark:bg-gray-700 transition-colors duration-200">
                                <tr>
                                    {['Código', 'Nombre', 'Categoría', 'Cantidad', 'Acciones'].map((header, index) => (
                                        <th
                                            key={index}
                                            className={`px-3 py-3.5 text-left text-xs font-semibold text-gray-900 dark:text-gray-200 ${
                                                index === 0 ? 'hidden sm:table-cell' : ''
                                            }`}
                                        >
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 transition-colors duration-200">
                                {paginatedItems.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                                        <td className="hidden sm:table-cell px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            {item.code}
                                        </td>
                                        <td className="px-3 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400 sm:hidden">
                                                    {item.code} - {item.category}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="hidden sm:table-cell px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            {item.category}
                                        </td>
                                        <td className="px-3 py-4">
                                            <div className="flex items-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    getStockStatus(item).color
                                                }`}>
                                                    {item.quantity}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => setStockEditModal(item)}
                                                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                                >
                                                    <Edit className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditingItem(item);
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                                                >
                                                    <PlusCircle className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => onDelete(item.id)}
                                                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Paginación */}
            <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6 dark:bg-gray-800 dark:border-gray-700">
                <div className="flex justify-between w-full">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                        Mostrando <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> a <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredAndSortedItems.length)}</span> de <span className="font-medium">{filteredAndSortedItems.length}</span> resultados
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-white dark:border-gray-600"
                        >
                            Anterior
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-white dark:border-gray-600"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <ItemModal
                    item={editingItem}
                    categories={categories}
                    onSave={onSave}
                    onClose={() => {
                        setIsModalOpen(false);
                        setEditingItem(null);
                    }}
                    itemsCount={itemsCount}
                />
            )}

            {stockEditModal && (
                <EditStockModal
                    item={stockEditModal}
                    onSave={onUpdateStock}
                    onClose={() => setStockEditModal(null)}
                />
            )}
        </div>
    );
};


const HistoryLog = ({ history }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [filterType, setFilterType] = useState('all'); // all, day, week, month, semester, custom

    const filteredAndSortedHistory = useMemo(() => {
        let filtered = [...history];

        // Aplicar filtros de fecha
        if (startDate || endDate) {
            filtered = filtered.filter(log => {
                const logDate = log.timestamp.toDate();
                let start = startDate ? new Date(startDate) : new Date(0);
                let end = endDate ? new Date(endDate) : new Date();
                end.setHours(23, 59, 59, 999); // Incluir todo el día final
                return logDate >= start && logDate <= end;
            });
        } else {
            // Filtros predefinidos
            const now = new Date();
            switch (filterType) {
                case 'day':
                    filtered = filtered.filter(log => {
                        const logDate = log.timestamp.toDate();
                        return logDate.toDateString() === now.toDateString();
                    });
                    break;
                case 'week':
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    filtered = filtered.filter(log => log.timestamp.toDate() >= weekAgo);
                    break;
                case 'month':
                    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                    filtered = filtered.filter(log => log.timestamp.toDate() >= monthAgo);
                    break;
                case 'semester':
                    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
                    filtered = filtered.filter(log => log.timestamp.toDate() >= sixMonthsAgo);
                    break;
            }
        }

        return filtered.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());
    }, [history, startDate, endDate, filterType]);

    const handleFilterChange = (type) => {
        setFilterType(type);
        setStartDate('');
        setEndDate('');
    };    const groupByDate = (logs) => {
        const groups = {};
        logs.forEach(log => {
            const date = log.timestamp.toDate().toLocaleDateString();
            if (!groups[date]) {
                groups[date] = {
                    logs: [],
                    summary: {},
                    stats: {
                        totalMovements: 0,
                        entradas: 0,
                        salidas: 0,
                        categorias: new Set(),
                        itemsUnicos: new Set()
                    }
                };
            }
            groups[date].logs.push(log);
            
            // Actualizar estadísticas
            groups[date].stats.totalMovements++;
            if (log.category) groups[date].stats.categorias.add(log.category);
            groups[date].stats.itemsUnicos.add(log.itemName);
            
            // Crear resumen diario
            if (log.type === 'salida' || log.type === 'entrada') {
                if (!groups[date].summary[log.itemName]) {
                    groups[date].summary[log.itemName] = {
                        entradas: 0,
                        salidas: 0,
                        categoria: log.category,
                        detalles: []
                    };
                }
                
                const movimiento = {
                    hora: log.hora || log.timestamp.toDate().toLocaleTimeString(),
                    cantidad: log.quantityChanged,
                    tipo: log.type,
                    motivo: log.motivo,
                    usuario: log.userEmail
                };
                
                groups[date].summary[log.itemName].detalles.push(movimiento);
                
                if (log.type === 'entrada') {
                    groups[date].summary[log.itemName].entradas += log.quantityChanged;
                    groups[date].stats.entradas += log.quantityChanged;
                } else {
                    groups[date].summary[log.itemName].salidas += log.quantityChanged;
                    groups[date].stats.salidas += log.quantityChanged;
                }
            }
        });

        // Convertir Sets a números para cada grupo
        Object.keys(groups).forEach(date => {
            groups[date].stats.categorias = groups[date].stats.categorias.size;
            groups[date].stats.itemsUnicos = groups[date].stats.itemsUnicos.size;
        });
        
        return groups;
    };

    const groupedHistory = groupByDate(filteredAndSortedHistory);
    const getMovementStyle = (type) => {
        if (type === 'entrada') {
            return { text: 'Entrada', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/50', symbol: '+' };
        }
        if (type === 'salida') {
            return { text: 'Salida', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/50', symbol: '-' };
        }
        return { text: type.charAt(0).toUpperCase() + type.slice(1), color: 'text-gray-600 dark:text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-800', symbol: '•' };
    };

    // Calcula estadísticas para el resumen
    const calculateStats = (logs) => {
        const stats = {
            totalMovements: logs.length,
            totalEntradas: 0,
            totalSalidas: 0,
            itemsMovidos: new Set(),
            categorias: new Set(),
            totalPorCategoria: {},
        };

        logs.forEach(log => {
            stats.itemsMovidos.add(log.itemName);
            if (log.category) stats.categorias.add(log.category);
            
            if (log.type === 'entrada') {
                stats.totalEntradas += log.quantityChanged;
            } else if (log.type === 'salida') {
                stats.totalSalidas += log.quantityChanged;
            }

            if (log.category) {
                if (!stats.totalPorCategoria[log.category]) {
                    stats.totalPorCategoria[log.category] = {
                        entradas: 0,
                        salidas: 0
                    };
                }
                if (log.type === 'entrada') {
                    stats.totalPorCategoria[log.category].entradas += log.quantityChanged;
                } else if (log.type === 'salida') {
                    stats.totalPorCategoria[log.category].salidas += log.quantityChanged;
                }
            }
        });

        return {
            ...stats,
            itemsMovidos: stats.itemsMovidos.size,
            categorias: stats.categorias.size,
        };
    };

    return (
        <div className="p-4 sm:p-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Historial de Movimientos</h2>
            
            <div className="mt-4 sm:mt-6 space-y-4">
                <div className="bg-white rounded-lg shadow p-4 dark:bg-gray-800">
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
                        <button
                            onClick={() => handleFilterChange('all')}
                            className={`px-3 py-2 rounded-md text-sm font-medium ${
                                filterType === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                        >
                            Todo
                        </button>
                        <button
                            onClick={() => handleFilterChange('day')}
                            className={`px-3 py-2 rounded-md text-sm font-medium ${
                                filterType === 'day' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                        >
                            Hoy
                        </button>
                        <button
                            onClick={() => handleFilterChange('week')}
                            className={`px-3 py-2 rounded-md text-sm font-medium ${
                                filterType === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                        >
                            Última semana
                        </button>
                        <button
                            onClick={() => handleFilterChange('month')}
                            className={`px-3 py-2 rounded-md text-sm font-medium ${
                                filterType === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                        >
                            Último mes
                        </button>
                        <button
                            onClick={() => handleFilterChange('semester')}
                            className={`px-3 py-2 rounded-md text-sm font-medium ${
                                filterType === 'semester' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                        >
                            Último semestre
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Fecha inicial
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => {
                                    setStartDate(e.target.value);
                                    setFilterType('custom');
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Fecha final
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => {
                                    setEndDate(e.target.value);
                                    setFilterType('custom');
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                    </div>
                </div>                <div className="space-y-6">
                    {/* Resumen del período seleccionado */}
                    {filteredAndSortedHistory.length > 0 && (
                        <div className="bg-white rounded-lg shadow dark:bg-gray-800 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Resumen del Período
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {(() => {
                                    const stats = calculateStats(filteredAndSortedHistory);
                                    return (
                                        <>
                                            <div className="p-4 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                                                <div className="text-sm text-blue-800 dark:text-blue-300">Total Movimientos</div>
                                                <div className="text-2xl font-bold text-blue-900 dark:text-blue-200">{stats.totalMovements}</div>
                                            </div>
                                            <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/50">
                                                <div className="text-sm text-green-800 dark:text-green-300">Total Entradas</div>
                                                <div className="text-2xl font-bold text-green-900 dark:text-green-200">{stats.totalEntradas}</div>
                                            </div>
                                            <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900/50">
                                                <div className="text-sm text-red-800 dark:text-red-300">Total Salidas</div>
                                                <div className="text-2xl font-bold text-red-900 dark:text-red-200">{stats.totalSalidas}</div>
                                            </div>
                                            <div className="p-4 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                                                <div className="text-sm text-purple-800 dark:text-purple-300">Ítems Afectados</div>
                                                <div className="text-2xl font-bold text-purple-900 dark:text-purple-200">{stats.itemsMovidos}</div>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    )}

                    {/* Registros diarios */}
                    <div className="bg-white rounded-lg shadow dark:bg-gray-800">
                        {Object.entries(groupedHistory).length > 0 ? (
                            Object.entries(groupedHistory).map(([date, data]) => (
                                <div key={date} className="border-b border-gray-200 dark:border-gray-700 last:border-0">
                                    {/* Encabezado del día con resumen */}
                                    <div className="p-4 bg-gray-50 dark:bg-gray-700">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                            <h3 className="font-semibold text-gray-900 dark:text-white">{date}</h3>
                                            <div className="mt-2 sm:mt-0 flex space-x-4 text-sm">
                                                <span className="text-green-600 dark:text-green-400">
                                                    Entradas: {data.stats.entradas}
                                                </span>
                                                <span className="text-red-600 dark:text-red-400">
                                                    Salidas: {data.stats.salidas}
                                                </span>
                                                <span className="text-gray-600 dark:text-gray-400">
                                                    Movimientos: {data.stats.totalMovements}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Resumen por categoría e ítem */}
                                        <div className="mt-3 space-y-2">
                                            {Object.entries(data.summary).map(([itemName, info]) => (
                                                <div key={itemName} className="p-3 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                                        <div>
                                                            <h4 className="font-medium text-gray-900 dark:text-white">{itemName}</h4>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                {info.categoria}
                                                            </p>
                                                        </div>
                                                        <div className="mt-2 sm:mt-0 flex space-x-4 text-sm">
                                                            {info.entradas > 0 && (
                                                                <span className="text-green-600 dark:text-green-400">
                                                                    +{info.entradas}
                                                                </span>
                                                            )}
                                                            {info.salidas > 0 && (
                                                                <span className="text-red-600 dark:text-red-400">
                                                                    -{info.salidas}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {/* Detalles de movimientos */}
                                                    <div className="mt-2 space-y-1">
                                                        {info.detalles.map((detalle, idx) => (
                                                            <div key={idx} className="text-sm flex justify-between items-center">
                                                                <div className="flex items-center space-x-2">
                                                                    <span className="text-gray-500 dark:text-gray-400">{detalle.hora}</span>
                                                                    <span className={detalle.tipo === 'entrada' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                                                        {detalle.tipo === 'entrada' ? '+' : '-'}{detalle.cantidad}
                                                                    </span>
                                                                    {detalle.motivo && (
                                                                        <span className="text-gray-600 dark:text-gray-400">
                                                                            - {detalle.motivo}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <span className="text-gray-500 dark:text-gray-400 text-xs">
                                                                    {detalle.usuario}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                No hay registros para el período seleccionado
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [history, setHistory] = useState([]);
    const [activeView, setActiveView] = useState('dashboard');
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem('theme');
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            return savedTheme === 'dark' || (!savedTheme && prefersDark);
        }
        return false;
    });
    
    const [criticalStockItems, setCriticalStockItems] = useState([]);
    const [showCriticalAlert, setShowCriticalAlert] = useState(false);
    
    // Función para inicializar datos una sola vez
    const initializeData = useCallback(async () => {
        await seedDatabase();
    }, []);    useEffect(() => {
        initializeData();
        
        if (typeof window !== 'undefined') {
            const root = window.document.documentElement;
            if (isDarkMode) {
                root.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                root.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }

            // Actualizamos el color del tema en meta tags
            const metaThemeColor = document.querySelector('meta[name="theme-color"]');
            if (metaThemeColor) {
                metaThemeColor.setAttribute('content', isDarkMode ? '#1f2937' : '#ffffff');
            }
        }
    }, [isDarkMode, initializeData]);
    
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribeAuth();
    }, []);
    
    useEffect(() => {
        if (user) {
            const unsubItems = onSnapshot(collection(db, 'items'), (snapshot) => {
                const itemsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setItems(itemsList);
                
                const critical = itemsList.filter(item => item.quantity <= item.criticalThreshold);
                if (critical.length > 0 && critical.some(c => !criticalStockItems.find(i => i.id === c.id))) {
                    setCriticalStockItems(critical);
                    setShowCriticalAlert(true);
                }
            });
            
            const unsubCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
                const catList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setCategories(catList);
            });

            const unsubHistory = onSnapshot(collection(db, 'history'), (snapshot) => {
                const historyList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setHistory(historyList);
            });

            return () => {
                unsubItems();
                unsubCategories();
                unsubHistory();
            };
        }
    }, [user, criticalStockItems]);

    const handleLogout = async () => {
        await signOut(auth);
        setUser(null);
        setActiveView('dashboard');
    };

    const handleSaveItem = async (itemData, itemId) => {
        const itemRef = itemId ? doc(db, 'items', itemId) : doc(collection(db, 'items'));
        const isNewItem = !itemId;

        const historyData = {
            itemName: itemData.name,
            type: isNewItem ? 'creación' : 'edición',
            quantityChanged: isNewItem ? itemData.quantity : null,
            userEmail: user.email,
            timestamp: serverTimestamp()
        };

        if (itemId) {
            await updateDoc(itemRef, { ...itemData, lastModified: serverTimestamp() });
        } else {
            await setDoc(itemRef, { ...itemData, lastModified: serverTimestamp() });
        }
        await addDoc(collection(db, "history"), historyData);
    };

    const handleDeleteItem = async (itemId) => {
        await deleteDoc(doc(db, 'items', itemId));
    };      const handleUpdateStock = async (itemId, newQuantity, movementType, quantityChanged, motivo = '') => {
        const itemRef = doc(db, 'items', itemId);
        const item = items.find(i => i.id === itemId);
        
        await updateDoc(itemRef, {
            quantity: newQuantity,
            lastModified: serverTimestamp()
        });

        const now = new Date();
        const historyData = {
            itemId: itemId,
            itemName: item.name,
            itemCode: item.code,
            category: item.category,
            type: movementType,
            quantityBefore: item.quantity,
            quantityAfter: newQuantity,
            quantityChanged: quantityChanged,
            userEmail: user.email,
            timestamp: serverTimestamp(),
            motivo: motivo,
            fecha: now.toISOString().split('T')[0], // Formato YYYY-MM-DD para mejor filtrado
            hora: now.toLocaleTimeString(),
            year: now.getFullYear(),
            month: now.getMonth() + 1,
            day: now.getDate(),
            weekNumber: Math.ceil((now.getDate() + new Date(now.getFullYear(), now.getMonth(), 1).getDay()) / 7)
        };
        await addDoc(collection(db, "history"), historyData);
    };


    if (loading) {
        return <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900"><div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div></div>;
    }

    if (!user) {
        return <Login onLoginSuccess={() => setLoading(true)} />;
    }
    
    const Sidebar = () => (
        <div className="flex flex-col justify-between w-64 p-4 bg-white shadow-lg dark:bg-gray-800">
            <div>                <div className="mb-10">
                    <img 
                        src="https://static.wixstatic.com/media/1831cb_2d8491304a02448cb1751c82852750ff~mv2.png/v1/fill/w_148,h_27,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Logotipo%20MisTatas%20blanco.png"
                        alt="Mistatas Logo"
                        className="h-8 w-auto"
                    />
                </div>
                <nav className="space-y-2">
                    <button onClick={() => setActiveView('dashboard')} className={`flex items-center w-full px-4 py-3 space-x-3 rounded-lg ${activeView === 'dashboard' ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                        <CheckCircle className="w-6 h-6"/>
                        <span>Dashboard</span>
                    </button>
                    <button onClick={() => setActiveView('inventory')} className={`flex items-center w-full px-4 py-3 space-x-3 rounded-lg ${activeView === 'inventory' ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                        <Box className="w-6 h-6"/>
                        <span>Inventario</span>
                    </button>
                    <button onClick={() => setActiveView('history')} className={`flex items-center w-full px-4 py-3 space-x-3 rounded-lg ${activeView === 'history' ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                        <History className="w-6 h-6"/>
                        <span>Historial</span>
                    </button>
                </nav>
            </div>
            <div className="space-y-2">                 <button 
                    onClick={() => setIsDarkMode(!isDarkMode)} 
                    className="flex items-center w-full px-4 py-3 space-x-3 text-gray-600 rounded-lg dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                    aria-label={`Cambiar a modo ${isDarkMode ? 'claro' : 'oscuro'}`}
                >
                    {isDarkMode ? 
                        <Sun className="w-6 h-6 transition-transform duration-200 rotate-0"/> : 
                        <Moon className="w-6 h-6 transition-transform duration-200 rotate-0"/>
                    }
                    <span className="transition-colors duration-200">Modo {isDarkMode ? 'Claro' : 'Oscuro'}</span>
                </button>
                <button onClick={handleLogout} className="flex items-center w-full px-4 py-3 space-x-3 text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30">
                    <LogOut className="w-6 h-6"/>
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </div>
    );
      return (
        <div className="min-h-screen dark:bg-gray-900 transition-colors duration-200">
            <div className={`flex h-screen bg-gray-100 dark:bg-gray-900 font-sans`}>
                <Sidebar />
                <main className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
                    {activeView === 'dashboard' && <Dashboard items={items} onNavigate={setActiveView} />}
                    {activeView === 'inventory' && <InventoryList items={items} categories={categories} onSave={handleSaveItem} onDelete={handleDeleteItem} onUpdateStock={handleUpdateStock} itemsCount={items.length} />}
                    {activeView === 'history' && <HistoryLog history={history} />}
                </main>
                {showCriticalAlert && <CriticalStockAlert items={criticalStockItems} onClose={() => setShowCriticalAlert(false)} />}
            </div>
        </div>
    );
}
