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
