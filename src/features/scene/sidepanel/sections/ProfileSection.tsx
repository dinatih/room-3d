import type { CvType } from '../modals/CvModal';

export interface ProfileSectionProps {
  isMobile: boolean;
  onOpenCv: (type: CvType) => void;
}

export function ProfileSection({ isMobile: _isMobile, onOpenCv }: ProfileSectionProps) {
  return (
    <div className="d-flex flex-column bg-transparent p-2 gap-2 small">
      {/* Intro rapide */}
      <div className="d-flex align-items-center gap-2 p-2 rounded bg-white bg-opacity-50 border border-light-subtle">
        <img
          src="https://avatars.githubusercontent.com/u/309161?v=4"
          alt="David Herelle"
          className="rounded-circle shadow-sm"
          style={{ width: '38px', height: '38px', objectFit: 'cover', border: '2px solid #d32f2f' }}
        />
        <div className="d-flex flex-column lh-sm">
          <strong className="text-dark small">David Herelle</strong>
          <span className="text-danger fw-semibold small">Architecte SI · DevOps · 3D</span>
          <span className="text-muted small">Paris 13e · Disponible</span>
        </div>
      </div>

      {/* Boutons d'accès aux CVs */}
      <div className="d-flex flex-column gap-1">
        <div className="text-muted fw-bold text-uppercase px-1 small" style={{ letterSpacing: '0.05em' }}>
          <i className="bi bi-file-earmark-person me-1" aria-hidden="true" />Consulter mes CVs (Modal 2D)
        </div>
        <button
          type="button"
          className="btn btn-outline-danger btn-sm text-start w-100 d-flex align-items-center justify-content-between py-1.5 px-2 shadow-sm small"
          onClick={() => onOpenCv('devops')}
        >
          <span className="d-flex align-items-center gap-2">
            <i className="bi bi-cpu text-danger"></i>
            <span className="fw-semibold">CV Ingénieur DevOps</span>
          </span>
          <span className="badge bg-danger bg-opacity-25 text-danger border border-danger-subtle">
            Ouvrir
          </span>
        </button>

        <button
          type="button"
          className="btn btn-outline-primary btn-sm text-start w-100 d-flex align-items-center justify-content-between py-1.5 px-2 shadow-sm small"
          onClick={() => onOpenCv('admin')}
        >
          <span className="d-flex align-items-center gap-2">
            <i className="bi bi-hdd-network text-primary"></i>
            <span className="fw-semibold">CV Administrateur Systèmes</span>
          </span>
          <span className="badge bg-primary bg-opacity-25 text-primary border border-primary-subtle">
            Ouvrir
          </span>
        </button>
      </div>

      {/* Points forts */}
      <div className="p-2 rounded bg-white bg-opacity-40 border border-light-subtle text-muted small lh-sm d-flex flex-column gap-1">
        <div><i className="bi bi-award me-1" aria-hidden="true" /><strong>8+ ans d'expérience</strong> en startups (JobTeaser, Saisirprudhommes, Tracktor, Mooncard)</div>
        <div><i className="bi bi-lightning-charge me-1" aria-hidden="true" /><strong>Opérationnel Jour 1</strong> : sans temps d'onboarding, autonome et pragmatique</div>
        <div><i className="bi bi-lightbulb me-1" aria-hidden="true" /><strong>Stack</strong> : Ruby on Rails, TypeScript, React 18, R3F / Three.js, PostgreSQL, Heroku, Linux</div>
        <div><i className="bi bi-robot me-1" aria-hidden="true" /><strong>Productivité</strong> démultipliée par l'encadrement d'agents IA</div>
      </div>

      <a
        href="https://dinatih.org/visualizer/"
        target="_blank"
        rel="noreferrer"
        className="btn btn-sm btn-outline-dark d-flex align-items-center justify-content-center gap-2 shadow-sm"
        title="Explorer graphiquement le code et son évolution au fil des commits"
      >
        <i className="bi bi-diagram-3" aria-hidden="true"></i>
        <span className="fw-semibold">Visualiseur du code</span>
        <i className="bi bi-box-arrow-up-right" aria-hidden="true"></i>
      </a>

      {/* Liens externes */}
      <div className="d-flex gap-2 mt-1">
        <a
          href="https://github.com/dinatih"
          target="_blank"
          rel="noreferrer"
          className="btn btn-sm btn-dark flex-grow-1 d-flex align-items-center justify-content-center gap-2 py-1 shadow-sm small"
        >
          <i className="bi bi-github"></i>
          <span className="fw-semibold">GitHub</span>
        </a>
        <a
          href="https://www.linkedin.com/in/dinatih/"
          target="_blank"
          rel="noreferrer"
          className="btn btn-sm btn-primary flex-grow-1 d-flex align-items-center justify-content-center gap-2 py-1 shadow-sm small"
          style={{ background: '#0a66c2', borderColor: '#0a66c2' }}
        >
          <i className="bi bi-linkedin"></i>
          <span className="fw-semibold">LinkedIn</span>
        </a>
      </div>
    </div>
  );
}
