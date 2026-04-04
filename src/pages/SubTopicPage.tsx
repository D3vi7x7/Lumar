import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { encyclopediaData, magneticObjects, magnetInteractionObjects } from '../data/mockData';
import { ModelViewer } from '../components/ModelViewer';
import { ArrowLeft, Lightbulb, Magnet, Ban } from 'lucide-react';

export const SubTopicPage: React.FC = () => {
  const { subjectId, topicId, subTopicId } = useParams<{
    subjectId: string;
    topicId: string;
    subTopicId: string;
  }>();

  const subject = subjectId ? encyclopediaData[subjectId] : null;
  const topic = subject?.topics.find((t) => t.id === topicId);
  const subTopic = topic?.subTopics?.find((s) => s.id === subTopicId);

  const [selectedObject, setSelectedObject] = useState(magneticObjects[0].id);
  const [interactionObject, setInteractionObject] = useState(magnetInteractionObjects[0].id);

  if (!subTopic) {
    return <div className="container" style={{ paddingTop: '4rem' }}>Section not found</div>;
  }

  const accentColor = 'var(--accent-cyan)';
  const backTo = `/topic/${subjectId}/${topicId}`;

  // ── Magnetic & non-magnetic objects section ────────────────────────────────
  if (subTopicId === 'magnetic-objects') {
    const active = magneticObjects.find((o) => o.id === selectedObject)!;

    return (
      <div className="container animate-fade-in" style={{ paddingTop: '2rem', minHeight: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
        <Link
          to={backTo}
          style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-muted)', marginBottom: '1.5rem', textDecoration: 'none', transition: 'color 0.2s' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <ArrowLeft size={18} style={{ marginRight: '0.5rem' }} /> Back to {topic?.title}
        </Link>

        <h1 className="text-gradient" style={{ fontSize: '2.8rem', marginBottom: '0.5rem' }}>{subTopic.title}</h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', maxWidth: '680px', marginBottom: '2.5rem', lineHeight: '1.7' }}>
          {subTopic.description}
        </p>

        {/* Object picker */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          {magneticObjects.map((obj) => (
            <button
              key={obj.id}
              onClick={() => setSelectedObject(obj.id)}
              style={{
                padding: '0.6rem 1.2rem',
                borderRadius: 'var(--radius-full)',
                border: `1.5px solid ${selectedObject === obj.id ? accentColor : 'rgba(255,255,255,0.12)'}`,
                background: selectedObject === obj.id ? 'rgba(0,240,255,0.1)' : 'transparent',
                color: selectedObject === obj.id ? accentColor : 'var(--text-muted)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              {obj.isMagnetic
                ? <Magnet size={14} />
                : <Ban size={14} />}
              {obj.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '3rem', flexGrow: 1, flexWrap: 'wrap', paddingBottom: '3rem' }}>
          {/* 3-D viewer */}
          <div style={{ flex: '1.5', minWidth: '320px', minHeight: '460px' }}>
            <ModelViewer modelType={active.modelType} />
          </div>

          {/* Info panel */}
          <div style={{ flex: '1', minWidth: '260px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Magnetic badge */}
            <div
              className="glass-panel"
              style={{
                padding: '1.5rem 2rem',
                borderLeft: `4px solid ${active.isMagnetic ? accentColor : '#ff4d4d'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}
            >
              {active.isMagnetic
                ? <Magnet size={32} color={accentColor} />
                : <Ban size={32} color="#ff4d4d" />}
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: active.isMagnetic ? accentColor : '#ff4d4d' }}>
                  {active.isMagnetic ? 'Magnetic' : 'Non-Magnetic'}
                </div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {active.isMagnetic ? 'Attracted by a magnet' : 'Not attracted by a magnet'}
                </div>
              </div>
            </div>

            {/* Object description */}
            <div className="glass-panel" style={{ padding: '1.5rem 2rem' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>{active.label}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: '1.65' }}>{active.description}</p>
            </div>

            {/* Fun fact */}
            <div className="glass-panel" style={{ padding: '1.5rem 2rem', borderLeft: `4px solid ${accentColor}` }}>
              <h3 style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem', color: accentColor }}>
                <Lightbulb size={20} style={{ marginRight: '0.5rem' }} /> Fun Fact
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.98rem', lineHeight: '1.6' }}>
                {subTopic.funFact}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Attraction & Repulsion interaction section ──────────────────────────────
  if (subTopicId === 'attraction-repulsion') {
    const active = magnetInteractionObjects.find((o) => o.id === interactionObject)!;

    return (
      <div className="container animate-fade-in" style={{ paddingTop: '2rem', minHeight: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
        <Link
          to={backTo}
          style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-muted)', marginBottom: '1.5rem', textDecoration: 'none', transition: 'color 0.2s' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <ArrowLeft size={18} style={{ marginRight: '0.5rem' }} /> Back to {topic?.title}
        </Link>

        <h1 className="text-gradient" style={{ fontSize: '2.8rem', marginBottom: '0.5rem' }}>{subTopic.title}</h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', maxWidth: '680px', marginBottom: '2.5rem', lineHeight: '1.7' }}>
          {subTopic.description}
        </p>

        {/* Object picker */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          {magnetInteractionObjects.map((obj) => (
            <button
              key={obj.id}
              onClick={() => setInteractionObject(obj.id)}
              style={{
                padding: '0.6rem 1.2rem',
                borderRadius: 'var(--radius-full)',
                border: `1.5px solid ${interactionObject === obj.id ? accentColor : 'rgba(255,255,255,0.12)'}`,
                background: interactionObject === obj.id ? 'rgba(0,240,255,0.1)' : 'transparent',
                color: interactionObject === obj.id ? accentColor : 'var(--text-muted)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Magnet size={14} />
              {obj.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '3rem', flexGrow: 1, flexWrap: 'wrap', paddingBottom: '3rem' }}>
          {/* 3-D viewer */}
          <div style={{ flex: '1.5', minWidth: '320px', minHeight: '460px' }}>
            <ModelViewer modelType={active.modelType} />
          </div>

          {/* Info panel */}
          <div style={{ flex: '1', minWidth: '260px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Object description */}
            <div className="glass-panel" style={{ padding: '1.5rem 2rem', borderLeft: `4px solid ${accentColor}` }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>{active.label}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: '1.65' }}>{active.description}</p>
            </div>

            {/* Fun fact */}
            <div className="glass-panel" style={{ padding: '1.5rem 2rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem', color: accentColor }}>
                <Lightbulb size={20} style={{ marginRight: '0.5rem' }} /> Fun Fact
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.98rem', lineHeight: '1.6' }}>
                {subTopic.funFact}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Standard subtopic (Magnetic Fields + all future ones) ─────────────────
  return (
    <div className="container animate-fade-in" style={{ paddingTop: '2rem', display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 80px)' }}>
      <Link
        to={backTo}
        style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-muted)', marginBottom: '1.5rem', textDecoration: 'none', transition: 'color 0.2s', alignSelf: 'flex-start' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
      >
        <ArrowLeft size={18} style={{ marginRight: '0.5rem' }} /> Back to {topic?.title}
      </Link>

      <div style={{ display: 'flex', gap: '3rem', flexGrow: 1, paddingBottom: '3rem', flexWrap: 'wrap' }}>
        {/* Left: content */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', minWidth: '300px' }}>
          <h1 className="text-gradient" style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>{subTopic.title}</h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '2.5rem', lineHeight: '1.8' }}>
            {subTopic.description}
          </p>
          <div className="glass-panel" style={{ padding: '2rem', marginTop: 'auto', borderLeft: `4px solid ${accentColor}` }}>
            <h3 style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', color: accentColor }}>
              <Lightbulb size={24} style={{ marginRight: '0.5rem' }} /> Fun Fact
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: '1.6' }}>{subTopic.funFact}</p>
          </div>
        </div>

        {/* Right: 3D viewer */}
        <div style={{ flex: '1.5', minWidth: '350px', minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
          <ModelViewer modelType={subTopic.modelType} />
        </div>
      </div>
    </div>
  );
};
