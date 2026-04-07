export const APP_ID = 'manga_infinity_production_db_v1'; 

export const TIPOS = ["Todos", "Mangá", "Manhwa", "Manhua"];
export const GENEROS = ["Ação", "Aventura", "Romance", "Fantasia", "Sci-Fi", "Terror", "Sistema", "Isekai", "Escolar", "Artes Marciais", "Cultivo", "Comédia", "Drama", "Mistério", "Slice of Life", "Sobrenatural", "Histórico", "Esportes", "Mecha", "Psicológico"];
export const LIBRARY_STATUS = ["Lendo", "Planejo Ler", "Finalizado", "Dropado", "Favoritos"];

export const FALLBACK_SHOP_ITEMS = [
  { id: 'frame_neon', name: 'Aura Cósmica', type: 'frame', price: 500, css: 'ring-2 ring-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.8)]' },
  { id: 'frame_cyan', name: 'Neon Cibernético', type: 'frame', price: 1000, css: 'ring-2 ring-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.9)]' },
  { id: 'cover_galaxy', name: 'Nebulosa Infinita', type: 'cover', price: 1500, url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&q=80&w=800' }
];

export const MULTIVERSO_ENIGMAS = [
    { q: "Um menino feito de borracha navega os mares para encontrar o maior tesouro do mundo?", a: ["one piece", "luffy"] },
    { q: "A humanidade vive confinada em grandes muralhas para se proteger de gigantes devoradores de homens?", a: ["shingeki no kyojin", "attack on titan"] },
    { q: "Dois irmãos realizam o maior tabu da Alquimia e perdem seus corpos?", a: ["fullmetal alchemist", "fullmetal alchemist brotherhood"] },
    { q: "Um brilhante estudante encontra um caderno que mata qualquer pessoa cujo nome seja escrito nele.", a: ["death note"] },
    { q: "O Caçador de Rank E mais fraco sobrevive a uma masmorra dupla e desperta um sistema exclusivo.", a: ["solo leveling"] },
    { q: "Um jovem sem individualidade engole o fio de cabelo do herói número 1 para herdar seu poder.", a: ["boku no hero", "my hero academia"] },
    { q: "Um garoto gentil treina com uma espada especial para curar sua irmã mais nova, transformada em um Oni.", a: ["kimetsu no yaiba", "demon slayer"] },
    { q: "O protagonista engole um dedo amaldiçoado do Rei das Maldições para salvar seus amigos.", a: ["jujutsu kaisen"] }
];
