# Tecnologías utilizadas
- **Node.js**: Entorno de ejecución JavaScript en el servidor.
- **Express.js**: Framework para construir aplicaciones web y APIs en Node.js.
- **MongoDB**: Base de datos NoSQL (con Mongoose como ODM).
- **Mongoose**: Librería para modelar objetos de MongoDB y realizar consultas.
- **Axios**: Cliente HTTP para realizar solicitudes desde el backend.
- **JWT (JSON Web Token)**: Para la autenticación y autorización de usuarios.
- **Jest**: Framework de pruebas unitarias y de integración.
- **Swagger**: Para generar documentación de la API automáticamente (usando swagger-ui-express y swagger-autogen).
- **dotenv**: Para cargar variables de entorno desde archivos .env.
- **Cors**: Middleware para habilitar solicitudes cross-origin.

# Descripción de la API REST del Microservicio de Catálogo de Libros
El microservicio de Catálogo de Libros expone una API RESTful que permite interactuar con los datos de los libros disponibles en la biblioteca digital. A continuación, se describe la estructura de los principales endpoints, junto con ejemplos de uso.

## Base URL
La API está disponible en la siguiente base URL:
[/api/v1/books]

***

## Endpoints para la gestión de libros en la biblioteca

### **1. Obtener todos los libros**
* **Método :** `GET`
* **PATH :** `/api/v1/books`
* **Descripción :** Devuelve una lista de libros según los filtros proporcionados. Si no se especifica ningún filtro, devuelve todos los libros.
* **Parámetros de consulta opcionales (se permiten combinar):** 
  * `?title= <string>`: Filtra por título.
  * `?publicationYear= <integer>`: Filtra por año de publicación.
  * `?category= <string>`: Filtra por categoría.
  * `?author= <string>`: Filtra por autor.
  * `?language= <string>`: Filtra por idioma.
  * `?featuredType= <string>`: Filtra por destacados.

* **Ejemplo de solicitud:**
```
GET /api/v1/books?author=bebi
```

* **Ejemplo de respuesta (200 OK):**
```
[
   {
        "isbn": "9788408194453",
        "title": "Memorias de una salvaje",
        "author": "Bebi Fernández",
        "publicationYear": 2018,
        "description": "España. Año 2017. Tras el asesinato de su padre, una chica de diecinueve años es obligada a compaginar sus estudios universitarios con el trabajo en la recepción de un club de alterne clandestino y a internarse en una de las mayores organizaciones criminales de Europa. La necesidad de defenderse la llevará hasta el club de boxeo de un joven al que la violencia de género también le ha marcado la vida. Pronto las luces de neón comenzarán a parpadear dentro de una historia donde nada es lo que parece.",
        "language": "es",
        "totalPages": 464,
        "categories": [
            "Crime novels",
            "Contemporary romance "
        ],
        "featuredType": "none",
        "downloadCount": 0,
        "totalRating": 0,
        "totalReviews": 0,
        "inReadingLists": 0,
        "coverImage": "https://covers.openlibrary.org/b/isbn/9788408194453-L.jpg"
    }
]
```

#### **Otras respuestas:**
  * 400 Bad request: Invalid query parameters provided.
  ```
  {
    "message": "Invalid query parameters provided.",
    "invalidParameters": [
      "invalidParam1",
      "invalidParam2"
    ]
  }
  ```
  * 401 Unathorized:
  ```
  {
    "message": "Token not provided."
  }
  ```
  * 403 Forbidden:
  ```
  {
    "message": "Invalid or expired token."
  }
  ```
  ```
  {
    "message": "Access denied: You do not have the necessary permissions."
  }
  ```
  * 404 Not Found: No books found for the given search criteria.
  ```
  {
    "message": "No books found for the given search criteria."
  }
  ```
  * 500 Internal Server Error: Unexpected server error occurred.
  ```
  {
    "message": "Unexpected server error occurred.",
    "error": "Ejemplo de mensaje de error: database connection failed."
  }
  ```

