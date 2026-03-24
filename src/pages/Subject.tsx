import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { encyclopediaData } from '../data/mockData';
import { ChevronRight, ArrowLeft } from 'lucide-react';

export const Subject: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const data = subjectId ? encyclopediaData[subjectId] : null;

  if (!data) return <div className="container" style={{paddingTop: '4rem'}}>Subject not found</div>;

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '2rem' }}>
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-muted)', marginBottom: '2rem', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
        <ArrowLeft size={18} style={{ marginRight: '0.5rem' }} /> Back to Home
      </Link>
      <h1 className="text-gradient" style={{ fontSize: '3.5rem', marginBottom: '1rem', display: 'inline-block' }}>{data.title}</h1>
      <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '4rem', maxWidth: '800px' }}>
        {data.description}
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
        {data.topics.map(topic => (
          <Link key={topic.id} to={`/topic/${subjectId}/${topic.id}`} className="glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', textDecoration: 'none', transition: 'all 0.3s ease', position: 'relative', overflow: 'hidden' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)'; }}>
            <div style={{ background: subjectId === 'physics' ? 'var(--gradient-primary)' : 'var(--gradient-secondary)', height: '4px', width: '100%', position: 'absolute', top: 0, left: 0 }}></div>
            <h3 style={{ fontSize: '1.75rem', marginBottom: '1rem', marginTop: '0.5rem' }}>{topic.title}</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', flexGrow: 1, fontSize: '1.1rem' }}>{topic.description.substring(0, 120)}...</p>
            <div style={{ display: 'flex', alignItems: 'center', color: subjectId === 'physics' ? 'var(--accent-blue)' : 'var(--accent-purple)', fontWeight: 600 }}>
              Explore 3D Model <ChevronRight size={18} style={{ marginLeft: '0.5rem' }} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
