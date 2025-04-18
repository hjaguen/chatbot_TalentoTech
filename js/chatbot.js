// Chatbot.js - Implementación web del chatbot 
// Basado en el notebook Chatbot.ipynb

// Configuración del chatbot
const config = {
    threshold: 0.28,
    mode: "adaptativo",
    debugMode: false
};

// Cargar corpus de datos
let corpus = null;
let questions = [];
let answers = [];

// Función para cargar el corpus desde data.json
async function loadCorpus() {
    try {
        // Cambio: usar una ruta relativa desde la raíz del sitio en lugar de una ruta relativa
        const response = await fetch('./data/data.json');
        corpus = await response.json();
        
        // Preparar las preguntas y respuestas para vectorización
        corpus.faq.forEach(item => {
            questions.push(item.question.toLowerCase());
            answers.push(item.answer);
        });
        
        console.log('Corpus cargado con éxito:', corpus.faq.length, 'pares de preguntas/respuestas');
        return true;
    } catch (error) {
        console.error('Error al cargar el corpus:', error);
        // Mostrar más detalles sobre el error para facilitar la depuración
        console.error('Detalles del error:', error.message);
        return false;
    }
}

// Sinónimos y términos relacionados (basado en el diccionario del notebook)
const terminos_ampliados = {
    // Términos relacionados con el proyecto
    "título": ["nombre", "denominación", "tema", "proyecto"],
    "proyecto": ["estudio", "investigación", "trabajo", "iniciativa"],
    "exposición": ["radiación", "emisión", "campos"],
    "electromagnética": ["electromagnetismo", "electromagnético", "radiación", "EMF"],
    "machine learning": ["ml", "aprendizaje automático", "aprendizaje de máquina", "ia", "inteligencia artificial"],
    
    // Términos relacionados con objetivos
    "objetivos": ["metas", "propósitos", "fines", "finalidad"],
    "general": ["principal", "primario", "central"],
    "específicos": ["secundarios", "concretos", "particulares"],
    
    // Términos relacionados con modelos
    "modelos": ["algoritmos", "técnicas", "métodos", "enfoques"],
    "regresión": ["predicción", "estimación"],
    "árboles": ["decision trees", "árbol de decisión"],
    "random forest": ["bosque aleatorio", "rf"],
    "xgboost": ["gradient boosting", "boosting"],
    
    // Términos relacionados con datos
    "datos": ["información", "dataset", "conjunto de datos", "fuentes"],
    "variables": ["características", "features", "atributos", "parámetros"],
    
    // Términos relacionados con el problema
    "problema": ["desafío", "reto", "cuestión", "dificultad"],
    "planteamiento": ["formulación", "definición", "descripción"],
    
    // Términos relacionados con beneficios
    "beneficios": ["ventajas", "utilidad", "provecho", "aportes"],
    "ventajas": ["beneficios", "fortalezas", "puntos fuertes"],
    
    // Términos relacionados con conclusiones
    "conclusiones": ["resultados", "hallazgos", "descubrimientos", "inferencias"],
    
    // Añadir términos específicos para participantes
    "participantes": ["integrantes", "miembros", "colaboradores", "personas", "equipo", "autores", "investigadores"],
    "equipo": ["grupo", "personal", "staff", "integrantes", "miembros", "participantes"]
};

// Función para expandir términos, similar a la del notebook
function expandirTerminos(texto) {
    // Convertir a minúsculas para comparación
    let textoLower = texto.toLowerCase();
    let textoExpandido = textoLower;
    
    // Buscar términos clave en el texto
    Object.keys(terminos_ampliados).forEach(termino => {
        if (textoLower.includes(termino)) {
            // Añadir términos relacionados al texto expandido
            const terminosAdicionales = terminos_ampliados[termino].join(' ');
            textoExpandido += ' ' + terminosAdicionales;
        }
    });
    
    return textoExpandido;
}

// Preprocesamiento de texto mejorado con expansión de términos
function preprocessText(text) {
    // Convertir a minúsculas y eliminar caracteres especiales
    let processed = text.toLowerCase().replace(/[^\w\sáéíóúüñ]/gi, '');
    
    // Expansión de términos
    processed = expandirTerminos(processed);
    
    return processed;
}

// Tokenizar texto (similar a word_tokenize)
function tokenize(text) {
    return text.split(/\s+/).filter(token => token.length > 0);
}