### **2. Obtener detalles de un libro por ISBN**
* **Método :** `GET`
* **PATH :** `/api/v1/books/isbn/{isbn}`
* **Descripción :** Devuelve la información completa de un libro específico.
* **Parámetros:** ISBN del libro en formato ISBN-10 o ISBN-13.
* **Ejemplo de solicitud:**
```
GET /api/v1/books/isbn/9788491293552
```
* **Ejemplo de respuesta (200 OK):**
```
{
   "isbn": "9788491293552",
   "title": "El cuco de cristal",
   "author": "Javier Castillo",
   "publicationYear": 2024,
    "description": "Nueva York, 2017. Cora Merlo, médico residente de primer año, sufre un infarto fulminante que la obliga a un trasplante de corazón. Aún convaleciente la joven recibe la visita de una extraña mujer con una enigmática oferta: pasar unos días en Steelville, un pequeño pueblo de interior, para conocer la vida de su hijo Charles, el donante de su corazón. Cora se adentra así en un hogar lleno de secretos, en un misterio que se extiende durante veinte años y en un pueblo hermético en el que, justo el día de su llegada, desaparece un bebé en un parque público.",
    "language": "es",
    "totalPages": 488,
    "categories": [
        "Thrillers",
        "Suspense"
    ],
    "featuredType": "bestSeller",
    "downloadCount": 2,
    "totalRating": 0,
    "totalReviews": 10,
    "inReadingLists": 2,
    "coverImage": "https://covers.openlibrary.org/b/isbn/9788491293552-L.jpg"
}
```

#### **Otras respuestas:**
  * 400 Bad request: Invalid ISBN format. Must be ISBN-10 or ISBN-13.
  ```
  {
    "error": "Invalid ISBN format. Must be ISBN-10 or ISBN-13."
  }
  ```
  * 401 Unathorized:
  ```
  {
    "message": "Token not provided."
  }
  ```
  * 403 Forbidden:
  ```
  {
    "message": "Invalid or expired token."
  }
  ```
  ```
  {
    "message": "Access denied: You do not have the necessary permissions."
  }
  ```
  * 404 Not Found: Book not found.
  ```
  {
    "message": "Book not found"
  }
  ```
  * 500 Internal Server Error: Unexpected server error occurred.
  ```
  {
    "message": "Unexpected server error occurred.",
    "error": "Ejemplo de mensaje de error: database connection failed."
  }
  ```

### **3. Obtener libros destacados**
* **Método :** `GET`
* **PATH :** `/api/v1/books/featured`
* **Descripción :** Devuelve los libros destacados cuyo tipo no sea «none».
* **Ejemplo de solicitud:**
```
GET /api/v1/books/featured
```
* **Ejemplo de respuesta (200 OK):**
```
[
    {
        "isbn": "9788408227120",
        "title": "La vida desnuda",
        "author": "Mónica Carrillo",
        "publicationYear": 2020,
        "description": "Una llamada de teléfono lo cambió todo. Cuando Gala emprende el viaje para despedirse de su abuela Rosario no puede imaginar que pronto descubrirá que nada es lo que parece en su familia: a pesar de las apariencias, o precisamente por ellas, todos tienen una vida pública que muestran al mundo, una vida privada reservada para unos pocos y una vida secreta que permanece oculta para todos. Poco a poco, Gala irá destapando las distintas capas que envuelven a sus padres, a su hermano Mauro y a su tía Julia. Y en la cima de tantos descubrimientos hallará aquello que siempre buscó y que se le resistía: el amor sin condiciones.",
        "language": "es",
        "totalPages": 288,
        "categories": [
            "Fiction"
        ],
        "featuredType": "awardWinner",
        "downloadCount": 0,
        "totalRating": 0,
        "totalReviews": 0,
        "inReadingLists": 0,
        "coverImage": "https://covers.openlibrary.org/b/isbn/9788408227120-L.jpg"
    }

    ...
]
```

#### **Otras respuestas:**
  * 401 Unathorized:
  ```
  {
    "message": "Token not provided."
  }
  ```
  * 403 Forbidden:
  ```
  {
    "message": "Invalid or expired token."
  }
  ```
  ```
  {
    "message": "Access denied: You do not have the necessary permissions."
  }
  ```
  * 404 Not Found: No featured books found.
  ```
  {
    "message": "No featured books found."
  }
  ```
  * 500 Internal Server Error: Unexpected server error occurred.
  ```
  {
    "message": "Unexpected server error occurred.",
    "error": "Ejemplo de mensaje de error: database connection failed."
  }
  ```

