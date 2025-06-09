import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg dark:bg-gray-800">
                <div className="text-center">
                    <Package className="w-16 h-16 mx-auto text-blue-600 dark:text-blue-500" />
                    <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">Mistatas Inventario</h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Gestión inteligente de dispositivos</p>
                </div>
                <form className="space-y-6" onSubmit={handleLogin}>
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full px-3 py-2 mt-1 text-gray-900 bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                            placeholder="usuario@mistatas.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña</label>
                        <input
                            type="password"
                            required
                            className="w-full px-3 py-2 mt-1 text-gray-900 bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    {error && <p className="text-sm text-center text-red-500">{error}</p>}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        {isLoading ? 'Ingresando...' : 'Ingresar'}
                    </button>
                </form>
                 <div className="text-center">
                    <button
                        onClick={handleDemoLogin}
                        disabled={isLoading}
                        className="w-full py-2 mt-2 font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                    >
                        Entrar como Invitado
                    </button>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Usa "test@mistatas.com" y "123456" para ingresar.</p>
                </div>
            </div>
        </div>
    );
};

const DashboardCard = ({ title, value, icon, color }) => {
    const colorClasses = {
        green: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        red: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    };
    return (
        <div className={`p-6 rounded-xl shadow-md flex items-center space-x-4 ${colorClasses[color]}`}>
            {icon}
            <div>
                <p className="text-sm font-medium">{title}</p>
                <p className="text-2xl font-bold">{value}</p>
            </div>
        </div>
    );
};

