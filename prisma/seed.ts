import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed de Tienda San José...");

  // ─────────────────────────────────────────────
  // CATEGORÍAS
  // ─────────────────────────────────────────────
  const categorias = await Promise.all([
    prisma.category.upsert({
      where: { slug: "articulos-religiosos" },
      update: {},
      create: {
        nombre: "Artículos Religiosos",
        slug: "articulos-religiosos",
        descripcion: "Imágenes, rosarios, crucifijos y artículos de devoción para el hogar y la oración.",
        imagen: null,
      },
    }),
    prisma.category.upsert({
      where: { slug: "biblias" },
      update: {},
      create: {
        nombre: "Biblias",
        slug: "biblias",
        descripcion: "Biblias en distintas ediciones y traducciones, con tapa dura o en piel.",
        imagen: null,
      },
    }),
    prisma.category.upsert({
      where: { slug: "ropa-ceremonial" },
      update: {},
      create: {
        nombre: "Ropa Ceremonial",
        slug: "ropa-ceremonial",
        descripcion: "Conjuntos de bautizo, ropones y ajuares para los sacramentos del bebé.",
        imagen: null,
      },
    }),
    prisma.category.upsert({
      where: { slug: "joyeria-plata" },
      update: {},
      create: {
        nombre: "Joyería en Plata 925",
        slug: "joyeria-plata",
        descripcion: "Medallas, cadenas, pulseras y aretes elaborados en plata esterlina 925.",
        imagen: null,
      },
    }),
    prisma.category.upsert({
      where: { slug: "joyeria-oro" },
      update: {},
      create: {
        nombre: "Joyería en Oro 14K",
        slug: "joyeria-oro",
        descripcion: "Medallas, argollas y cadenas en oro de 14 kilates para primera comunión y bautizo.",
        imagen: null,
      },
    }),
    prisma.category.upsert({
      where: { slug: "velas-especiales" },
      update: {},
      create: {
        nombre: "Velas Especiales",
        slug: "velas-especiales",
        descripcion: "Velas artesanales decoradas para bautizo, primera comunión, boda y XV años.",
        imagen: null,
      },
    }),
  ]);

  const [
    catArticulos,
    catBiblias,
    catRopa,
    catPlata,
    catOro,
    catVelas,
  ] = categorias;

  console.log(`✅ ${categorias.length} categorías creadas`);

  // ─────────────────────────────────────────────
  // ARTÍCULOS RELIGIOSOS (6 productos)
  // ─────────────────────────────────────────────
  const articulosReligiosos = [
    {
      nombre: "Rosario de Madera de Olivo con Cruz Grabada",
      descripcion: "Rosario artesanal elaborado en auténtica madera de olivo proveniente de Tierra Santa. Cada cuenta está tallada a mano con acabado natural.",
      precio: 18.99,
      stock: 75,
      imagen: null,
      attributes: { material: "madera de olivo" },
    },
    {
      nombre: "Crucifijo de Metal Dorado para Pared",
      descripcion: "Crucifijo de 30 cm elaborado en metal con acabado dorado envejecido. Incluye tornillos para instalación en pared.",
      precio: 34.50,
      stock: 40,
      imagen: null,
      attributes: { material: "metal" },
    },
    {
      nombre: "Imagen de la Virgen de Guadalupe en Cristal",
      descripcion: "Figura de cristal templado de la Virgen de Guadalupe, 15 cm de altura. Ideal como regalo de primera comunión o bautizo.",
      precio: 27.00,
      stock: 55,
      imagen: null,
      attributes: { material: "cristal" },
    },
    {
      nombre: "Rosario de Metal Plateado con Caja de Regalo",
      descripcion: "Rosario de cuentas en metal plateado con medalla central de la Virgen María. Presentado en estuche de madera con terciopelo.",
      precio: 22.95,
      stock: 90,
      imagen: null,
      attributes: { material: "metal" },
    },
    {
      nombre: "Nacimiento Completo en Madera de Olivo (11 piezas)",
      descripcion: "Nacimiento artesanal tallado en madera de olivo con 11 figuras: Sagrada Familia, Reyes Magos, pastores y animales.",
      precio: 89.00,
      stock: 20,
      imagen: null,
      attributes: { material: "madera de olivo" },
    },
    {
      nombre: "Ángel Guardián en Cristal Esmerilado",
      descripcion: "Figura decorativa de ángel guardián en cristal esmerilado con detalles dorados. Altura 20 cm, perfecto para el cuarto del bebé.",
      precio: 31.50,
      stock: 60,
      imagen: null,
      attributes: { material: "cristal" },
    },
  ];

  // ─────────────────────────────────────────────
  // BIBLIAS (5 productos)
  // ─────────────────────────────────────────────
  const biblias = [
    {
      nombre: "Biblia Reina Valera 1960 — Edición de Estudio, Tapa Dura",
      descripcion: "Edición de estudio con concordancia, mapas a color y notas al pie. Tapa dura azul marino con letras doradas. Tamaño estándar.",
      precio: 44.99,
      stock: 35,
      imagen: null,
      attributes: { edicion: "Reina Valera", tapa: "dura" },
    },
    {
      nombre: "Biblia NVI Letra Grande, Tapa Piel Color Vino",
      descripcion: "Biblia Nueva Versión Internacional con letra grande (12pt). Tapa en piel genuina color vino con canto dorado y marcador de tela.",
      precio: 59.00,
      stock: 28,
      imagen: null,
      attributes: { edicion: "NVI", tapa: "piel" },
    },
    {
      nombre: "Biblia de Estudio Thompson — Reina Valera, Tapa Piel",
      descripcion: "La Biblia Thompson con referencias encadenadas, concordancia exhaustiva y seis apéndices temáticos. Tapa en piel negra.",
      precio: 79.50,
      stock: 18,
      imagen: null,
      attributes: { edicion: "Estudio", tapa: "piel" },
    },
    {
      nombre: "Biblia NVI para Niños, Tapa Dura Ilustrada",
      descripcion: "Biblia completa NVI diseñada para niños de 6 a 12 años. Más de 200 ilustraciones a color e historias introductorias en cada libro.",
      precio: 29.95,
      stock: 50,
      imagen: null,
      attributes: { edicion: "NVI", tapa: "dura" },
    },
    {
      nombre: "Biblia Reina Valera Ultrafina — Tapa Piel Marrón",
      descripcion: "Edición ultrafina de solo 18 mm de grosor, perfecta para llevar a misa o estudio. Tapa en piel marrón con cremallera.",
      precio: 49.00,
      stock: 42,
      imagen: null,
      attributes: { edicion: "Reina Valera", tapa: "piel" },
    },
  ];

  // ─────────────────────────────────────────────
  // ROPA CEREMONIAL (5 productos)
  // ─────────────────────────────────────────────
  const ropaCeremonial = [
    {
      nombre: "Conjunto de Bautizo Bordado en Blanco (0-3 meses)",
      descripcion: "Conjunto completo de bautizo con ropón, gorro, zapatitos y babero. Confeccionado en piqué blanco con bordado de flores en hilo de seda.",
      precio: 55.00,
      stock: 30,
      imagen: null,
      attributes: { talla: "0-3 meses", color: "blanco" },
    },
    {
      nombre: "Ropón de Bautizo en Tul Marfil (3-6 meses)",
      descripcion: "Ropón largo de bautizo en tul marfil con capa de satén y detalles en encaje de algodón. Lazo trasero en moño grande.",
      precio: 68.00,
      stock: 22,
      imagen: null,
      attributes: { talla: "3-6 meses", color: "marfil" },
    },
    {
      nombre: "Ajuar Bautismal Completo en Blanco (6-12 meses)",
      descripcion: "Ajuar 7 piezas: ropón, saco, gorro, guantes, zapatitos, medias y pañuelo. Todo en piqué blanco con ribete perla.",
      precio: 85.00,
      stock: 15,
      imagen: null,
      attributes: { talla: "6-12 meses", color: "blanco" },
    },
    {
      nombre: "Vestido de Bautizo Estilo Princesa en Blanco (0-3 meses)",
      descripcion: "Vestido de bautizo con falda en capas de organza y cuerpo en satén blanco. Incluye diadema de flores y zapatitos a juego.",
      precio: 72.00,
      stock: 25,
      imagen: null,
      attributes: { talla: "0-3 meses", color: "blanco" },
    },
    {
      nombre: "Ropón Bautismal Vintage en Marfil (3-6 meses)",
      descripcion: "Ropón de estilo vintage elaborado a mano en encaje marfil con enagua de satén. Botones forrados de perla en la espalda.",
      precio: 95.00,
      stock: 12,
      imagen: null,
      attributes: { talla: "3-6 meses", color: "marfil" },
    },
  ];

  // ─────────────────────────────────────────────
  // JOYERÍA EN PLATA 925 (6 productos)
  // ─────────────────────────────────────────────
  const joyeriaPlata = [
    {
      nombre: "Medalla Milagrosa en Plata 925 con Cadena",
      descripcion: "Medalla de la Virgen Milagrosa en plata 925 de 18 mm. Incluye cadena Figaro de 45 cm en plata. Presentada en estuche de joyería.",
      precio: 38.00,
      stock: 80,
      imagen: null,
      attributes: { material: "Plata 925", peso: "2g" },
    },
    {
      nombre: "Pulsera de Cruz en Plata 925 para Bebé",
      descripcion: "Pulsera ajustable de plata 925 con dije de cruz para recién nacido. Cierre de seguridad antialérgico. Ideal para regalo de bautizo.",
      precio: 24.50,
      stock: 65,
      imagen: null,
      attributes: { material: "Plata 925", peso: "2g" },
    },
    {
      nombre: "Medalla de San Judas Tadeo en Plata 925 Grande",
      descripcion: "Medalla de 25 mm del Santo de las causas difíciles en plata 925. Acabado satinado con detalle grabado en relieve. Cadena de 50 cm incluida.",
      precio: 52.00,
      stock: 45,
      imagen: null,
      attributes: { material: "Plata 925", peso: "5g" },
    },
    {
      nombre: "Argolla Bautismal en Plata 925 con Nombre Grabado",
      descripcion: "Argolla lisa de plata 925 para bautizo con servicio de grabado personalizado (nombre + fecha). Peso 5g, presentada en estuche.",
      precio: 46.00,
      stock: 55,
      imagen: null,
      attributes: { material: "Plata 925", peso: "5g" },
    },
    {
      nombre: "Cadena Escape de Plata 925 — 50 cm",
      descripcion: "Cadena tipo escape (cable) en plata 925 de 1.2 mm de grosor y 50 cm de largo. Cierre de mosca. Compatible con todas las medallas de la tienda.",
      precio: 19.00,
      stock: 120,
      imagen: null,
      attributes: { material: "Plata 925", peso: "2g" },
    },
    {
      nombre: "Crucifijo Corpus en Plata 925 — Edición Especial",
      descripcion: "Crucifijo de 30 mm con corpus en alto relieve elaborado en plata 925. Detalle de rayos grabados. Cadena gruesa tipo barbada de 55 cm incluida.",
      precio: 78.00,
      stock: 30,
      imagen: null,
      attributes: { material: "Plata 925", peso: "8g" },
    },
  ];

  // ─────────────────────────────────────────────
  // JOYERÍA EN ORO 14K (6 productos)
  // ─────────────────────────────────────────────
  const joyeriaOro = [
    {
      nombre: "Medalla de la Virgen de Guadalupe en Oro 14K",
      descripcion: "Medalla ovalada de 20 mm con imagen grabada de la Virgen de Guadalupe en oro amarillo 14K. Cadena Figaro de 45 cm incluida.",
      precio: 145.00,
      stock: 20,
      imagen: null,
      attributes: { material: "Oro 14K", peso: "2g" },
    },
    {
      nombre: "Argolla Bautismal Lisa en Oro 14K",
      descripcion: "Argolla lisa de 10 mm de diámetro en oro amarillo 14K. Acabado pulido espejo. Incluye grabado de nombre sin costo adicional.",
      precio: 98.00,
      stock: 35,
      imagen: null,
      attributes: { material: "Oro 14K", peso: "2g" },
    },
    {
      nombre: "Medalla de San Cristóbal en Oro 14K con Cadena",
      descripcion: "Medalla redonda de 18 mm del protector de los viajeros en oro amarillo 14K. Cadena tipo Veneziana de 45 cm incluida.",
      precio: 165.00,
      stock: 15,
      imagen: null,
      attributes: { material: "Oro 14K", peso: "5g" },
    },
    {
      nombre: "Dije Corazón de Jesús en Oro 14K",
      descripcion: "Dije del Sagrado Corazón de Jesús de 16 mm en oro amarillo 14K con acabado satinado y detalles brillantes. Sin cadena.",
      precio: 120.00,
      stock: 25,
      imagen: null,
      attributes: { material: "Oro 14K", peso: "2g" },
    },
    {
      nombre: "Pulsera Escapulario en Oro 14K para Bebé",
      descripcion: "Pulsera ajustable de eslabón ovalado en oro 14K con medalla del Escapulario del Carmen. Talla bebé 0-12 meses.",
      precio: 185.00,
      stock: 18,
      imagen: null,
      attributes: { material: "Oro 14K", peso: "5g" },
    },
    {
      nombre: "Cruz de Primera Comunión en Oro 14K con Pedrería",
      descripcion: "Cruz de 20 mm en oro 14K con incrustaciones de circones blancos. Presentada en estuche de madera con certificado de autenticidad.",
      precio: 230.00,
      stock: 12,
      imagen: null,
      attributes: { material: "Oro 14K", peso: "8g" },
    },
  ];

  // ─────────────────────────────────────────────
  // VELAS ESPECIALES (6 productos)
  // ─────────────────────────────────────────────
  const velasEspeciales = [
    {
      nombre: "Vela Decorada para Bautizo con Lazo y Flores",
      descripcion: "Vela de parafina premium decorada a mano con flores de resina, lazo de organza y cinta personalizable con nombre del bebé.",
      precio: 22.00,
      stock: 60,
      imagen: null,
      attributes: { ocasion: "Bautizo", duracion: "20 horas" },
    },
    {
      nombre: "Set de 4 Velas para Boda — Estilo Rústico",
      descripcion: "Conjunto de 4 velas para ceremonia de boda: 2 cirios grandes (40 horas) y 2 velas decorativas (20 horas). Diseño rústico con lavanda seca.",
      precio: 58.00,
      stock: 30,
      imagen: null,
      attributes: { ocasion: "Boda", duracion: "40 horas" },
    },
    {
      nombre: "Vela de XV Años con Corona y Rosas",
      descripcion: "Vela ceremonial de 45 cm decorada con corona dorada y rosas en tonos rosas y dorados. Incluye base decorativa de madera. Dura hasta 40 horas.",
      precio: 45.00,
      stock: 25,
      imagen: null,
      attributes: { ocasion: "XV Años", duracion: "40 horas" },
    },
    {
      nombre: "Vela de Bautizo en Forma de Ángel",
      descripcion: "Vela artesanal con forma de ángel guardián de 25 cm. Elaborada en cera de abeja con fragancia suave a vainilla.",
      precio: 28.00,
      stock: 45,
      imagen: null,
      attributes: { ocasion: "Bautizo", duracion: "20 horas" },
    },
    {
      nombre: "Cirio Pascual Decorado para Boda — 60 cm",
      descripcion: "Cirio de 60 cm de altura decorado con motivos florales blancos y dorados. Ideal para altar de bodas. Acabado brillante.",
      precio: 75.00,
      stock: 20,
      imagen: null,
      attributes: { ocasion: "Boda", duracion: "40 horas" },
    },
    {
      nombre: "Kit Velas de XV Años — Última Muñeca (3 piezas)",
      descripcion: "Kit ceremonial de 3 velas para el rito de la última muñeca en quinceañera: 1 vela grande y 2 velas medianas a juego en tonos rosas.",
      precio: 65.00,
      stock: 22,
      imagen: null,
      attributes: { ocasion: "XV Años", duracion: "20 horas" },
    },
  ];

  // ─────────────────────────────────────────────
  // INSERTAR PRODUCTOS
  // ─────────────────────────────────────────────
  type ProductoSeed = {
    nombre: string;
    descripcion: string;
    precio: number;
    stock: number;
    imagen: null;
    attributes: Record<string, string | number>;
  };

  const insertar = async (
    productos: ProductoSeed[],
    categoryId: number,
    nombreCategoria: string
  ) => {
    let count = 0;
    for (const p of productos) {
      await prisma.product.upsert({
        where: {
          // upsert por nombre + categoría no es posible directamente,
          // usamos findFirst + create/skip
          id: (await prisma.product.findFirst({
            where: { nombre: p.nombre, categoryId },
            select: { id: true },
          }))?.id ?? 0,
        },
        update: {},
        create: {
          nombre: p.nombre,
          descripcion: p.descripcion,
          precio: p.precio,
          stock: p.stock,
          imagen: p.imagen,
          attributes: p.attributes,
          categoryId,
        },
      });
      count++;
    }
    console.log(`  ✅ ${count} productos en "${nombreCategoria}"`);
  };

  console.log("\n📦 Insertando productos...");
  await insertar(articulosReligiosos, catArticulos.id, catArticulos.nombre);
  await insertar(biblias, catBiblias.id, catBiblias.nombre);
  await insertar(ropaCeremonial, catRopa.id, catRopa.nombre);
  await insertar(joyeriaPlata, catPlata.id, catPlata.nombre);
  await insertar(joyeriaOro, catOro.id, catOro.nombre);
  await insertar(velasEspeciales, catVelas.id, catVelas.nombre);

  const totalProductos = await prisma.product.count();
  const totalCategorias = await prisma.category.count();

  // ─────────────────────────────────────────────
  // USUARIO ADMIN INICIAL
  // ─────────────────────────────────────────────
  console.log("\n👤 Verificando usuario admin...");
  const ADMIN_EMAIL = "admin@tiendasanjose.com";
  const ADMIN_PASSWORD = "Admin123!";

  const existingAdmin = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
    await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        password: hashedPassword,
        nombre: "Administrador",
        role: "ADMIN",
      },
    });
    console.log(`  ✅ Usuario admin creado: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  } else {
    console.log(`  ⏭️  Usuario admin ya existe: ${ADMIN_EMAIL}`);
  }

  console.log(`\n🎉 Seed completado:`);
  console.log(`   • ${totalCategorias} categorías`);
  console.log(`   • ${totalProductos} productos`);
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