### **4. Obtener libros recientes**
* **Método :** `GET`
* **PATH :** `/api/v1/books/latest`
* **Descripción :** Devuelve los 10 libros más recientes, ordenados por año de publicación en orden descendente.
* **Ejemplo de solicitud:**
```
GET /api/v1/books/latest
```
* **Ejemplo de respuesta (200 OK):**
```
[
  {
        "isbn": "9788491293552",
        "title": "El cuco de cristal",
        "author": "Javier Castillo",
        "publicationYear": 2024,
        "description": "Nueva York, 2017. Cora Merlo, médico residente de primer año, sufre un infarto fulminante que la obliga a un trasplante de corazón. Aún convaleciente la joven recibe la visita de una extraña mujer con una enigmática oferta: pasar unos días en Steelville, un pequeño pueblo de interior, para conocer la vida de su hijo Charles, el donante de su corazón. Cora se adentra así en un hogar lleno de secretos, en un misterio que se extiende durante veinte años y en un pueblo hermético en el que, justo el día de su llegada, desaparece un bebé en un parque público.",
        "language": "es",
        "totalPages": 488,
        "categories": [
            "Thrillers",
            "Suspense"
        ],
        "featuredType": "bestSeller",
        "downloadCount": 2,
        "totalRating": 0,
        "totalReviews": 10,
        "inReadingLists": 2,
        "coverImage": "https://covers.openlibrary.org/b/isbn/9788491293552-L.jpg"
 }
 ...
]
```

#### **Otras respuestas:**
  * 401 Unathorized:
  ```
  {
    "message": "Token not provided."
  }
  ```
  * 403 Forbidden:
  ```
  {
    "message": "Invalid or expired token."
  }
  ```
  ```
  {
    "message": "Access denied: You do not have the necessary permissions."
  }
  ```
  * 404 Not Found: No books found.
  ```
  {
    "message": "No books found"
  }
  ```
  * 500 Internal Server Error: Unexpected server error occurred.
  ```
  {
    "message": "Unexpected server error occurred.",
    "error": "Ejemplo de mensaje de error: database connection failed."
  }
  ```

### **5. Obtener estadísticas**
* **Método :** `GET`
* **PATH :** `/api/v1/books/stats`
* **Descripción :** Devuelve las estadísticas sobre la colección de libros, incluido el total de libros, el número de autores, el género más popular y el autor más prolífico.
* **Ejemplo de solicitud:**
```
GET /api/v1/books/stats
```
* **Ejemplo de respuesta (200 OK):**
```
{
    "success": true,
    "data": {
        "totalBooks": 40,
        "authors": 25,
        "mostPopularGenre": "Fiction",
        "mostProlificAuthor": "Ken Follett"
    }
}
```

#### **Otras respuestas:**
  * 401 Unathorized:
  ```
  {
    "message": "Token not provided."
  }
  ```
  * 403 Forbidden:
  ```
  {
    "message": "Invalid or expired token."
  }
  ```
  ```
  {
    "message": "Access denied: You do not have the necessary permissions."
  }
  ```
  * 500 Internal Server Error: Unexpected server error occurred.
  ```
  {
    "message": "Unexpected server error occurred.",
    "error": "Ejemplo de mensaje de error: database connection failed."
  }
  ```

***

## Endpoints para la comunicación entre microservicios
### **6. Actualizar total de descargas de un libro**
* **Método :** `PATCH`
* **PATH :** `/api/v1/books/{isbn}/downloads`
* **Parámetros :** 
  * `isbn` : ISBN del libro en formato ISBN-10 o ISBN-13.
* **Descripción :** Actualiza el recuento de descargas de un libro específico identificado por su ISBN.
* **Ejemplo de solicitud:**
```
PATCH /api/v1/books/9788491293552/downloads
```
* **Ejemplo de body de la solicitud:**
```
{
    "downloadCount": 2
}
```
* **Ejemplo de respuesta (200 OK):**
```
{
    "message": "Book download count updated successfully.",
    "book": {
        "isbn": "9788491293552",
        "title": "El cuco de cristal",
        "author": "Javier Castillo",
        "publicationYear": 2024,
        "description": "Nueva York, 2017. Cora Merlo, médico residente de primer año, sufre un infarto fulminante que la obliga a un trasplante de corazón. Aún convaleciente la joven recibe la visita de una extraña mujer con una enigmática oferta: pasar unos días en Steelville, un pequeño pueblo de interior, para conocer la vida de su hijo Charles, el donante de su corazón. Cora se adentra así en un hogar lleno de secretos, en un misterio que se extiende durante veinte años y en un pueblo hermético en el que, justo el día de su llegada, desaparece un bebé en un parque público.",
        "language": "es",
        "totalPages": 488,
        "categories": [
            "Thrillers",
            "Suspense"
        ],
        "featuredType": "bestSeller",
        "downloadCount": 2,
        "totalRating": 0,
        "totalReviews": 10,
        "inReadingLists": 2,
        "coverImage": "https://covers.openlibrary.org/b/isbn/9788491293552-L.jpg"
    }
}
```

