// Token package configuration (shared between client and server)
export const TOKEN_PACKAGES = [
    {
        id: 'tokens_500',
        tokens: 500,
        price: 5, // EUR
        name: '500 Tokena',
        description: '~10 AI izmjena',
    },
    {
        id: 'tokens_1500',
        tokens: 1500,
        price: 12, // EUR
        name: '1500 Tokena',
        description: '~30 AI izmjena',
        popular: true,
        savings: '20%'
    },
    {
        id: 'tokens_5000',
        tokens: 5000,
        price: 35, // EUR
        name: '5000 Tokena',
        description: '~100 AI izmjena',
        savings: '30%'
    },
];
