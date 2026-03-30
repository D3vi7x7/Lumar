import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { encyclopediaData } from '../data/mockData';
import { ModelViewer } from '../components/ModelViewer';
import { ArrowLeft, Lightbulb, ChevronRight } from 'lucide-react';

export const TopicPage: React.FC = () => {
  const { subjectId, topicId } = useParams<{ subjectId: string; topicId: string }>();

  const subject = subjectId ? encyclopediaData[subjectId] : null;
  const topic = subject?.topics.find((t) => t.id === topicId);

  if (!topic) return <div className="container" style={{ paddingTop: '4rem' }}>Topic not found</div>;

  const accentColor = subjectId === 'physics' ? 'var(--accent-cyan)' : 'var(--accent-purple)';

  // ── Topic has sub-sections → show section cards ────────────────────────────
  if (topic.subTopics && topic.subTopics.length > 0) {
    return (
      <div className="container animate-fade-in" style={{ paddingTop: '2rem' }}>
        <Link
          to={`/subject/${subjectId}`}
          style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-muted)', marginBottom: '1.5rem', textDecoration: 'none', transition: 'color 0.2s', alignSelf: 'flex-start' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <ArrowLeft size={18} style={{ marginRight: '0.5rem' }} /> Back to {subject?.title}
        </Link>

        <h1 className="text-gradient" style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>{topic.title}</h1>
        <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', maxWidth: '720px', marginBottom: '3rem', lineHeight: '1.7' }}>
          {topic.description}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '2rem' }}>
          {topic.subTopics.map((sub, i) => (
            <Link
              key={sub.id}
              to={`/subtopic/${subjectId}/${topicId}/${sub.id}`}
              className="glass-panel"
              style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', textDecoration: 'none', transition: 'all 0.3s ease', position: 'relative', overflow: 'hidden' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; }}
            >
              {/* coloured top bar — alternate cyan / purple */}
              <div style={{ height: '4px', width: '100%', position: 'absolute', top: 0, left: 0, background: i % 2 === 0 ? 'var(--gradient-primary)' : 'var(--gradient-secondary)' }} />
              <span style={{ fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: accentColor, marginBottom: '0.75rem', marginTop: '0.5rem' }}>
                Section {i + 1}
              </span>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{sub.title}</h3>
              <p style={{ color: 'var(--text-muted)', flexGrow: 1, fontSize: '1rem', lineHeight: '1.65', marginBottom: '2rem' }}>
                {sub.description.substring(0, 130)}…
              </p>
              <div style={{ display: 'flex', alignItems: 'center', color: accentColor, fontWeight: 600 }}>
                Explore in 3D <ChevronRight size={16} style={{ marginLeft: '0.4rem' }} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  // ── Normal topic → existing layout with model viewer ───────────────────────
  return (
    <div className="container animate-fade-in" style={{ paddingTop: '2rem', display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 80px)' }}>
      <Link
        to={`/subject/${subjectId}`}
        style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-muted)', marginBottom: '1.5rem', textDecoration: 'none', transition: 'color 0.2s', alignSelf: 'flex-start' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
      >
        <ArrowLeft size={18} style={{ marginRight: '0.5rem' }} /> Back to {subject?.title}
      </Link>

      <div style={{ display: 'flex', gap: '3rem', flexGrow: 1, paddingBottom: '3rem', flexWrap: 'wrap' }}>
        {/* Left Side: Content */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', minWidth: '300px' }}>
          <h1 className="text-gradient" style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>{topic.title}</h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '2.5rem', lineHeight: '1.8' }}>
            {topic.description}
          </p>
          <div className="glass-panel" style={{ padding: '2rem', marginTop: 'auto', borderLeft: `4px solid ${accentColor}` }}>
            <h3 style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', color: accentColor }}>
              <Lightbulb size={24} style={{ marginRight: '0.5rem' }} /> Fun Fact
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: '1.6' }}>{topic.funFact}</p>
          </div>
        </div>
        {/* Right Side: 3D AR Viewer */}
        <div style={{ flex: '1.5', minWidth: '350px', minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
          <ModelViewer modelType={topic.modelType} />
        </div>
      </div>
    </div>
  );
};