#### **Otras respuestas:**
  * 400 Bad request:
  ```
  {
    "error": "Validation failed. Check the provided data.",
    "details": {
        "downloadCount": {
            "name": "ValidatorError",
            "message": "The download count cannot be negative.",
            "properties": {
                "message": "The download count cannot be negative.",
                "type": "min",
                "min": 0,
                "path": "downloadCount",
                "fullPath": "downloadCount",
                "value": -2
            },
            "kind": "min",
            "path": "downloadCount",
            "value": -2
        }
    }
  }
  ```
  ```
  { 
     error: 'Invalid ISBN format. Must be ISBN-10 or ISBN-13.'
  }
  ```
  ```
  {
     "error": "'downloadCount' must be a valid number."
  }
  ```
  ```
  { 
     "error": "'downloadCount' is required." 
  }
  ```
  ```
  {
    "error": "Invalid JSON format",
    "message": "Expected ',' or '}' after property value in JSON at position 893"
  }
  ```
  * 401 Unathorized:
  ```
  {
    "message": "Token not provided."
  }
  ```
  * 403 Forbidden:
  ```
  {
    "message": "Invalid or expired token."
  }
  ```
  ```
  {
    "message": "Access denied: You do not have the necessary permissions."
  }
  ```
  * 404 Not Found: Book not found.
  ```
  {
    "message": "Book not found"
  }
  ```
  * 500 Internal Server Error: Unexpected server error occurred.
  ```
  {
    "message": "Unexpected server error occurred.",
    "error": "Ejemplo de mensaje de error: database connection failed."
  }
  ```

### **7. Actualizar el total de listas de lectura en las que se encuentra un libro**
* **Método :** `PATCH`
* **PATH :** `/api/v1/books/{isbn}/readingLists`
* **Parámetros :** 
  * `isbn` : ISBN del libro en formato ISBN-10 o ISBN-13.
* **Descripción :** Actualiza el recuento de listas de lectura en las que se encuentra un libro específico identificado por su ISBN.
* **Ejemplo de solicitud:**
```
PATCH /api/v1/books/9788491293552/readingLists
```
* **Ejemplo de body de la solicitud:**
```
{
    "inReadingLists": 2
}
```
* **Ejemplo de respuesta (200 OK):**
```
{
    "message": "Book total reading lists updated successfully.",
    "book": {
        "isbn": "9788491293552",
        "title": "El cuco de cristal",
        "author": "Javier Castillo",
        "publicationYear": 2024,
        "description": "Nueva York, 2017. Cora Merlo, médico residente de primer año, sufre un infarto fulminante que la obliga a un trasplante de corazón. Aún convaleciente la joven recibe la visita de una extraña mujer con una enigmática oferta: pasar unos días en Steelville, un pequeño pueblo de interior, para conocer la vida de su hijo Charles, el donante de su corazón. Cora se adentra así en un hogar lleno de secretos, en un misterio que se extiende durante veinte años y en un pueblo hermético en el que, justo el día de su llegada, desaparece un bebé en un parque público.",
        "language": "es",
        "totalPages": 488,
        "categories": [
            "Thrillers",
            "Suspense"
        ],
        "featuredType": "bestSeller",
        "downloadCount": 2,
        "totalRating": 0,
        "totalReviews": 10,
        "inReadingLists": 2,
        "coverImage": "https://covers.openlibrary.org/b/isbn/9788491293552-L.jpg"
    }
}
```

#### **Otras respuestas:**
  * 400 Bad request:
  ```
  {
    "error": "Validation failed. Check the provided data.",
    "details": {
        "inReadingLists": {
            "name": "ValidatorError",
            "message": "The number of reading lists cannot be negative.",
            "properties": {
                "message": "The number of reading lists cannot be negative.",
                "type": "min",
                "min": 0,
                "path": "inReadingLists",
                "fullPath": "inReadingLists",
                "value": -2
            },
            "kind": "min",
            "path": "inReadingLists",
            "value": -2
        }
    }
  }
  ```
  ```
  { 
     error: 'Invalid ISBN format. Must be ISBN-10 or ISBN-13.'
  }
  ```
  ```
  {
     "error": "'inReadingLists' must be a valid number."
  }
  ```
  ```
  { 
     "error": "'inReadingLists' is required." 
  }
  ```
  ```
  {
    "error": "Invalid JSON format",
    "message": "Expected ',' or '}' after property value in JSON at position 893"
  }
  ```
  * 401 Unathorized:
  ```
  {
    "message": "Token not provided."
  }
  ```
  * 403 Forbidden:
  ```
  {
    "message": "Invalid or expired token."
  }
  ```
  ```
  {
    "message": "Access denied: You do not have the necessary permissions."
  }
  ```
  * 404 Not Found: Book not found.
  ```
  {
    "message": "Book not found"
  }
  ```
  * 500 Internal Server Error: Unexpected server error occurred.
  ```
  {
    "message": "Unexpected server error occurred.",
    "error": "Ejemplo de mensaje de error: database connection failed."
  }
  ```

