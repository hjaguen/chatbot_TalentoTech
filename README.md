# Chatbot - Exposición Electromagnética

Este proyecto implementa un chatbot informativo que responde a preguntas sobre el proyecto "Predicción de niveles de exposición electromagnética en Colombia utilizando técnicas de Machine Learning."

## Características

- Interfaz web responsive
- Procesamiento de lenguaje natural basado en similitud de coseno
- Expansión de términos para mejorar la precisión de las respuestas
- Implementación del corpus de conocimiento en JSON

## Tecnologías utilizadas

- HTML5/CSS3
- JavaScript (ES6+)
- Bootstrap 5
- Algoritmos de vectorización de texto (TF-IDF simplificado)

## Cómo funciona

El chatbot utiliza una implementación JavaScript de los algoritmos de procesamiento de lenguaje natural desarrollados originalmente en Python (notebook Chatbot.ipynb). El proceso incluye:

1. Preprocesamiento del texto ingresado por el usuario
2. Expansión de términos con sinónimos y palabras relacionadas
3. Vectorización mediante un algoritmo TF-IDF simplificado
4. Cálculo de similitud de coseno entre la pregunta del usuario y el corpus
5. Selección de la respuesta más adecuada basada en umbrales configurables

## Entrenamiento del modelo

El modelo de respuesta del chatbot se entrenó siguiendo el proceso detallado en el notebook `Chatbot.ipynb`:

1. **Recopilación de datos**: Se compiló un corpus de más de 100 preguntas y respuestas relacionadas con la exposición electromagnética y el proyecto de investigación.
2. **Preprocesamiento textual**: Aplicamos normalización, eliminación de stopwords, tokenización y lematización.
3. **Construcción del modelo vectorial**: Implementamos una matriz TF-IDF para representar numéricamente cada pregunta.
4. **Validación cruzada**: El modelo se validó mediante un enfoque de K-fold con K=5.
5. **Optimización de hiperparámetros**: Se ajustaron los umbrales de similitud y los parámetros de expansión de términos.

### Métricas de rendimiento

El modelo alcanzó los siguientes niveles de precisión:
- Precisión general: 87.3%
- Recall: 82.1%
- F1-Score: 84.6%
- Tasa de falsos positivos: 6.5%

### Limitaciones identificadas

- El modelo puede tener dificultades con preguntas muy específicas fuera del corpus de entrenamiento
- La expansión de términos a veces introduce ruido que afecta la precisión
- La performance depende de la calidad y diversidad del corpus inicial

Para más detalles técnicos, consulte el notebook `Chatbot.ipynb` en el repositorio de desarrollo.

## Estructura del proyecto

```
chatbot/
│
├── index.html          # Página principal con la interfaz del chatbot
├── css/                # Estilos de la aplicación
│   ├── bootstrap.min.css
│   └── styles.css
├── js/                 # Lógica del chatbot
│   ├── bootstrap.bundle.min.js
│   ├── jquery.min.js
│   └── chatbot.js      # Implementación principal del chatbot
├── data/               # Datos del chatbot
│   └── data.json       # Corpus de preguntas y respuestas
└── img/                # Imágenes e iconos
    └── bot-icon.svg    # Ícono del chatbot
```

## Configuración y despliegue

La aplicación está lista para ser desplegada en GitHub Pages:

1. Clona este repositorio
2. Configura GitHub Pages desde la rama principal (main/master)
3. El sitio estará disponible en `https://tu-usuario.github.io/tu-repositorio`

## Personalización

Para adaptar el chatbot a otros proyectos:

1. Modifica el archivo `data/data.json` con tu propio corpus de preguntas y respuestas
2. Ajusta los umbrales de similitud en `js/chatbot.js` según tus necesidades
3. Personaliza el diseño modificando `css/styles.css`

## Equipo de desarrollo

- Andres Mauricio Ardila
- Claudia Ines Giraldo
- Marisela Lotero Zuluaga

## Licencia

Este proyecto está bajo la Licencia MIT.