// Calcular similitud coseno entre dos vectores
function cosineSimilarity(vecA, vecB) {
    const dotProduct = Object.keys(vecA).reduce((sum, key) => {
        return sum + (vecA[key] * (vecB[key] || 0));
    }, 0);
    
    const magnitudeA = Math.sqrt(Object.values(vecA).reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(Object.values(vecB).reduce((sum, val) => sum + val * val, 0));
    
    return dotProduct / (magnitudeA * magnitudeB) || 0;
}

// Convertir texto a vector TF-IDF simplificado
function textToVector(text, allTexts) {
    const tokens = tokenize(preprocessText(text));
    const vector = {};
    
    tokens.forEach(token => {
        // Contar ocurrencias del token en el texto actual
        vector[token] = (vector[token] || 0) + 1;
    });
    
    // Aplicar TF-IDF simplificado
    Object.keys(vector).forEach(token => {
        // Calcular cuántos documentos contienen este token
        const docsWithToken = allTexts.filter(t => t.includes(token)).length;
        
        // IDF: log(totalDocs / docsWithToken)
        const idf = Math.log(allTexts.length / (docsWithToken || 1));
        
        // TF: frecuencia del término en el documento
        const tf = vector[token];
        
        // TF-IDF
        vector[token] = tf * idf;
    });
    
    return vector;
}

// Buscar la respuesta más similar (versión de buscar_respuesta_semantica)
function findBestResponse(userQuestion) {
    // Procesar la pregunta del usuario
    const processedQuestion = preprocessText(userQuestion);
    
    // Crear una lista con todas las preguntas del corpus más la del usuario
    const allTexts = [...questions, processedQuestion];
    
    // Vectorizar todas las preguntas
    const vectors = allTexts.map(text => textToVector(text, allTexts));
    
    // Calcular similitudes entre la pregunta del usuario y todas las preguntas del corpus
    const similarities = [];
    for (let i = 0; i < questions.length; i++) {
        similarities.push(cosineSimilarity(vectors[vectors.length-1], vectors[i]));
    }
    
    // Encontrar el índice de la pregunta más similar
    const maxIndex = similarities.indexOf(Math.max(...similarities));
    const maxSimilarity = similarities[maxIndex];
    
    // Aplicar umbral según configuración
    if (config.debugMode) {
        console.log(`Pregunta más similar: "${questions[maxIndex]}" con similitud: ${maxSimilarity}`);
    }
    
    if (maxSimilarity < config.threshold) {
        return "Lo siento, no tengo una respuesta para esa pregunta. Por favor, intenta con otra consulta.";
    }
    
    // Devolver la respuesta correspondiente
    return answers[maxIndex];
}

// Función para saludos
function greetingResponse(text) {
    const greetings = ["hola", "buenas", "saludos", "qué tal", "hey", "buenos días", "ayuda"];
    const greetingReplies = [
        "Hola, ¿cómo puedo ayudarte?",
        "Hola, ¿en qué puedo asistirte?",
        "Hola, dime cómo puedo ayudarte."
    ];
    
    for (const word of text.split(' ')) {
        if (greetings.includes(word.toLowerCase())) {
            return greetingReplies[Math.floor(Math.random() * greetingReplies.length)];
        }
    }
    
    return null;
}

// Función para despedidas
function farewellResponse() {
    const farewells = [
        "Nos vemos, espero haberte ayudado.",
        "Hasta pronto, ¡cuídate!",
        "Chao, que tengas un buen día."
    ];
    
    return farewells[Math.floor(Math.random() * farewells.length)];
}

// Función principal que maneja las respuestas del chatbot
async function getBotResponse(userInput) {
    // Asegurarse de que el corpus esté cargado
    if (!corpus) {
        const loaded = await loadCorpus();
        if (!loaded) {
            return "No puedo responder en este momento. Hay un problema con mi base de conocimiento.";
        }
    }
    
    // Corrección ortográfica básica (simplificada de corregir_entrada)
    const userText = userInput.toLowerCase().trim();
    
    // Verificar si es despedida
    if (['salir', 'adiós', 'adios', 'hasta luego', 'bye', 'chao'].includes(userText)) {
        return farewellResponse();
    }
    
    // Verificar si es agradecimiento
    if (['gracias', 'muchas gracias', 'te lo agradezco'].includes(userText)) {
        return "No hay de qué.";
    }
    
    // Verificar si es ayuda
    if (userText === 'ayuda') {
        return "Puedes preguntarme sobre los participantes, objetivos, conclusiones, modelos, etc. Si quieres salir, escribe 'salir'.";
    }
    
    // Verificar si es un saludo
    const greetingReply = greetingResponse(userText);
    if (greetingReply) {
        return greetingReply;
    }
    
    // Buscar la mejor respuesta
    return findBestResponse(userText);
}

document.addEventListener("DOMContentLoaded", function() {
    const userInputField = document.getElementById("user-input");
    const chatButton = document.getElementById("chat-button");
    const chatWindow = document.getElementById("chat-window");
    const micButton = document.getElementById("mic-button");

    // Función para enviar mensaje
    async function sendMessage() {
        const userInput = userInputField.value;
        if (userInput) {
            const userMessage = document.createElement("div");
            userMessage.classList.add("user-message");
            userMessage.textContent = userInput;
            chatWindow.appendChild(userMessage);

            // Mostrar indicador de carga mientras se procesa la respuesta
            const loadingIndicator = document.createElement("div");
            loadingIndicator.classList.add("bot-message");
            loadingIndicator.innerHTML = '<span class="loading"></span> Procesando...';
            chatWindow.appendChild(loadingIndicator);
            
            // Desplazarse al final del chat
            chatWindow.scrollTop = chatWindow.scrollHeight;

            // Obtener respuesta del bot
            const botResponse = await getBotResponse(userInput);
            
            // Reemplazar indicador de carga con la respuesta
            chatWindow.removeChild(loadingIndicator);
            
            const botMessage = document.createElement("div");
            botMessage.classList.add("bot-message");
            botMessage.textContent = botResponse;
            chatWindow.appendChild(botMessage);

            userInputField.value = ""; // Limpiar campo de entrada
            chatWindow.scrollTop = chatWindow.scrollHeight; // Desplazarse al final
        }
    }

    // Evento de click para el botón de enviar
    chatButton.addEventListener("click", sendMessage);

    // Evento de tecla para permitir enviar con Enter
    userInputField.addEventListener("keypress", function(e) {
        if (e.key === "Enter") {
            sendMessage();
        }
    });
    
    // Integración con reconocimiento de voz
    if (window.voiceRecognition) {
        // Agregar evento para enviar automáticamente después de reconocer la voz
        if (window.SpeechRecognition || window.webkitSpeechRecognition) {
            const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            recognition.onresult = function(event) {
                userInputField.value = event.results[0][0].transcript;
                // Pequeña pausa antes de enviar para que el usuario vea lo que se reconoció
                setTimeout(sendMessage, 500);
            };
            
            // Reemplazar el evento click del micrófono
            micButton.addEventListener("click", function() {
                if (window.voiceRecognition) {
                    window.voiceRecognition.toggle();
                }
            });
        }
    }
});