### **8. Actualizar calificación global y total de reseñas**
* **Método :** `PATCH`
* **PATH :** `/api/v1/books/{isbn}/review`
* **Descripción :** Actualiza tanto la calificación promedio `totalRating` como el número total de reseñas `totalReviews` del libro correspondiente.
* **Parámetros :** 
  * `isbn` : ISBN del libro en formato ISBN-10 o ISBN-13.
* **Ejemplo de solicitud:**
```
PATCH /api/v1/books/9788491293552/review
```
* **Ejemplo de body de la solicitud:**
```
{
    "totalRating": 4,
    "totalReviews": 10
}
```
* **Ejemplo de respuesta (200 OK):**
```
{
    "message": "Review added successfully.",
    "bookReview": {
        "isbn": "9788491293552",
        "totalRating": 4,
        "totalReviews": 10
    }
}
```

#### **Otras respuestas:**
  * 400 Bad request:
  ```
  {
    "error": "Validation failed. Check the provided data.",
    "details": {
        "totalRating": {
            "name": "ValidatorError",
            "message": "The total rating cannot be less than 0.",
            "properties": {
                "message": "The total rating cannot be less than 0.",
                "type": "min",
                "min": 0,
                "path": "totalRating",
                "fullPath": "totalRating",
                "value": -2
            },
            "kind": "min",
            "path": "totalRating",
            "value": -2
        },
        "totalReviews": {
            "name": "ValidatorError",
            "message": "The number of reviews cannot be negative.",
            "properties": {
                "message": "The number of reviews cannot be negative.",
                "type": "min",
                "min": 0,
                "path": "totalReviews",
                "fullPath": "totalReviews",
                "value": -2
            },
            "kind": "min",
            "path": "totalReviews",
            "value": -2
        }
    }
  }
  ```
  ```
  { 
     error: 'Invalid ISBN format. Must be ISBN-10 or ISBN-13.'
  }
  ```
  ```
  { 
     "error": "Both totalRating and totalReviews are required." 
  }
  ```
  ```
  {
     "error": "Invalid input. Both totalRating and totalReviews must be numbers."
  }
  ```
  ```
  {
    "error": "Invalid JSON format",
    "message": "Expected ',' or '}' after property value in JSON at position 893"
  }
  ```
  * 401 Unathorized:
  ```
  {
    "message": "Token not provided."
  }
  ```
  * 403 Forbidden:
  ```
  {
    "message": "Invalid or expired token."
  }
  ```
  ```
  {
    "message": "Access denied: You do not have the necessary permissions."
  }
  ```
  * 404 Not Found: Book not found.
  ```
  {
    "message": "Book not found"
  }
  ```
  * 500 Internal Server Error: Unexpected server error occurred.
  ```
  {
    "message": "Unexpected server error occurred.",
    "error": "Ejemplo de mensaje de error: database connection failed."
  }
  ```

***

## Endpoints para usuarios con rol de administrador
### **9. Crear un libro**
* **Método :** `POST`
* **PATH :** `/api/v1/books`
* **Parámetros :** 
  * `isbn` : ISBN del libro en formato ISBN-10 o ISBN-13.
