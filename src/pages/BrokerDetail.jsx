// Broker detail page routing and data fetching
// This ensures newly added brokers can be found and displayed correctly

import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';

// Shared Firebase config
const FIREBASE_URL = "https://froexbonuswhale-default-rtdb.firebaseio.com/brokers.json";

// Broker detail component
export default function BrokerDetail() {
  const { id } = useParams();
  const [broker, setBroker] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    const fetchBroker = async () => {
      try {
        setLoading(true);
        const res = await fetch(FIREBASE_URL);
        const data = await res.json();
        
        let brokers = [];
        if (Array.isArray(data)) {
          brokers = data;
        } else if (data && typeof data === 'object') {
          brokers = Object.values(data);
        }
        
        // Find the broker by ID (convert param to number for comparison)
        const found = brokers.find(b => b && b.id === parseInt(id));
        
        if (found) {
          setBroker(found);
          setError(false);
        } else {
          setError(true);
          setBroker(null);
        }
      } catch (err) {
        console.error('Failed to fetch broker:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchBroker();
  }, [id]);

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (error || !broker) return <div className="text-center py-12"><div>Broker not found.</div><div className="mt-4"><a href="/" className="text-yellow-500 hover:underline">Go back home</a></div></div>;

  return (
    <div className="broker-detail-page">
      <div className="broker-header">
        <h1>{broker.name}</h1>
        <p className="bonus-amount">{broker.bonusAmount}</p>
        <span className={`status-badge ${broker.status}`}>{broker.status}</span>
      </div>
      
      <div className="broker-content">
        <section>
          <h2>Bonus Details</h2>
          <p>{broker.rules}</p>
        </section>
        
        {broker.link && (
          <section>
            <a href={broker.link} target="_blank" rel="noopener noreferrer" className="btn-visit">
              Visit {broker.name}
            </a>
          </section>
        )}
        
        <section>
          <h3>Rating</h3>
          <p>{broker.ratingAvg > 0 ? `★ ${broker.ratingAvg.toFixed(2)}` : 'No ratings yet'}</p>
        </section>
        
        <section>
          <h3>Views</h3>
          <p>👁 {(broker.viewCount || 0).toLocaleString()}</p>
        </section>
      </div>
      
      <div className="back-link">
        <a href="/">← Go back home</a>
      </div>
    </div>
  );
}
