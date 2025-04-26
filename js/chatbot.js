// Chatbot.js - Implementación web del chatbot 
// Basado en el notebook Chatbot.ipynb

// Configuración del chatbot
const config = {
    threshold: 0.28,
    mode: "adaptativo",
    debugMode: false,
    useExternalLLM: true,  // Habilitar el uso de LLM externo
    geminiAPIKey: "AIzaSyAel_ApU1CspuRaeqT0Z6jc0CblthtMlbE",  // Se debe configurar desde una variable de entorno o archivo seguro
    geminiModel: "gemini-1.5-flash-latest"  // Modelo de Gemini a utilizar
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
    "equipo": ["grupo", "personal", "staff", "integrantes", "miembros", "participantes"],
    "andres": ["mauricio", "ardila", "andres mauricio", "andres ardila", "mauricio ardila"],
    "claudia": ["ines", "giraldo", "claudia ines", "claudia giraldo", "ines giraldo"],
    "marisela": ["lotero", "zuluaga", "marisela lotero", "marisela zuluaga", "lotero zuluaga"],
    "darly": ["mildred", "delgado", "darly mildred", "darly delgado", "mildred delgado"]
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

// Modificar función findBestResponse para retornar también la similitud
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
        return {
            response: "Lo siento, no tengo una respuesta para esa pregunta. Por favor, intenta con otra consulta.",
            similarity: maxSimilarity
        };
    }
    
    // Devolver la respuesta correspondiente y su similitud
    return {
        response: answers[maxIndex],
        similarity: maxSimilarity
    };
}

// Función para consultar a Gemini API
async function askExternalLLM(question) {
    try {
        // Verificar si hay una clave API configurada
        if (!config.geminiAPIKey || config.geminiAPIKey === "") {
            console.warn("API Key para Gemini no configurada");
            return null;
        }
        
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:generateContent?key=${config.geminiAPIKey}`;
        
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [
                    {
                        role: "user",
                        parts: [
                            {
                                text: "Eres un asistente virtual que proporciona respuestas breves y concisas a preguntas generales. Limita tus respuestas a 2-3 oraciones. Aquí está mi pregunta: " + question
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 150,
                    topP: 0.95
                }
            })
        });
        
        const data = await response.json();
        
        // Manejar la respuesta de Gemini
        if (data.candidates && data.candidates.length > 0 && 
            data.candidates[0].content && 
            data.candidates[0].content.parts && 
            data.candidates[0].content.parts.length > 0) {
            return data.candidates[0].content.parts[0].text.trim();
        } else {
            console.error("No se recibió una respuesta válida de la API de Gemini:", data);
            return null;
        }
    } catch (error) {
        console.error("Error al consultar la API de Gemini:", error);
        return null;
    }
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
        return "Puedes preguntarme sobre los participantes, objetivos, conclusiones, modelos, etc. También puedo responder preguntas generales si están dentro de mi conocimiento. Si quieres salir, escribe 'salir'.";
    }
    
    // Verificar si es un saludo
    const greetingReply = greetingResponse(userText);
    if (greetingReply) {
        return greetingReply;
    }
    
    // Buscar la mejor respuesta en nuestro corpus
    const bestResponseResult = findBestResponse(userText);
    const { response, similarity } = bestResponseResult;
    
    // Si la respuesta no supera el umbral y está habilitado el LLM externo, intentar usarlo
    if (similarity < config.threshold && config.useExternalLLM) {
        try {
            const llmResponse = await askExternalLLM(userInput);
            if (llmResponse) {
                return llmResponse + "\n\n(Respuesta generada por Gemini)";
            }
        } catch (error) {
            console.error("Error al usar el LLM externo:", error);
        }
    }
    
    // Si no hay respuesta del LLM o está desactivado, devolver respuesta normal o mensaje de error
    return response;
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