* **Descripción :** Añade un nuevo libro al catálogo.
* **Ejemplo de solicitud:**
```
POST /api/v1/books
```
* **Ejemplo de body de la solicitud:**
```
{
    "isbn": 9788408114512,
    "title": "¡Buenos días, princesa!",
    "author": "Blue Jeans",
    "publicationYear": "2016",
    "description": "Han pasado algo más de dos años en la vida de los chicos que forman “el club de los incomprendidos”. Sin embargo, hasta el momento, su amistad ha podido con todo y con todos. Raúl, se ha convertido en un atractivo joven y en un líder nato; Valeria, derrocha simpatía por donde pisa, aunque no ha vencido del todo a su timidez; Eli, es la que más se ha transformado de todos y se los lleva de calle; María, vigila y sueña tras sus gafas de pasta de color azul; Bruno, no consigue olvidar lo que siente y en lo más profundo de su corazón espera ser correspondido; y Ester, es la nuera que toda madre querría tener aunque no es tan inocente como todos piensan.",
    "language": "es",
    "totalPages": 544,
    "categories": [
        "Romance",
        "Contemporary fiction "
    ],
    "featuredType": "bestSeller"
}
```
* **Ejemplo de respuesta (201):**
```
{
    "message": "Book created successfully",
    "book": {
        "isbn": "9788408114512",
        "title": "¡Buenos días, princesa!",
        "author": "Blue Jeans",
        "publicationYear": 2016,
        "description": "Han pasado algo más de dos años en la vida de los chicos que forman “el club de los incomprendidos”. Sin embargo, hasta el momento, su amistad ha podido con todo y con todos. Raúl, se ha convertido en un atractivo joven y en un líder nato; Valeria, derrocha simpatía por donde pisa, aunque no ha vencido del todo a su timidez; Eli, es la que más se ha transformado de todos y se los lleva de calle; María, vigila y sueña tras sus gafas de pasta de color azul; Bruno, no consigue olvidar lo que siente y en lo más profundo de su corazón espera ser correspondido; y Ester, es la nuera que toda madre querría tener aunque no es tan inocente como todos piensan.",
        "language": "es",
        "totalPages": 544,
        "categories": [
            "Romance",
            "Contemporary fiction "
        ],
        "featuredType": "bestSeller",
        "downloadCount": 0,
        "totalRating": 0,
        "totalReviews": 0,
        "inReadingLists": 0,
        "coverImage": "https://covers.openlibrary.org/b/isbn/9788408114512-L.jpg"
    }
}
```

#### **Otras respuestas:**
  * 400 Bad request:
  ```
  {
    "error": "Validation failed. Check the provided data.",
    "details": {
        "isbn": {
            "name": "ValidatorError",
            "message": "Invalid ISBN format. Must be ISBN-10 or ISBN-13.",
            "properties": {
                "message": "Invalid ISBN format. Must be ISBN-10 or ISBN-13.",
                "type": "regexp",
                "regexp": {},
                "path": "isbn",
                "fullPath": "isbn",
                "value": "123"
            },
            "kind": "regexp",
            "path": "isbn",
            "value": "123"
        },
        "title": {
            "name": "ValidatorError",
            "message": "The title must be at least 3 characters long.",
            "properties": {
                "message": "The title must be at least 3 characters long.",
                "type": "minlength",
                "minlength": 3,
                "path": "title",
                "fullPath": "title",
                "value": "a"
            },
            "kind": "minlength",
            "path": "title",
            "value": "a"
        },
        "totalPages": {
            "name": "ValidatorError",
            "message": "The number of pages must be greater than 0.",
            "properties": {
                "message": "The number of pages must be greater than 0.",
                "type": "min",
                "min": 1,
                "path": "totalPages",
                "fullPath": "totalPages",
                "value": -2
            },
            "kind": "min",
            "path": "totalPages",
            "value": -2
        }
    }
  }
  ```
  ```
  {
    "error": "Invalid ISBN format. Must be ISBN-10 or ISBN-13."
  }
  ```
  ```
  {
    "error": "The fields downloadCount, totalRating, totalReviews, and inReadingLists should not be included in the request."
  }
  ```
  ```
  {
    "error": "Invalid JSON format",
    "message": "Expected ',' or '}' after property value in JSON at position 893"
  }
  ```
  * 401 Unathorized:
  ```
  {
    "message": "Token not provided."
  }
  ```
  * 403 Forbidden:
  ```
  {
    "message": "Invalid or expired token."
  }
  ```
  ```
  {
    "message": "Access denied: You do not have the necessary permissions."
  }
  ```
  * 404 Not Fount: Book not found.
  ```
  {
    "message": "Book not found"
  }
  ```
  * 409 Conflict: Duplicate ISBN.
  ```
  {
    "error": "Duplicate ISBN: a book with this ISBN already exists."
  }
  ```
  * 500 Internal Server Error: Unexpected server error occurred.
  ```
  {
    "message": "Unexpected server error occurred.",
    "error": "Ejemplo de mensaje de error: database connection failed."
  }
  ```

### **10. Eliminar un libro**
* **Método :** `DELETE`
* **PATH :** `/api/v1/books/{isbn}`
* **Descripción :** Elimina un libro del catálogo por su ISBN.
* **Parámetros :** 
  * `isbn` : ISBN del libro en formato ISBN-10 o ISBN-13.
* **Ejemplo de solicitud:**
```
DELETE /api/v1/books/9788408114512
```
* **Ejemplo de respuesta (200 OK):**
```
{
    "message": "Book deleted successfully"
}
```