const Dashboard = ({ items, onNavigate }) => {
    const summary = useMemo(() => {
        const totalItems = items.length;
        const lowStock = items.filter(item => item.quantity > item.criticalThreshold && item.quantity <= item.criticalThreshold * 1.5).length;
        const criticalStock = items.filter(item => item.quantity <= item.criticalThreshold).length;
        const sufficientStock = totalItems - lowStock - criticalStock;
        return { totalItems, lowStock, criticalStock, sufficientStock };
    }, [items]);

    return (
        <div className="p-6 space-y-6">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <DashboardCard title="Stock Suficiente" value={summary.sufficientStock} icon={<CheckCircle className="w-10 h-10" />} color="green" />
                <DashboardCard title="Stock Bajo" value={summary.lowStock} icon={<AlertTriangle className="w-10 h-10" />} color="yellow" />
                <DashboardCard title="Stock Crítico" value={summary.criticalStock} icon={<AlertTriangle className="w-10 h-10" />} color="red" />
                <DashboardCard title="Total de Ítems" value={summary.totalItems} icon={<Box className="w-10 h-10" />} color="blue" />
            </div>
             <div className="mt-8">
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Accesos Rápidos</h3>
                <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-3">
                    <button onClick={() => onNavigate('inventory')} className="flex items-center justify-center p-6 space-x-3 text-lg font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600">
                        <Box className="w-6 h-6"/>
                        <span>Ver Inventario</span>
                    </button>
                    <button onClick={() => onNavigate('history')} className="flex items-center justify-center p-6 space-x-3 text-lg font-semibold text-gray-700 bg-gray-200 rounded-lg shadow-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
                        <History className="w-6 h-6"/>
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

    const handleSave = () => {
        const newQuantity = movementType === 'salida' 
            ? item.quantity - change
            : item.quantity + change;
            
        if (newQuantity < 0) {
            alert("La cantidad no puede ser negativa.");
            return;
        }
        
        onSave(item.id, newQuantity, movementType, change);
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
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cantidad a modificar</label>
                        <input type="number" value={change} onChange={(e) => setChange(Math.abs(parseInt(e.target.value) || 0))} min="0" className="w-full px-3 py-2 mt-1 text-gray-900 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600" />
                    </div>
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

    const itemsPerPage = 10;

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
    };

    return (
        <div className="p-6">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Inventario General</h2>
            
            <div className="grid grid-cols-1 gap-4 my-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="relative">
                    <Search className="absolute w-5 h-5 text-gray-400 top-3 left-3" />
                    <input type="text" placeholder="Buscar por nombre o código..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full py-2 pl-10 pr-4 text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"/>
                </div>
                 <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="w-full px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600">
                    <option value="all">Todas las Categorías</option>
                    {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                </select>
                 <select value={filterStock} onChange={e => setFilterStock(e.target.value)} className="w-full px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600">
                    <option value="all">Todo el Stock</option>
                    <option value="sufficient">Suficiente</option>
                    <option value="low">Bajo</option>
                    <option value="critical">Crítico</option>
                </select>
                <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="flex items-center justify-center px-4 py-2 space-x-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">
                    <PlusCircle className="w-5 h-5" />
                    <span>Agregar Ítem</span>
                </button>
            </div>

            <div className="overflow-x-auto bg-white rounded-lg shadow dark:bg-gray-800">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            {['código', 'nombre', 'categoría', 'cantidad', 'umbral crítico', 'estado', 'última mod.', 'acciones'].map(header => {
                                const key = {
                                  'código': 'code', 'nombre': 'name', 'categoría': 'category', 'cantidad': 'quantity', 'umbral crítico': 'criticalThreshold', 'estado': 'status', 'última mod.': 'lastModified'
                                }[header] || '';
                                return (
                                    <th key={header} scope="col" className="px-6 py-3 cursor-pointer" onClick={() => key && requestSort(key)}>
                                        <div className="flex items-center">
                                            {header} {key && <SortIcon columnKey={key} />}
                                        </div>
                                    </th>
                                )
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedItems.map(item => (
                            <tr key={item.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td className="px-6 py-4 font-mono text-xs">{item.code}</td>
                                <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{item.name}</th>
                                <td className="px-6 py-4">{item.category}</td>
                                <td className="px-6 py-4 font-bold">{item.quantity}</td>
                                <td className="px-6 py-4">{item.criticalThreshold}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStockStatus(item).color}`}>{getStockStatus(item).text}</span>
                                </td>
                                <td className="px-6 py-4">{item.lastModified ? new Date(item.lastModified.toDate()).toLocaleDateString() : 'N/A'}</td>
                                <td className="px-6 py-4 space-x-2">
                                    <button onClick={() => setStockEditModal(item)} className="p-1 text-blue-600 rounded-full hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-gray-700" title="Editar Stock"><Edit className="w-4 h-4"/></button>
                                    <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="p-1 text-green-600 rounded-full hover:bg-green-100 dark:text-green-400 dark:hover:bg-gray-700" title="Editar Ítem"><PlusCircle className="w-4 h-4"/></button>
                                    <button onClick={() => window.confirm('¿Seguro que quieres eliminar este ítem?') && onDelete(item.id)} className="p-1 text-red-600 rounded-full hover:bg-red-100 dark:text-red-400 dark:hover:bg-gray-700" title="Eliminar Ítem"><Trash2 className="w-4 h-4"/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-between mt-4">
                 <span className="text-sm text-gray-700 dark:text-gray-400">
                    Mostrando {paginatedItems.length} de {filteredAndSortedItems.length} ítems
                </span>
                <div className="flex space-x-1">
                    <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md disabled:opacity-50 dark:bg-gray-700 dark:border-gray-600">Anterior</button>
                    <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">Página {currentPage} de {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md disabled:opacity-50 dark:bg-gray-700 dark:border-gray-600">Siguiente</button>
                </div>
            </div>

            {isModalOpen && <ItemModal item={editingItem} categories={categories} onSave={onSave} onClose={() => setIsModalOpen(false)} itemsCount={itemsCount} />}
            {stockEditModal && <EditStockModal item={stockEditModal} onSave={onUpdateStock} onClose={() => setStockEditModal(null)} />}
        </div>
    );
};


const HistoryLog = ({ history }) => {
    const sortedHistory = useMemo(() => {
        return [...history].sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());
    }, [history]);

    const getMovementStyle = (type) => {
        if (type === 'entrada') {
            return { text: 'Entrada', color: 'text-green-600 dark:text-green-400', symbol: '+' };
        }
        if (type === 'salida') {
            return { text: 'Salida', color: 'text-red-600 dark:text-red-400', symbol: '-' };
        }
        return { text: type.charAt(0).toUpperCase() + type.slice(1), color: 'text-gray-600 dark:text-gray-400', symbol: '•' };
    };

    return (
        <div className="p-6">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Historial de Movimientos</h2>
            <div className="mt-6 bg-white rounded-lg shadow dark:bg-gray-800">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {sortedHistory.map(log => {
                        const style = getMovementStyle(log.type);
                        return (
                            <li key={log.id} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                                <div className="flex items-center space-x-4">
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${style.color.replace('text', 'bg').replace('-600', '-100').replace('-400', '-900/50')}`}>
                                        <span className={`font-bold ${style.color}`}>{style.symbol}</span>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-white">{log.itemName}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Usuario: <span className="font-medium text-gray-700 dark:text-gray-300">{log.userEmail}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`font-semibold ${style.color}`}>
                                      {style.text} {log.type === 'entrada' || log.type === 'salida' ? `de ${log.quantityChanged}` : ''}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(log.timestamp.toDate()).toLocaleString()}</p>
                                </div>
                            </li>
                        )
                    })}
                </ul>
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
    const [isDarkMode, setIsDarkMode] = useState(false);
    
    const [criticalStockItems, setCriticalStockItems] = useState([]);
    const [showCriticalAlert, setShowCriticalAlert] = useState(false);
    
    // Función para inicializar datos una sola vez
    const initializeData = useCallback(async () => {
        await seedDatabase();
    }, []);

    useEffect(() => {
        initializeData();
        
        const html = document.querySelector('html');
        if (isDarkMode) {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
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
    };
    
    const handleUpdateStock = async (itemId, newQuantity, movementType, quantityChanged) => {
        const itemRef = doc(db, 'items', itemId);
        const item = items.find(i => i.id === itemId);
        
        await updateDoc(itemRef, {
            quantity: newQuantity,
            lastModified: serverTimestamp()
        });

        const historyData = {
            itemId: itemId,
            itemName: item.name,
            type: movementType,
            quantityChanged: quantityChanged,
            userEmail: user.email,
            timestamp: serverTimestamp()
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
            <div>
                <div className="flex items-center mb-10 space-x-3">
                     <Package className="w-10 h-10 text-blue-600 dark:text-blue-500"/>
                     <h1 className="text-xl font-bold text-gray-800 dark:text-white">Mistatas</h1>
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
            <div className="space-y-2">
                 <button onClick={() => setIsDarkMode(!isDarkMode)} className="flex items-center w-full px-4 py-3 space-x-3 text-gray-600 rounded-lg dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                    {isDarkMode ? <Sun className="w-6 h-6"/> : <Moon className="w-6 h-6"/>}
                    <span>Modo {isDarkMode ? 'Claro' : 'Oscuro'}</span>
                </button>
                <button onClick={handleLogout} className="flex items-center w-full px-4 py-3 space-x-3 text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30">
                    <LogOut className="w-6 h-6"/>
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </div>
    );
    
    return (
        <div className={`flex h-screen bg-gray-100 dark:bg-gray-900 font-sans ${isDarkMode ? 'dark' : ''}`}>
           <Sidebar />
            <main className="flex-1 overflow-y-auto">
                {activeView === 'dashboard' && <Dashboard items={items} onNavigate={setActiveView} />}
                {activeView === 'inventory' && <InventoryList items={items} categories={categories} onSave={handleSaveItem} onDelete={handleDeleteItem} onUpdateStock={handleUpdateStock} itemsCount={items.length} />}
                {activeView === 'history' && <HistoryLog history={history} />}
            </main>
            {showCriticalAlert && <CriticalStockAlert items={criticalStockItems} onClose={() => setShowCriticalAlert(false)} />}
        </div>
    );
}
