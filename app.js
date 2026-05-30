// ============================================================
// FOREXBONUSWHALE - Complete Working Application
// ============================================================

const brokersData = {
    ndb: [
        { id: 1, name: 'Ryvotrade', bonus: '$100', status: 'active', rating: 4.7, reviews: 156, date: '2026-01-15', popularity: 95, description: '1. Register a new account\n2. Verify your ID and Phone\n3. Trade 5 lots within 30 days to withdraw profits\n4. Withdrawal minimum $50', link: 'https://ryvotrade.com' },
        { id: 2, name: 'InstaForex', bonus: '$1000', status: 'active', rating: 4.5, reviews: 234, date: '2025-11-20', popularity: 98, description: '1. Open a special promo account\n2. No deposit needed initially\n3. Deposit required to withdraw earned profits\n4. Valid for new clients only', link: 'https://instaforex.com' },
        { id: 3, name: 'XM Broker', bonus: '$30', status: 'active', rating: 4.6, reviews: 189, date: '2026-05-01', popularity: 92, description: '1. Valid for new clients only\n2. Non-withdrawable bonus\n3. All profits made can be withdrawn without restrictions\n4. No trading requirement', link: 'https://xm.com' },
        { id: 4, name: 'FxPro', bonus: '$100', status: 'active', rating: 4.4, reviews: 142, date: '2026-03-10', popularity: 87, description: '1. Register and verify account\n2. Trade 5 standard lots\n3. Bonus valid for 60 days\n4. Applies to all account types', link: 'https://fxpro.com' },
        { id: 5, name: 'ActivTrades', bonus: '$50', status: 'active', rating: 4.3, reviews: 98, date: '2026-02-14', popularity: 79, description: '1. New account opening\n2. Email verification required\n3. Trade 2 lots to withdraw\n4. Limited time offer', link: 'https://activtrades.com' },
        { id: 6, name: 'FXCM', bonus: '$200', status: 'inactive', rating: 4.2, reviews: 178, date: '2025-08-22', popularity: 85, description: '1. Minimum deposit required\n2. Trade 5 standard lots\n3. 30-day validity period\n4. Not available in all regions', link: 'https://fxcm.com' },
        { id: 7, name: 'Pepperstone', bonus: '$75', status: 'active', rating: 4.8, reviews: 205, date: '2026-04-05', popularity: 94, description: '1. Account verification needed\n2. Trade requirement 5 lots\n3. Instant credit to account\n4. Valid worldwide', link: 'https://pepperstone.com' },
        { id: 8, name: 'Libertex', bonus: '$50', status: 'active', rating: 4.1, reviews: 127, date: '2026-01-30', popularity: 76, description: '1. Mobile app registration\n2. Email confirmation\n3. Trade 3 lots minimum\n4. Quick withdrawal process', link: 'https://libertex.com' },
        { id: 9, name: 'Admiral Markets', bonus: '$125', status: 'active', rating: 4.6, reviews: 198, date: '2026-02-28', popularity: 89, description: '1. Registration and verification\n2. Trade 5 lots within 60 days\n3. Multiple currency options\n4. Educational resources included', link: 'https://admiralmarkets.com' },
        { id: 10, name: 'HFM', bonus: '$250', status: 'active', rating: 4.7, reviews: 187, date: '2026-05-10', popularity: 96, description: '1. Verify personal documents\n2. Trade 5 standard lots\n3. Bonus expires in 90 days\n4. VIP support included', link: 'https://hfm.com' },
        { id: 11, name: 'IC Markets', bonus: '$100', status: 'active', rating: 4.5, reviews: 165, date: '2025-12-12', popularity: 86, description: '1. Open ECN account\n2. Verify phone and email\n3. Trade requirement: 5 lots\n4. Fast execution required', link: 'https://icmarkets.com' },
        { id: 12, name: 'Roboforex', bonus: '$30', status: 'inactive', rating: 4.0, reviews: 142, date: '2025-10-05', popularity: 74, description: '1. New client registration\n2. Standard account\n3. Trade 2 lots\n4. Verification required', link: 'https://roboforex.com' },
        { id: 13, name: 'Tickmill', bonus: '$150', status: 'active', rating: 4.4, reviews: 119, date: '2026-03-22', popularity: 82, description: '1. Register account\n2. Verify documentation\n3. Trade 5 lots within 30 days\n4. No restrictions on instrument trading', link: 'https://tickmill.com' },
        { id: 14, name: 'OctaFX', bonus: '$50', status: 'active', rating: 4.3, reviews: 201, date: '2026-04-18', popularity: 88, description: '1. Create trading account\n2. Phone verification\n3. Trade 2 lots\n4. Cashback program available', link: 'https://octafx.com' },
        { id: 15, name: 'MultiBank Group', bonus: '$100', status: 'active', rating: 4.6, reviews: 154, date: '2026-01-28', popularity: 90, description: '1. Register on platform\n2. Verify identity\n3. Trade 5 standard lots\n4. Funds in local currency', link: 'https://multibankgroup.com' },
        { id: 16, name: 'Exness', bonus: '$75', status: 'active', rating: 4.7, reviews: 267, date: '2026-05-05', popularity: 97, description: '1. Create free account\n2. Email confirmation\n3. Trade 2.5 lots\n4. Unlimited leverage allowed', link: 'https://exness.com' },
        { id: 17, name: 'HM Broker', bonus: '$120', status: 'active', rating: 4.5, reviews: 143, date: '2026-04-22', popularity: 84, description: '1. Quick registration process\n2. Instant account activation\n3. Trade 3 lots minimum\n4. Fast withdrawals guaranteed', link: 'https://hmbroker.com' },
        { id: 18, name: 'Primer Broker', bonus: '$90', status: 'active', rating: 4.4, reviews: 118, date: '2026-03-18', popularity: 81, description: '1. Simple account setup\n2. Beginner-friendly platform\n3. Trade 4 lots to claim bonus\n4. Multiple bonus options available', link: 'https://primerbroker.com' },
        { id: 19, name: 'IronFX', bonus: '$120', status: 'active', rating: 4.4, reviews: 138, date: '2026-03-31', popularity: 84, description: '1. Complete registration\n2. Phone and email verification\n3. Trade 3 standard lots\n4. Copy trading available', link: 'https://ironfx.com' },
        { id: 20, name: 'FP Markets', bonus: '$80', status: 'active', rating: 4.5, reviews: 172, date: '2026-04-12', popularity: 91, description: '1. New account setup\n2. Identity verification\n3. Trade 5 lots\n4. Rebates available', link: 'https://fpmarkets.com' }
    ],
    db: [
        { id: 101, name: 'Exness', bonus: '100% Match', status: 'active', rating: 4.7, reviews: 289, date: '2026-01-10', popularity: 99, description: '1. Deposit minimum $100\n2. Get 100% bonus credit\n3. Valid for 30 days\n4. Withdraw bonus after trading requirement', link: 'https://exness.com' },
        { id: 102, name: 'FxPro', bonus: '50% Cash Match', status: 'active', rating: 4.4, reviews: 156, date: '2026-02-20', popularity: 86, description: '1. Deposit any amount\n2. Get 50% bonus cash\n3. Maximum $500 bonus\n4. 60-day validity', link: 'https://fxpro.com' },
        { id: 103, name: 'Pepperstone', bonus: '100% up to $1000', status: 'active', rating: 4.8, reviews: 234, date: '2026-03-05', popularity: 94, description: '1. Deposit $100-$1000\n2. Receive 100% bonus\n3. Wagering requirement: 10x\n4. Trade on any asset', link: 'https://pepperstone.com' },
        { id: 104, name: 'Admiral Markets', bonus: '75% Bonus', status: 'active', rating: 4.6, reviews: 198, date: '2026-01-25', popularity: 89, description: '1. Deposit minimum $250\n2. Get 75% deposit bonus\n3. Maximum $2000 bonus\n4. 45-day period', link: 'https://admiralmarkets.com' },
        { id: 105, name: 'HFM', bonus: '200% Super Bonus', status: 'active', rating: 4.7, reviews: 267, date: '2026-04-10', popularity: 97, description: '1. First deposit $500+\n2. Receive 200% bonus\n3. Instant credit\n4. VIP treatment', link: 'https://hfm.com' },
        { id: 106, name: 'XM Broker', bonus: '100% Welcome', status: 'inactive', rating: 4.6, reviews: 212, date: '2025-10-30', popularity: 92, description: '1. Deposit minimum $100\n2. Get 100% bonus\n3. Limited period offer\n4. Terms apply', link: 'https://xm.com' },
        { id: 107, name: 'InstaForex', bonus: '50% Cashback', status: 'active', rating: 4.5, reviews: 189, date: '2026-02-14', popularity: 85, description: '1. Deposit and trade\n2. Earn 50% cashback\n3. Daily withdrawals\n4. No minimum trading', link: 'https://instaforex.com' },
        { id: 108, name: 'Libertex', bonus: '100% Match', status: 'active', rating: 4.1, reviews: 134, date: '2026-03-18', popularity: 77, description: '1. Deposit minimum $50\n2. Receive 100% credit\n3. Trade on platform\n4. Keep profits', link: 'https://libertex.com' },
        { id: 109, name: 'Roboforex', bonus: '50% up to $1000', status: 'active', rating: 4.0, reviews: 121, date: '2026-01-05', popularity: 73, description: '1. New trading account\n2. Deposit $100+\n3. Get 50% match\n4. Withdraw anytime', link: 'https://roboforex.com' },
        { id: 110, name: 'FXCM', bonus: '$500 Welcome', status: 'active', rating: 4.2, reviews: 167, date: '2026-02-28', popularity: 81, description: '1. Register account\n2. Deposit minimum $200\n3. Get $500 bonus\n4. 60-day limit', link: 'https://fxcm.com' },
        { id: 111, name: 'IC Markets', bonus: '100% up to $500', status: 'active', rating: 4.5, reviews: 178, date: '2026-03-22', popularity: 87, description: '1. Open ECN account\n2. Deposit $50-$500\n3. Get 100% bonus\n4. Fast execution', link: 'https://icmarkets.com' },
        { id: 112, name: 'OctaFX', bonus: '60% Deposit Match', status: 'inactive', rating: 4.3, reviews: 195, date: '2025-09-15', popularity: 80, description: '1. Deposit minimum $100\n2. Receive 60% match\n3. Maximum $600 bonus\n4. Promo expired', link: 'https://octafx.com' },
        { id: 113, name: 'Tickmill', bonus: '50% Welcome', status: 'active', rating: 4.4, reviews: 138, date: '2026-04-02', popularity: 83, description: '1. New account only\n2. Deposit $200+\n3. Get 50% bonus\n4. No restrictions', link: 'https://tickmill.com' },
        { id: 114, name: 'ActivTrades', bonus: '100% Match', status: 'active', rating: 4.3, reviews: 112, date: '2026-01-20', popularity: 79, description: '1. Deposit minimum $100\n2. Instant 100% credit\n3. 30-day validity\n4. Easy withdrawal', link: 'https://activtrades.com' },
        { id: 115, name: 'HM Broker', bonus: '100% up to $2000', status: 'active', rating: 4.5, reviews: 151, date: '2026-02-08', popularity: 85, description: '1. First deposit $100\n2. Get 100% credit\n3. Maximum $2000 bonus\n4. Trading requirement: 20x', link: 'https://hmbroker.com' },
        { id: 116, name: 'Primer Broker', bonus: '75% Match up to $750', status: 'active', rating: 4.3, reviews: 127, date: '2026-03-10', popularity: 80, description: '1. Deposit and trade\n2. 75% bonus credit\n3. Maximum $750 bonus\n4. 45-day validity', link: 'https://primerbroker.com' },
        { id: 117, name: 'MultiBank Group', bonus: '100% up to $2000', status: 'active', rating: 4.6, reviews: 163, date: '2026-02-08', popularity: 88, description: '1. First deposit $100\n2. Get 100% credit\n3. Maximum $2000 bonus\n4. Trading requirement: 20x', link: 'https://multibankgroup.com' },
        { id: 118, name: 'Ryvotrade', bonus: '50% Match', status: 'active', rating: 4.7, reviews: 174, date: '2026-05-01', popularity: 93, description: '1. Deposit minimum $100\n2. Get 50% bonus\n3. Maximum $500 credit\n4. Best conditions', link: 'https://ryvotrade.com' },
        { id: 119, name: 'IronFX', bonus: '100% up to $1500', status: 'active', rating: 4.4, reviews: 147, date: '2026-04-15', popularity: 85, description: '1. Register account\n2. Deposit minimum $150\n3. Receive 100% credit\n4. 90-day validity', link: 'https://ironfx.com' },
        { id: 120, name: 'FP Markets', bonus: '100% Match', status: 'active', rating: 4.5, reviews: 181, date: '2026-03-28', popularity: 90, description: '1. Deposit $100+\n2. Instant 100% credit\n3. 45-day expiry\n4. Multiple deposit methods', link: 'https://fpmarkets.com' }
    ],
    contests: [
        { id: 201, name: 'HFM Trading Championship', bonus: '$50,000 Prize', status: 'active', rating: 4.8, reviews: 267, date: '2026-01-15', popularity: 98, description: '1. Monthly demo contest\n2. Trade demo account\n3. No real money needed\n4. Top 10 get prizes\n5. Leaderboard competition', link: 'https://hfm.com' },
        { id: 202, name: 'Exness Trading Contest', bonus: '$100,000 Pool', status: 'active', rating: 4.7, reviews: 289, date: '2026-02-10', popularity: 97, description: '1. Weekly contests\n2. Real account trading\n3. Multiple winners\n4. Cash prizes\n5. No entry fee', link: 'https://exness.com' },
        { id: 203, name: 'FxPro Championship', bonus: '$25,000 Rewards', status: 'active', rating: 4.5, reviews: 178, date: '2026-03-05', popularity: 88, description: '1. Monthly leaderboard\n2. Trading in live market\n3. Top 20 traders win\n4. Cash rewards\n5. Transparent scoring', link: 'https://fxpro.com' },
        { id: 204, name: 'Pepperstone Competition', bonus: '$30,000 Monthly', status: 'active', rating: 4.6, reviews: 234, date: '2026-01-20', popularity: 91, description: '1. Demo and live options\n2. Multiple categories\n3. Flexible entry\n4. Fair judging\n5. Monthly winners', link: 'https://pepperstone.com' },
        { id: 205, name: 'Admiral Markets Demo Contest', bonus: '$10,000 Prize', status: 'inactive', rating: 4.4, reviews: 156, date: '2025-12-15', popularity: 79, description: '1. Demo account only\n2. Risk-free trading\n3. Monthly contests\n4. Winners announced\n5. Currently offline', link: 'https://admiralmarkets.com' },
        { id: 206, name: 'IC Markets Trading Challenge', bonus: '$20,000 Total', status: 'active', rating: 4.5, reviews: 198, date: '2026-02-28', popularity: 86, description: '1. ECN account competition\n2. Advanced traders\n3. Quarterly contests\n4. Major prizes\n5. Live trading', link: 'https://icmarkets.com' },
        { id: 207, name: 'XM Traders Cup', bonus: '$150,000 Prize', status: 'active', rating: 4.7, reviews: 267, date: '2026-04-01', popularity: 96, description: '1. Annual competition\n2. Real money trading\n3. Top 100 traders\n4. Huge rewards\n5. Live scoring', link: 'https://xm.com' },
        { id: 208, name: 'InstaForex Contest', bonus: '$50,000 Monthly', status: 'active', rating: 4.4, reviews: 213, date: '2026-03-10', popularity: 87, description: '1. Monthly contests\n2. Demo or real\n3. Multiple prizes\n4. Fair competition\n5. Easy participation', link: 'https://instaforex.com' },
        { id: 209, name: 'OctaFX Trading Arena', bonus: '$100,000 Year', status: 'active', rating: 4.3, reviews: 189, date: '2026-02-05', popularity: 84, description: '1. Quarterly contests\n2. Leaderboard system\n3. Prizes every quarter\n4. Trading requirement\n5. All levels welcome', link: 'https://octafx.com' },
        { id: 210, name: 'Libertex Trading Tournament', bonus: '$15,000 Prize', status: 'inactive', rating: 4.1, reviews: 124, date: '2025-11-20', popularity: 72, description: '1. Monthly tournaments\n2. Demo platform\n3. Beginner-friendly\n4. Winners get cash\n5. Currently paused', link: 'https://libertex.com' },
        { id: 211, name: 'HM Broker Challenge', bonus: '$35,000 Annual', status: 'active', rating: 4.5, reviews: 162, date: '2026-04-08', popularity: 85, description: '1. Quarterly tournaments\n2. Real account trading\n3. Top performers win\n4. Fair judging\n5. Professional environment', link: 'https://hmbroker.com' },
        { id: 212, name: 'Primer Broker Competition', bonus: '$25,000 Year', status: 'active', rating: 4.3, reviews: 134, date: '2026-03-20', popularity: 81, description: '1. Monthly contests\n2. Demo and real options\n3. Multiple winners\n4. Easy participation\n5. All traders welcome', link: 'https://primerbroker.com' },
        { id: 213, name: 'Tickmill Challenge', bonus: '$25,000 Annual', status: 'active', rating: 4.4, reviews: 167, date: '2026-03-22', popularity: 82, description: '1. Quarterly events\n2. Real trading\n3. Top performers win\n4. Fair rules\n5. Professional traders', link: 'https://tickmill.com' },
        { id: 214, name: 'ActivTrades Competition', bonus: '$10,000 Monthly', status: 'active', rating: 4.2, reviews: 138, date: '2026-04-10', popularity: 78, description: '1. Monthly challenges\n2. Fixed entry fee\n3. Transparent judging\n4. Cash prizes\n5. Multiple winners', link: 'https://activtrades.com' },
        { id: 215, name: 'MultiBank Trading Challenge', bonus: '$40,000 Total', status: 'active', rating: 4.6, reviews: 176, date: '2026-02-20', popularity: 89, description: '1. Twice yearly\n2. Real account\n3. Attractive prizes\n4. Global participation\n5. Professional level', link: 'https://multibankgroup.com' },
        { id: 216, name: 'Roboforex Trading Cup', bonus: '$30,000 Prize', status: 'active', rating: 4.0, reviews: 104, date: '2026-01-10', popularity: 75, description: '1. Annual championship\n2. Demo and real\n3. International event\n4. Various prizes\n5. Accessible to all', link: 'https://roboforex.com' },
        { id: 217, name: 'IronFX Trading Championship', bonus: '$35,000 Annual', status: 'active', rating: 4.3, reviews: 152, date: '2026-04-05', popularity: 81, description: '1. Annual event\n2. Multiple divisions\n3. Real trading\n4. Major prizes\n5. Professional traders', link: 'https://ironfx.com' },
        { id: 218, name: 'FXCM Trading Tournaments', bonus: '$50,000 Quarterly', status: 'inactive', rating: 4.1, reviews: 145, date: '2025-10-30', popularity: 73, description: '1. Quarterly events\n2. Real trading\n3. Major prizes\n4. Competitive\n5. Not currently active', link: 'https://fxcm.com' },
        { id: 219, name: 'FP Markets Competition', bonus: '$45,000 Year', status: 'active', rating: 4.5, reviews: 184, date: '2026-03-28', popularity: 90, description: '1. Ongoing contests\n2. Multiple categories\n3. Flexible entry\n4. Regular winners\n5. Best payouts', link: 'https://fpmarkets.com' },
        { id: 220, name: 'Ryvotrade Trading Cup', bonus: '$60,000 Annual', status: 'active', rating: 4.6, reviews: 198, date: '2026-05-10', popularity: 93, description: '1. Major event\n2. Real trading\n3. Top prizes\n4. Monthly rounds\n5. All traders welcome', link: 'https://ryvotrade.com' }
    ]
};