#### **Otras respuestas:**
  * 400 Bad request:
  ```
  {
    "error": "Invalid ISBN format. Must be ISBN-10 or ISBN-13."
  }
  ```
  * 401 Unathorized:
  ```
  {
    "message": "Token not provided."
  }
  ```
  * 403 Forbidden:
  ```
  {
    "message": "Invalid or expired token."
  }
  ```
  ```
  {
    "message": "Access denied: You do not have the necessary permissions."
  }
  ```
  * 404 Not Fount: Book not found.
  ```
  {
    "message": "Book not found"
  }
  ```
  * 500 Internal Server Error: Unexpected server error occurred.
  ```
  {
    "message": "Unexpected server error occurred.",
    "error": "Ejemplo de mensaje de error: database connection failed."
  }
  ```


### **11. Actualizar un libro**
* **Método :** `PUT`
* **PATH :** `/api/v1/books/{isbn}`
* **Descripción :** Actualiza los datos de un libro del catálogo por su ISBN.
* **Parámetros :** 
  * `isbn` : ISBN del libro en formato ISBN-10 o ISBN-13.
* **Ejemplo de solicitud:**
```
PUT /api/v1/books/9788408114512
```
* **Ejemplo de body de la solicitud:**
```
{
    "isbn": 9788408114512,
    "title": "¡Buenos días, princesa!",
    "author": "Blue Jeans",
    "publicationYear": "2016",
    "description": "Han pasado algo más de dos años en la vida de los chicos que forman “el club de los incomprendidos”. Sin embargo, hasta el momento, su amistad ha podido con todo y con todos. Raúl, se ha convertido en un atractivo joven y en un líder nato; Valeria, derrocha simpatía por donde pisa, aunque no ha vencido del todo a su timidez; Eli, es la que más se ha transformado de todos y se los lleva de calle; María, vigila y sueña tras sus gafas de pasta de color azul; Bruno, no consigue olvidar lo que siente y en lo más profundo de su corazón espera ser correspondido; y Ester, es la nuera que toda madre querría tener aunque no es tan inocente como todos piensan.",
    "language": "es",
    "totalPages": 594,
    "categories": [
        "Romance"
    ],
    "featuredType": "none"
}
```
* **Ejemplo de respuesta (200 OK):**
```
{
    "message": "Book updated successfully",
    "book": {
        "isbn": "9788408114512",
        "title": "¡Buenos días, princesa!",
        "author": "Blue Jeans",
        "publicationYear": 2016,
        "description": "Han pasado algo más de dos años en la vida de los chicos que forman “el club de los incomprendidos”. Sin embargo, hasta el momento, su amistad ha podido con todo y con todos. Raúl, se ha convertido en un atractivo joven y en un líder nato; Valeria, derrocha simpatía por donde pisa, aunque no ha vencido del todo a su timidez; Eli, es la que más se ha transformado de todos y se los lleva de calle; María, vigila y sueña tras sus gafas de pasta de color azul; Bruno, no consigue olvidar lo que siente y en lo más profundo de su corazón espera ser correspondido; y Ester, es la nuera que toda madre querría tener aunque no es tan inocente como todos piensan.",
        "language": "es",
        "totalPages": 594,
        "categories": [
            "Romance"
        ],
        "featuredType": "none",
        "downloadCount": 0,
        "totalRating": 0,
        "totalReviews": 0,
        "inReadingLists": 0,
        "coverImage": "https://covers.openlibrary.org/b/isbn/9788408114512-L.jpg"
    }
}
```

