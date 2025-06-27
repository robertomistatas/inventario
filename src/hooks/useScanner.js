import { useState, useEffect } from 'react';

export const useScanner = (onScan) => {
    const [isListening, setIsListening] = useState(false);
    const [buffer, setBuffer] = useState('');
    const [lastKeyTime, setLastKeyTime] = useState(Date.now());

    useEffect(() => {
        if (!isListening) return;

        const handleKeyPress = (event) => {
            const currentTime = Date.now();
            
            // Si hay más de 50ms entre teclas, reinicia el buffer (típico en escáneres)
            if (currentTime - lastKeyTime > 50) {
                setBuffer('');
            }
            setLastKeyTime(currentTime);

            // Ignora teclas de control excepto Enter
            if (event.key.length === 1 || event.key === 'Enter') {
                if (event.key === 'Enter') {
                    // Procesa el código escaneado
                    if (buffer.length > 0) {
                        onScan(buffer);
                        setBuffer('');
                    }
                } else {
                    setBuffer(prev => prev + event.key);
                }
                event.preventDefault();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isListening, buffer, lastKeyTime, onScan]);

    return {
        startListening: () => setIsListening(true),
        stopListening: () => setIsListening(false),
        isListening
    };
};
