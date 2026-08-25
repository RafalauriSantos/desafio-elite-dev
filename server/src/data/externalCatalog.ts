export interface ExternalCatalogItem {
  externalId: string;
  source: 'tmdb' | 'ticketmaster';
  type: 'movie' | 'show';
  title: string;
  description: string;
  banner_url: string;
  category: string;
  venue?: string;
  date?: string;
}

export const EXTERNAL_CATALOG: ExternalCatalogItem[] = [
  // TMDb (Filmes & Cinema)
  {
    externalId: 'tmdb-1',
    source: 'tmdb',
    type: 'movie',
    title: 'Avatar: O Caminho da Água',
    description: 'Após formar uma família, Jake Sully e Neytiri fazem de tudo para ficarem juntos na lua Pandora.',
    banner_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    category: 'Cinema / Ficção'
  },
  {
    externalId: 'tmdb-2',
    source: 'tmdb',
    type: 'movie',
    title: 'Duna: Parte 2',
    description: 'Paul Atreides se une a Chani e aos Fremen enquanto busca vingança contra os conspiradores que destruíram sua família.',
    banner_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80',
    category: 'Cinema / Épico'
  },
  {
    externalId: 'tmdb-3',
    source: 'tmdb',
    type: 'movie',
    title: 'Oppenheimer',
    description: 'A história do físico americano J. Robert Oppenheimer e seu papel no Projeto Manhattan durante a Segunda Guerra Mundial.',
    banner_url: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=1200&q=80',
    category: 'Cinema / Drama'
  },
  {
    externalId: 'tmdb-4',
    source: 'tmdb',
    type: 'movie',
    title: 'Deadpool & Wolverine',
    description: 'Wolverine se recupera de seus ferimentos quando cruza o caminho do tagarela Deadpool.',
    banner_url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1200&q=80',
    category: 'Cinema / Ação'
  },
  {
    externalId: 'tmdb-5',
    source: 'tmdb',
    type: 'movie',
    title: 'Homem-Aranha: Através do Aranhaverso',
    description: 'Miles Morales é catapultado através do Multiverso, onde ele encontra uma equipe de Pessoas-Aranha.',
    banner_url: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?auto=format&fit=crop&w=1200&q=80',
    category: 'Cinema / Animação'
  },
  {
    externalId: 'tmdb-6',
    source: 'tmdb',
    type: 'movie',
    title: 'Interstellar: Re-exibição IMAX 10 Anos',
    description: 'Uma equipe de exploradores viaja através de um buraco de minhoca no espaço na tentativa de garantir a sobrevivência da humanidade.',
    banner_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    category: 'Cinema / Sci-Fi'
  },
  {
    externalId: 'tmdb-7',
    source: 'tmdb',
    type: 'movie',
    title: 'The Batman II',
    description: 'O Cavaleiro das Trevas enfrenta novas ameaças e corrupção nas profundezas de Gotham City.',
    banner_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
    category: 'Cinema / Policial'
  },
  {
    externalId: 'tmdb-8',
    source: 'tmdb',
    type: 'movie',
    title: 'Gladiador II',
    description: 'Anos após testemunhar a morte de Maximus, Lucius precisa entrar no Coliseu para salvar o Império.',
    banner_url: 'https://images.unsplash.com/photo-1568872396765-917c724d7698?auto=format&fit=crop&w=1200&q=80',
    category: 'Cinema / Histórico'
  },
  {
    externalId: 'tmdb-9',
    source: 'tmdb',
    type: 'movie',
    title: 'Blade Runner 2049 (Sessão Especial)',
    description: 'Um novo blade runner descobre um segredo há muito enterrado que pode mergulhar a sociedade no caos.',
    banner_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    category: 'Cinema / Neo-Noir'
  },
  {
    externalId: 'tmdb-10',
    source: 'tmdb',
    type: 'movie',
    title: 'Coringa: Delírio a Dois',
    description: 'Arthur Fleck encontra o amor e a música enquanto aguarda seu julgamento no Asilo Arkham.',
    banner_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
    category: 'Cinema / Musical Drama'
  },
  {
    externalId: 'tmdb-11',
    source: 'tmdb',
    type: 'movie',
    title: 'Matrix Resurrections (Sessão 4DX)',
    description: 'Thomas Anderson precisa escolher seguir o coelho branco mais uma vez na realidade simulação.',
    banner_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
    category: 'Cinema / 4DX'
  },
  {
    externalId: 'tmdb-12',
    source: 'tmdb',
    type: 'movie',
    title: 'Wicked: Parte 1',
    description: 'A história não contada das bruxas de Oz antes da chegada de Dorothy.',
    banner_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
    category: 'Cinema / Musical'
  },

  // Ticketmaster (Shows & Festivais)
  {
    externalId: 'tm-1',
    source: 'ticketmaster',
    type: 'show',
    title: 'Coldplay: Music of the Spheres Tour',
    description: 'A mundialmente aclamada turnê sustentável do Coldplay com hits inesquecíveis e show de luzes.',
    banner_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
    category: 'Show Internacional'
  },
  {
    externalId: 'tm-2',
    source: 'ticketmaster',
    type: 'show',
    title: 'Taylor Swift: The Eras Tour',
    description: 'Uma jornada musical através de todas as eras da carreira da maior artista pop da atualidade.',
    banner_url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
    category: 'Show Internacional'
  },
  {
    externalId: 'tm-3',
    source: 'ticketmaster',
    type: 'show',
    title: 'Rock in Rio 2026 - Dia Metal & Tech',
    description: 'O maior festival de música do planeta com palcos interativos e atrações mundiais.',
    banner_url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1200&q=80',
    category: 'Festival'
  },
  {
    externalId: 'tm-4',
    source: 'ticketmaster',
    type: 'show',
    title: 'The Weeknd: After Hours Til Dawn',
    description: 'Espetáculo épico stadium tour com infraestrutura cinematográfica e sintetizadores pulsantes.',
    banner_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
    category: 'Show Internacional'
  },
  {
    externalId: 'tm-5',
    source: 'ticketmaster',
    type: 'show',
    title: 'Bruno Mars: Live in São Paulo',
    description: 'Performances vibrantes de R&B, Funk e Pop com banda ao vivo no Estádio do MorumBIS.',
    banner_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
    category: 'Show Internacional'
  },
  {
    externalId: 'tm-6',
    source: 'ticketmaster',
    type: 'show',
    title: 'Ed Sheeran: +-=÷x Mathematics Tour',
    description: 'Apresentação solo acústica em palco 360 graus com pedais de loop ao vivo.',
    banner_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
    category: 'Show Internacional'
  },
  {
    externalId: 'tm-7',
    source: 'ticketmaster',
    type: 'show',
    title: 'Lollapalooza Brasil 2026 - Passaporte 3 Dias',
    description: '3 dias de pura música no Autódromo de Interlagos com mais de 70 bandas e DJs.',
    banner_url: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1200&q=80',
    category: 'Festival'
  },
  {
    externalId: 'tm-8',
    source: 'ticketmaster',
    type: 'show',
    title: 'Iron Maiden: Future Past World Tour',
    description: 'A lenda do Heavy Metal traz o espetáculo com faixas de Senjutsu e Somewhere in Time.',
    banner_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
    category: 'Show Heavy Metal'
  },
  {
    externalId: 'tm-9',
    source: 'ticketmaster',
    type: 'show',
    title: 'Imagine Dragons: LOOM World Tour',
    description: 'Show de rock alternativo repleto de energia com os maiores sucessos da banda.',
    banner_url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1200&q=80',
    category: 'Show Rock Alt'
  },
  {
    externalId: 'tm-10',
    source: 'ticketmaster',
    type: 'show',
    title: 'Beyoncé: RENAISSANCE World Tour',
    description: 'Celebrando a cultura Ballroom e Disco com cenografia de altíssimo nível no Allianz Parque.',
    banner_url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
    category: 'Show Pop'
  },
  {
    externalId: 'tm-11',
    source: 'ticketmaster',
    type: 'show',
    title: 'Green Day: The Saviors Tour',
    description: 'Celebrando 30 anos de Dookie e 20 anos de American Idiot na íntegra.',
    banner_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
    category: 'Show Punk Rock'
  },
  {
    externalId: 'tm-12',
    source: 'ticketmaster',
    type: 'show',
    title: 'Paul McCartney: Got Back Tour',
    description: 'Três horas de clássicos inesquecíveis dos Beatles, Wings e carreira solo.',
    banner_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
    category: 'Show Lenda do Rock'
  }
];
