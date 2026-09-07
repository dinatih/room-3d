import type { CvType } from '../modals/CvModal';

export interface ProfileSectionProps {
  isMobile: boolean;
  onOpenCv: (type: CvType) => void;
}

export function ProfileSection({ isMobile, onOpenCv }: ProfileSectionProps) {
  return (
    <div className="d-flex flex-column bg-transparent p-2 gap-2" style={{ fontSize: isMobile ? '13px' : '11px' }}>
      {/* Intro rapide */}
      <div className="d-flex align-items-center gap-2 p-2 rounded bg-white bg-opacity-50 border border-light-subtle">
        <img
          src="https://avatars.githubusercontent.com/u/309161?v=4"
          alt="David Herelle"
          className="rounded-circle shadow-sm"
          style={{ width: '38px', height: '38px', objectFit: 'cover', border: '2px solid #d32f2f' }}
        />
        <div className="d-flex flex-column" style={{ lineHeight: 1.25 }}>
          <strong className="text-dark" style={{ fontSize: '12px' }}>David Herelle</strong>
          <span className="text-danger fw-semibold" style={{ fontSize: '10px' }}>Architecte SI · DevOps · 3D</span>
          <span className="text-muted" style={{ fontSize: '9px' }}>Paris 13e · Disponible</span>
        </div>
      </div>

      {/* Boutons d'accès aux CVs */}
      <div className="d-flex flex-column gap-1">
        <div className="text-muted fw-bold text-uppercase px-1" style={{ fontSize: '9px', letterSpacing: '0.05em' }}>
          📄 Consulter mes CVs (Modal 2D)
        </div>
        <button
          type="button"
          className="btn btn-outline-danger btn-sm text-start w-100 d-flex align-items-center justify-content-between py-1.5 px-2 shadow-sm"
          style={{ fontSize: isMobile ? '13px' : '11px' }}
          onClick={() => onOpenCv('devops')}
        >
          <span className="d-flex align-items-center gap-2">
            <i className="bi bi-cpu text-danger" style={{ fontSize: '13px' }}></i>
            <span className="fw-semibold">CV Ingénieur DevOps</span>
          </span>
          <span className="badge bg-danger bg-opacity-25 text-danger border border-danger-subtle" style={{ fontSize: '9px' }}>
            Ouvrir
          </span>
        </button>

        <button
          type="button"
          className="btn btn-outline-primary btn-sm text-start w-100 d-flex align-items-center justify-content-between py-1.5 px-2 shadow-sm"
          style={{ fontSize: isMobile ? '13px' : '11px' }}
          onClick={() => onOpenCv('admin')}
        >
          <span className="d-flex align-items-center gap-2">
            <i className="bi bi-hdd-network text-primary" style={{ fontSize: '13px' }}></i>
            <span className="fw-semibold">CV Administrateur Systèmes</span>
          </span>
          <span className="badge bg-primary bg-opacity-25 text-primary border border-primary-subtle" style={{ fontSize: '9px' }}>
            Ouvrir
          </span>
        </button>
      </div>

      {/* Points forts */}
      <div className="p-2 rounded bg-white bg-opacity-40 border border-light-subtle text-muted" style={{ fontSize: '10px', lineHeight: 1.4 }}>
        <div>🎯 <strong>8+ ans d'expérience</strong> en startups (JobTeaser, Saisirprudhommes, Tracktor, Mooncard)</div>
        <div>⚡ <strong>Opérationnel Jour 1</strong> : sans temps d'onboarding, autonome et pragmatique</div>
        <div>💡 <strong>Stack</strong> : Ruby on Rails, TypeScript, React 18, R3F / Three.js, PostgreSQL, Heroku, Linux</div>
        <div>🤖 <strong>Productivité</strong> démultipliée par l'encadrement d'agents IA</div>
      </div>

      {/* Liens externes */}
      <div className="d-flex gap-2 mt-1">
        <a
          href="https://github.com/dinatih"
          target="_blank"
          rel="noreferrer"
          className="btn btn-sm btn-dark flex-grow-1 d-flex align-items-center justify-content-center gap-1.5 py-1.5 shadow-sm"
          style={{ fontSize: '11px' }}
        >
          <i className="bi bi-github" style={{ fontSize: '13px' }}></i>
          <span className="fw-semibold">GitHub</span>
        </a>
        <a
          href="https://www.linkedin.com/in/dinatih/"
          target="_blank"
          rel="noreferrer"
          className="btn btn-sm btn-primary flex-grow-1 d-flex align-items-center justify-content-center gap-1.5 py-1.5 shadow-sm"
          style={{ fontSize: '11px', background: '#0a66c2', borderColor: '#0a66c2' }}
        >
          <i className="bi bi-linkedin" style={{ fontSize: '13px' }}></i>
          <span className="fw-semibold">LinkedIn</span>
        </a>
      </div>
    </div>
  );
}