#### **Otras respuestas:**
  * 400 Bad request:
  ```
  {
    "error": "Validation failed. Check the provided data.",
    "details": {
        "isbn": {
            "name": "ValidatorError",
            "message": "Invalid ISBN format. Must be ISBN-10 or ISBN-13.",
            "properties": {
                "message": "Invalid ISBN format. Must be ISBN-10 or ISBN-13.",
                "type": "regexp",
                "regexp": {},
                "path": "isbn",
                "fullPath": "isbn",
                "value": "123"
            },
            "kind": "regexp",
            "path": "isbn",
            "value": "123"
        },
        "title": {
            "name": "ValidatorError",
            "message": "The title must be at least 3 characters long.",
            "properties": {
                "message": "The title must be at least 3 characters long.",
                "type": "minlength",
                "minlength": 3,
                "path": "title",
                "fullPath": "title",
                "value": "a"
            },
            "kind": "minlength",
            "path": "title",
            "value": "a"
        },
        "totalPages": {
            "name": "ValidatorError",
            "message": "The number of pages must be greater than 0.",
            "properties": {
                "message": "The number of pages must be greater than 0.",
                "type": "min",
                "min": 1,
                "path": "totalPages",
                "fullPath": "totalPages",
                "value": -2
            },
            "kind": "min",
            "path": "totalPages",
            "value": -2
        }
    }
  }
  ```
  ```
  {
    "error": "Invalid ISBN format. Must be ISBN-10 or ISBN-13."
  }
  ```
  ```
  {
    "error": "Invalid JSON format",
    "message": "Expected ',' or '}' after property value in JSON at position 893"
  }
  ```
  * 401 Unathorized:
  ```
  {
    "message": "Token not provided."
  }
  ```
  * 403 Forbidden:
  ```
  {
    "message": "Invalid or expired token."
  }
  ```
  ```
  {
    "message": "Access denied: You do not have the necessary permissions."
  }
  ```
  * 404 Not Found: Book not found.
  ```
  {
    "message": "Book not found"
  }
  ```
  * 409 Conflict: Duplicate ISBN.
  ```
  {
    "error": "Duplicate ISBN: a book with this ISBN already exists."
  }
  ```
  * 500 Internal Server Error: Unexpected server error occurred.
  ```
  {
    "message": "Unexpected server error occurred.",
    "error": "Ejemplo de mensaje de error: database connection failed."
  }
  ```

***

## Endpoint de salud
### **12. Health check**
* **Método :** `GET`
* **PATH :** `/api/v1/books/healthz`
* **Descripción :** Endpoint para verificar el estado de salud del servicio.
* **Ejemplo de solicitud:**
```
GET /api/v1/books/healthz
```
* **Ejemplo de respuesta (200 OK):**
```
{
    OK
}
```

***

## Documentación Interactiva con Swagger
Para explorar y probar todos los endpoints de esta API REST, puedes acceder a la documentación interactiva generada con Swagger en la siguiente URL:

[http://57.152.88.187/api/v1/books/api-docs](http://57.152.88.187/api/v1/books/api-docs)

El mecanismo de autenticación de nuestro microservicio se basa en el uso de tokens JWT. El microservicio de usuarios es el encargado de generar este token mediante la siguiente solicitud:

* **Método :** POST 
* **PATH :** /api/v1/auth/login 
* **Descripción :** Inicio de sesión en el sistema. 
* **Ejemplo de solicitud:**
POST /api/v1/auth/users/login

* **Ejemplo de body de la solicitud:**
```
{
  "email": "testUser@gmail.com",
  "password": "testUser"
}
```
* **Ejemplo de respuesta (200 OK):**
```
{
  "message": "Inicio de sesión exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2Nzc5Mzg1YjE5MmY4NjA1MDExZWMxODciLCJub21icmUiOiJ0ZXN0VXNlciIsImFwZWxsaWRvcyI6InRlc3QiLCJ1c2VybmFtZSI6InRlc3RVc2VyIiwiZW1haWwiOiJ0ZXN0VXNlckBnbWFpbC5jb20iLCJwbGFuIjoiUGxhbjEiLCJyb2wiOiJVc2VyIiwiaWF0IjoxNzM2MjgwMTA2LCJleHAiOjE3MzYyODM3MDZ9.IpPOdSmtnhTwYyKtxRf2EbnXbcSF8MVCJTYyw1QPq1Q"
}
```
Para poder iniciar sesión, el usuario debe estar previamente registrado. Para ello, existe el siguiente endpoint de registro:

* **Método :** POST 
* **PATH :** /api/v1/auth/register 
* **Descripción :** Permite registrar un nuevo usuario en el sistema. 
* **Ejemplo de solicitud:**
POST /api/v1/auth/users/register

* **Ejemplo de body de la solicitud:**
```
{
    "nombre": "test",
    "apellidos": "test",
    "username": "test",
    "email": "test@gmail.com",
    "password": "test",
    "plan": "Plan1",
    "rol": "Admin"
}
```
* **Ejemplo de respuesta (200 OK):**
```
{
    "message": "Usuario registrado exitosamente"
}
```

Una vez que se obtiene un token válido utilizando el endpoint correspondiente del microservicio de usuarios, se puede introducir dicho token en el Swagger del microservicio de catálogo. Para ello, es necesario hacer uso del botón **Authorize** en el Swagger y proporcionar el token en el campo correspondiente.

El endpoint mencionado para obtener el token se puede encontrar en el Swagger del microservicio de usuario: [http://57.152.88.187/api/v1/auth/api-docs/](http://57.152.88.187/api/v1/auth/api-docs/)

**Importante:** Debes anteponer la palabra **Bearer** seguida de un espacio antes del token en el campo *Value* del modal que se abre en el Swagger.


