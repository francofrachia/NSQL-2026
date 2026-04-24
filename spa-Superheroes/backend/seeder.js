require('dotenv').config();
const mongoose = require('mongoose');
const Superhero = require('./models/Superhero');

const superheroes = [
    {
        "nombre": "Iron Man",
        "nombreReal": "Tony Stark",
        "aparicion": 1963,
        "casa": "Marvel",
        "biografia": "Genio, multimillonario que construye una armadura para salvar su vida.",
        "equipamiento": [
            "Armadura Mark 85",
            "JARVIS"
        ],
        "imagenes": [
            "https://placehold.co/600x400?text=Iron+Man"
        ]
    },
    {
        "nombre": "Captain America",
        "nombreReal": "Steve Rogers",
        "aparicion": 1941,
        "casa": "Marvel",
        "biografia": "Soldado de la 2da Guerra Mundial mejorado con suero.",
        "equipamiento": [
            "Escudo de Vibranium"
        ],
        "imagenes": [
            "https://placehold.co/600x400?text=Cap+America"
        ]
    },
    {
        "nombre": "Thor",
        "nombreReal": "Thor Odinson",
        "aparicion": 1962,
        "casa": "Marvel",
        "biografia": "Dios asgardiano del trueno.",
        "equipamiento": [
            "Mjolnir",
            "Stormbreaker"
        ],
        "imagenes": [
            "https://placehold.co/600x400?text=Thor"
        ]
    },
    {
        "nombre": "Hulk",
        "nombreReal": "Bruce Banner",
        "aparicion": 1962,
        "casa": "Marvel",
        "biografia": "Científico transformado por radiación gamma.",
        "equipamiento": [],
        "imagenes": [
            "https://placehold.co/600x400?text=Hulk"
        ]
    },
    {
        "nombre": "Black Widow",
        "nombreReal": "Natasha Romanoff",
        "aparicion": 1964,
        "casa": "Marvel",
        "biografia": "Espía rusa de élite convertida en Vengadora.",
        "equipamiento": [
            "Brazaletes eléctricos"
        ],
        "imagenes": [
            "https://placehold.co/600x400?text=Black+Widow"
        ]
    },
    {
        "nombre": "Spider-Man",
        "nombreReal": "Peter Parker",
        "aparicion": 1962,
        "casa": "Marvel",
        "biografia": "Joven con poderes arácnidos tras una picadura.",
        "equipamiento": [
            "Lanzatelarañas"
        ],
        "imagenes": [
            "https://placehold.co/600x400?text=Spider-Man"
        ]
    },
    {
        "nombre": "Doctor Strange",
        "nombreReal": "Stephen Strange",
        "aparicion": 1963,
        "casa": "Marvel",
        "biografia": "Hechicero Supremo protector de la Tierra.",
        "equipamiento": [
            "Capa de Levitación",
            "Ojo de Agamotto"
        ],
        "imagenes": [
            "https://placehold.co/600x400?text=Dr+Strange"
        ]
    },
    {
        "nombre": "Black Panther",
        "nombreReal": "T'Challa",
        "aparicion": 1966,
        "casa": "Marvel",
        "biografia": "Rey de Wakanda con traje de vibranium.",
        "equipamiento": [
            "Traje de Pantera"
        ],
        "imagenes": [
            "https://placehold.co/600x400?text=Black+Panther"
        ]
    },
    {
        "nombre": "Wolverine",
        "nombreReal": "Logan",
        "aparicion": 1974,
        "casa": "Marvel",
        "biografia": "Mutante con garras de adamantium y regeneración.",
        "equipamiento": [
            "Esqueleto de Adamantium"
        ],
        "imagenes": [
            "https://placehold.co/600x400?text=Wolverine"
        ]
    },
    {
        "nombre": "Storm",
        "nombreReal": "Ororo Munroe",
        "aparicion": 1975,
        "casa": "Marvel",
        "biografia": "Mutante capaz de controlar el clima.",
        "equipamiento": [],
        "imagenes": [
            "https://placehold.co/600x400?text=Storm"
        ]
    },
    {
        "nombre": "Daredevil",
        "nombreReal": "Matt Murdock",
        "aparicion": 1964,
        "casa": "Marvel",
        "biografia": "Abogado ciego con sentidos súper desarrollados.",
        "equipamiento": [
            "Bastones de combate"
        ],
        "imagenes": [
            "https://placehold.co/600x400?text=Daredevil"
        ]
    },
    {
        "nombre": "Silver Surfer",
        "nombreReal": "Norrin Radd",
        "aparicion": 1966,
        "casa": "Marvel",
        "biografia": "Heraldo cósmico de Galactus.",
        "equipamiento": [
            "Tabla de surf cósmica"
        ],
        "imagenes": [
            "https://placehold.co/600x400?text=Silver+Surfer"
        ]
    },
    {
        "nombre": "Deadpool",
        "nombreReal": "Wade Wilson",
        "aparicion": 1991,
        "casa": "Marvel",
        "biografia": "Mercenario bocazas con factor de curación.",
        "equipamiento": [
            "Katanas",
            "Pistolas"
        ],
        "imagenes": [
            "https://placehold.co/600x400?text=Deadpool"
        ]
    },
    {
        "nombre": "Star-Lord",
        "nombreReal": "Peter Quill",
        "aparicion": 1976,
        "casa": "Marvel",
        "biografia": "Líder de los Guardianes de la Galaxia.",
        "equipamiento": [
            "Blasters elementales",
            "Casco"
        ],
        "imagenes": [
            "https://placehold.co/600x400?text=Star-Lord"
        ]
    },
    {
        "nombre": "Groot",
        "nombreReal": "Groot",
        "aparicion": 1960,
        "casa": "Marvel",
        "biografia": "Criatura arbórea extraterrestre.",
        "equipamiento": [],
        "imagenes": [
            "https://placehold.co/600x400?text=Groot"
        ]
    },
    {
        "nombre": "Magneto",
        "nombreReal": "Erik Lehnsherr",
        "aparicion": 1963,
        "casa": "Marvel",
        "biografia": "Maestro del magnetismo.",
        "equipamiento": [
            "Casco anti-telepatía"
        ],
        "imagenes": [
            "https://placehold.co/600x400?text=Magneto"
        ]
    },
    {
        "nombre": "Venom",
        "nombreReal": "Eddie Brock",
        "aparicion": 1988,
        "casa": "Marvel",
        "biografia": "Antihéroe unido a un simbionte alienígena.",
        "equipamiento": [],
        "imagenes": [
            "https://placehold.co/600x400?text=Venom"
        ]
    },
    {
        "nombre": "Jean Grey",
        "nombreReal": "Jean Grey",
        "aparicion": 1963,
        "casa": "Marvel",
        "biografia": "Mutante con poderes telepáticos y telequinéticos.",
        "equipamiento": [],
        "imagenes": [
            "https://placehold.co/600x400?text=Jean+Grey"
        ]
    },
    {
        "nombre": "Cyclops",
        "nombreReal": "Scott Summers",
        "aparicion": 1963,
        "casa": "Marvel",
        "biografia": "Líder de los X-Men con rayos ópticos.",
        "equipamiento": [
            "Visor de rubí cuarzo"
        ],
        "imagenes": [
            "https://placehold.co/600x400?text=Cyclops"
        ]
    },
    {
        "nombre": "Punisher",
        "nombreReal": "Frank Castle",
        "aparicion": 1974,
        "casa": "Marvel",
        "biografia": "Ex-marine que busca venganza contra el crimen.",
        "equipamiento": [
            "Arsenal variado"
        ],
        "imagenes": [
            "https://placehold.co/600x400?text=Punisher"
        ]
    },
    {
        "nombre": "Superman",
        "nombreReal": "Clark Kent",
        "aparicion": 1938,
        "casa": "DC",
        "biografia": "El hombre de acero del planeta Krypton.",
        "equipamiento": [],
        "imagenes": [
            "https://placehold.co/600x400?text=Superman"
        ]
    },
    {
        "nombre": "Batman",
        "nombreReal": "Bruce Wayne",
        "aparicion": 1939,
        "casa": "DC",
        "biografia": "El caballero de la noche protector de Gotham.",
        "equipamiento": [
            "Batarangs",
            "Batimóvil"
        ],
        "imagenes": [
            "https://placehold.co/600x400?text=Batman",
            "https://placehold.co/600x400?text=Bruce+Wayne"
        ]
    },
    {
        "nombre": "Wonder Woman",
        "nombreReal": "Diana Prince",
        "aparicion": 1941,
        "casa": "DC",
        "biografia": "Princesa amazona de Themyscira.",
        "equipamiento": [
            "Lazo de la verdad",
            "Brazaletes"
        ],
        "imagenes": [
            "https://placehold.co/600x400?text=Wonder+Woman"
        ]
    },
    {
        "nombre": "The Flash",
        "nombreReal": "Barry Allen",
        "aparicion": 1956,
        "casa": "DC",
        "biografia": "El hombre más rápido del mundo.",
        "equipamiento": [
            "Anillo de traje"
        ],
        "imagenes": [
            "https://placehold.co/600x400?text=The+Flash"
        ]
    },
    {
        "nombre": "Aquaman",
        "nombreReal": "Arthur Curry",
        "aparicion": 1941,
        "casa": "DC",
        "biografia": "Rey de la Atlántida.",
        "equipamiento": [
            "Tridente de Poseidón"
        ],
        "imagenes": [
            "https://placehold.co/600x400?text=Aquaman"
        ]
    },
    {
        "nombre": "Green Lantern",
        "nombreReal": "Hal Jordan",
        "aparicion": 1959,
        "casa": "DC",
        "biografia": "Miembro de la policía intergaláctica.",
        "equipamiento": [
            "Anillo de poder"
        ],
        "imagenes": [
            "https://placehold.co/600x400?text=Green+Lantern"
        ]
    },
    {
        "nombre": "Cyborg",
        "nombreReal": "Victor Stone",
        "aparicion": 1980,
        "casa": "DC",
        "biografia": "Mitad hombre, mitad máquina con alta tecnología.",
        "equipamiento": [
            "Cañón sónico"
        ],
        "imagenes": [
            "https://placehold.co/600x400?text=Cyborg"
        ]
    },
    {
        "nombre": "Green Arrow",
        "nombreReal": "Oliver Queen",
        "aparicion": 1941,
        "casa": "DC",
        "biografia": "Arquero experto y multimillonario.",
        "equipamiento": [
            "Arco y flechas trucadas"
        ],
        "imagenes": [
            "https://placehold.co/600x400?text=Green+Arrow"
        ]
    },
    {
        "nombre": "Nightwing",
        "nombreReal": "Dick Grayson",
        "aparicion": 1940,
        "casa": "DC",
        "biografia": "El primer Robin, ahora héroe independiente.",
        "equipamiento": [
            "Bastones de Escrima"
        ],
        "imagenes": [
            "https://placehold.co/600x400?text=Nightwing"
        ]
    },
    {
        "nombre": "Shazam",
        "nombreReal": "Billy Batson",
        "aparicion": 1939,
        "casa": "DC",
        "biografia": "Niño que se transforma en héroe al decir una palabra mágica.",
        "equipamiento": [],
        "imagenes": [
            "https://placehold.co/600x400?text=Shazam"
        ]
    },
    {
        "nombre": "Supergirl",
        "nombreReal": "Kara Zor-El",
        "aparicion": 1959,
        "casa": "DC",
        "biografia": "Prima de Superman con sus mismos poderes.",
        "equipamiento": [],
        "imagenes": [
            "https://placehold.co/600x400?text=Supergirl"
        ]
    },
    {
        "nombre": "Catwoman",
        "nombreReal": "Selina Kyle",
        "aparicion": 1940,
        "casa": "DC",
        "biografia": "Ladrona experta y aliada/enemiga de Batman.",
        "equipamiento": [
            "Látigo"
        ],
        "imagenes": [
            "https://placehold.co/600x400?text=Catwoman"
        ]
    },
    {
        "nombre": "Robin",
        "nombreReal": "Damian Wayne",
        "aparicion": 2006,
        "casa": "DC",
        "biografia": "Hijo de Batman entrenado por la Liga de Sombras.",
        "equipamiento": [
            "Katana",
            "Batarangs"
        ],
        "imagenes": [
            "https://placehold.co/600x400?text=Robin"
        ]
    },
    {
        "nombre": "Batgirl",
        "nombreReal": "Barbara Gordon",
        "aparicion": 1967,
        "casa": "DC",
        "biografia": "Hija del comisionado Gordon y aliada de Batman.",
        "equipamiento": [
            "Batarangs"
        ],
        "imagenes": [
            "https://placehold.co/600x400?text=Batgirl"
        ]
    },
    {
        "nombre": "Black Canary",
        "nombreReal": "Dinah Lance",
        "aparicion": 1947,
        "casa": "DC",
        "biografia": "Heroína con un grito sónico devastador.",
        "equipamiento": [],
        "imagenes": [
            "https://placehold.co/600x400?text=Black+Canary"
        ]
    },
    {
        "nombre": "Martian Manhunter",
        "nombreReal": "J'onn J'onzz",
        "aparicion": 1955,
        "casa": "DC",
        "biografia": "Último marciano verde con vastos poderes.",
        "equipamiento": [],
        "imagenes": [
            "https://placehold.co/600x400?text=Martian+Manhunter"
        ]
    },
    {
        "nombre": "The Joker",
        "nombreReal": "Desconocido",
        "aparicion": 1940,
        "casa": "DC",
        "biografia": "El archienemigo de Batman y príncipe payaso del crimen.",
        "equipamiento": [
            "Gas de la risa"
        ],
        "imagenes": [
            "https://placehold.co/600x400?text=Joker"
        ]
    },
    {
        "nombre": "Harley Quinn",
        "nombreReal": "Harleen Quinzel",
        "aparicion": 1992,
        "casa": "DC",
        "biografia": "Ex-psiquiatra convertida en villana/antihéroe.",
        "equipamiento": [
            "Bate de béisbol"
        ],
        "imagenes": [
            "https://placehold.co/600x400?text=Harley+Quinn"
        ]
    },
    {
        "nombre": "Lex Luthor",
        "nombreReal": "Lex Luthor",
        "aparicion": 1940,
        "casa": "DC",
        "biografia": "Genio multimillonario y rival de Superman.",
        "equipamiento": [
            "Armadura de guerra"
        ],
        "imagenes": [
            "https://placehold.co/600x400?text=Lex+Luthor"
        ]
    },
    {
        "nombre": "Deathstroke",
        "nombreReal": "Slade Wilson",
        "aparicion": 1980,
        "casa": "DC",
        "biografia": "Mercenario y asesino mejorado genéticamente.",
        "equipamiento": [
            "Espada",
            "Rifles"
        ],
        "imagenes": [
            "https://placehold.co/600x400?text=Deathstroke"
        ]
    }
];

const seedDB = async () => {
    try {
        console.log("Intentando conectar a MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Conectado para la carga de datos.");

        console.log("Limpiando colección de superhéroes...");
        await Superhero.deleteMany({});
        console.log("✅ Colección limpia.");

        console.log("Insertando 40 personajes...");
        await Superhero.insertMany(superheroes);

        console.log("✅ ¡40 Superhéroes cargados con éxito!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error en el seeding:", error);
        process.exit(1);
    }
};

seedDB();