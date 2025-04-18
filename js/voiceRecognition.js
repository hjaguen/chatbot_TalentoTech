/**
 * Voice Recognition - Módulo para integrar reconocimiento de voz en el chatbot
 * Utiliza la Web Speech API para convertir voz a texto
 */

(function() {
    // Comprobamos si el navegador soporta reconocimiento de voz
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.warn("Tu navegador no soporta reconocimiento de voz. Intenta con Chrome o Edge.");
        return;
    }

    // Variables
    let isListening = false;
    let recognition;
    let micButton;
    let userInput;

    // Inicialización cuando DOM esté cargado
    document.addEventListener('DOMContentLoaded', initialize);

    function initialize() {
        // Referencias a elementos DOM
        micButton = document.getElementById('mic-button');
        userInput = document.getElementById('user-input');

        if (!micButton || !userInput) {
            console.error("No se encontraron los elementos necesarios en el DOM");
            return;
        }

        // Configuración del objeto de reconocimiento
        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.lang = 'es-ES';
        recognition.continuous = false;
        recognition.interimResults = false;
        
        // Eventos del reconocimiento de voz
        setupRecognitionEvents();
        
        // Eventos de UI
        micButton.addEventListener('click', toggleListening);
    }

    function setupRecognitionEvents() {
        // Evento cuando se detecta un resultado de voz
        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            userInput.value = transcript;
            
            // Opcional: enviar automáticamente después de reconocer la voz
            // document.getElementById('chat-button').click();
        };

        // Evento cuando termina el reconocimiento
        recognition.onend = function() {
            stopListening();
        };

        // Evento si hay un error
        recognition.onerror = function(event) {
            console.error("Error en reconocimiento de voz:", event.error);
            stopListening();
            
            // Mostrar mensaje al usuario según el error
            if (event.error === 'no-speech') {
                alert("No se detectó ninguna voz. Intenta de nuevo.");
            } else if (event.error === 'audio-capture') {
                alert("No se pudo acceder al micrófono. Verifica la configuración de tu dispositivo.");
            } else if (event.error === 'not-allowed') {
                alert("El acceso al micrófono fue denegado. Permite el acceso en la configuración de tu navegador.");
            }
        };
    }

    function toggleListening() {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    }

    function startListening() {
        try {
            recognition.start();
            isListening = true;
            micButton.classList.add('listening');
            
            // Cambiamos el ícono a uno de "stop" (requiere Font Awesome)
            const iconElement = micButton.querySelector('i');
            if (iconElement) {
                iconElement.className = 'fas fa-stop';
            }
            
            // Opcional: mostrar indicador visual o mensaje
            userInput.placeholder = "Escuchando...";
        } catch (e) {
            console.error("Error al iniciar reconocimiento:", e);
        }
    }

    function stopListening() {
        try {
            recognition.stop();
        } catch (e) {
            console.error("Error al detener reconocimiento:", e);
        }
        
        isListening = false;
        micButton.classList.remove('listening');
        
        // Restaurar icono
        const iconElement = micButton.querySelector('i');
        if (iconElement) {
            iconElement.className = 'fas fa-microphone';
        }
        
        // Restaurar placeholder
        userInput.placeholder = "Escribe tu pregunta aquí...";
    }

    // Exportamos funciones para uso global si es necesario
    window.voiceRecognition = {
        start: startListening,
        stop: stopListening,
        toggle: toggleListening
    };
})();