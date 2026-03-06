/**
 * Industry options for the content form.
 * Each option has a label (shown to user), value (stored), and keywords (for search/matching).
 * The value maps to a blueprint key in advanced-generator.ts.
 */
export const INDUSTRY_OPTIONS = [
    {
        value: 'restoran',
        label: 'Restoran / Ugostiteljstvo',
        keywords: ['restoran', 'pizzeria', 'bistro', 'konoba', 'fast food', 'slastičarna', 'caffe', 'bar', 'pub', 'kafić', 'grill', 'sushi', 'burger', 'catering'],
    },
    {
        value: 'salon',
        label: 'Frizerski / Beauty salon',
        keywords: ['salon', 'frizer', 'kozmetičar', 'pediker', 'manikur', 'beauty', 'spa', 'masaža', 'wellness'],
    },
    {
        value: 'majstor',
        label: 'Obrt / Majstorske usluge',
        keywords: ['majstor', 'vodoinstalater', 'električar', 'keramičar', 'krovište', 'klima', 'stolar', 'bravar', 'soboslikar', 'fasader', 'moler'],
    },
    {
        value: 'zdravlje',
        label: 'Zdravstvo / Ordinacija',
        keywords: ['stomatolog', 'zubar', 'poliklinika', 'doktor', 'psiholog', 'psihoterapeut', 'fizioterapeut', 'ordinacija', 'klinika', 'medicina', 'veterinar', 'optičar', 'ljekarna'],
    },
    {
        value: 'turizam',
        label: 'Turizam / Smještaj',
        keywords: ['apartman', 'vila', 'opg', 'smještaj', 'hotel', 'hostel', 'turizam', 'kamp', 'soba', 'kuća za odmor', 'pansion', 'agroturizam'],
    },
    {
        value: 'b2b',
        label: 'Poslovne usluge / B2B',
        keywords: ['knjigovodstvo', 'agencija', 'konzalting', 'savjetovanje', 'marketing', 'odvjetnik', 'javni bilježnik', 'prevodilac', 'prijevod', 'revizija', 'outsourcing'],
    },
    {
        value: 'edukacija',
        label: 'Edukacija / Škola',
        keywords: ['autoškola', 'tečaj', 'instrukcije', 'škola', 'edukacija', 'seminar', 'radionica', 'kurs', 'akademija'],
    },
    {
        value: 'auto',
        label: 'Auto servis / Vozila',
        keywords: ['mehaničar', 'vulkanizer', 'rent a car', 'autolimar', 'autopraonica', 'auto servis', 'autokuća'],
    },
    {
        value: 'saas',
        label: 'IT / Software / Startup',
        keywords: ['saas', 'software', 'aplikacija', 'startup', 'tech', 'fintech', 'crypto', 'web app'],
    },
    {
        value: 'nekretnine',
        label: 'Nekretnine',
        keywords: ['nekretnine', 'agencija za nekretnine', 'real estate'],
    },
    {
        value: 'teretana',
        label: 'Fitness / Teretana',
        keywords: ['teretana', 'fitness', 'gym', 'crossfit', 'pilates', 'yoga', 'trening'],
    },
    {
        value: 'fotograf',
        label: 'Fotografija / Video',
        keywords: ['fotograf', 'videograf', 'snimanje', 'foto studio', 'drone'],
    },
    {
        value: 'default',
        label: 'Ostalo / Općenito',
        keywords: ['ostalo', 'općenito', 'drugo', 'razno'],
    },
] as const;

export type IndustryValue = typeof INDUSTRY_OPTIONS[number]['value'];