let currentSort = {};
let currentFilter = {};
let lastSection = 'home';
let reviews = {};

document.addEventListener('DOMContentLoaded', function() {
    loadReviews();
    renderAll();
    updateCounts();
});

function loadReviews() {
    const stored = localStorage.getItem('forexBonusReviews');
    reviews = stored ? JSON.parse(stored) : {};
}

function saveReviews() {
    localStorage.setItem('forexBonusReviews', JSON.stringify(reviews));
}

function updateCounts() {
    document.getElementById('ndb-count').textContent = brokersData.ndb.length;
    document.getElementById('db-count').textContent = brokersData.db.length;
    document.getElementById('contests-count').textContent = brokersData.contests.length;
}

function renderAll() {
    renderBrokers('ndb');
    renderBrokers('db');
    renderBrokers('contests');
}

function renderBrokers(type) {
    const brokers = brokersData[type];
    const container = document.getElementById(`${type}-list`);
    if (!container) return;

    let filtered = [...brokers];
    const filter = currentFilter[type] || 'all';
    if (filter !== 'all') {
        filtered = filtered.filter(b => b.status === filter);
    }

    const sort = currentSort[type] || 'popular';
    filtered.sort((a, b) => {
        switch(sort) {
            case 'popular': return b.popularity - a.popularity;
            case 'rated': return b.rating - a.rating;
            case 'newest': return new Date(b.date) - new Date(a.date);
            case 'oldest': return new Date(a.date) - new Date(b.date);
            default: return 0;
        }
    });

    container.innerHTML = filtered.map(broker => `
        <div class="broker-card p-6 rounded-xl cursor-pointer hover:ring-2 hover:ring-yellow-500 transition-all" onclick="window.location.href='details.html?broker=' + encodeURIComponent('${broker.name}') + '&type=${type}'">
            <div class="flex justify-between items-start mb-3">
                <h3 class="text-lg md:text-xl font-bold text-white">${broker.name}</h3>
                <span class="badge-${broker.status} p
